import { exportBackupJson } from "./exportJson"
import { parseBackupJson } from "./importJson"
import type { BackupFile } from "./backupTypes"

const googleIdentityScriptSrc = "https://accounts.google.com/gsi/client"
const driveApiBaseUrl = "https://www.googleapis.com/drive/v3"
const driveUploadBaseUrl = "https://www.googleapis.com/upload/drive/v3"
const driveAppDataScope = "https://www.googleapis.com/auth/drive.appdata"
const backupMimeType = "application/json"
const defaultBackupFileName = "upraglog-backup.json"
const tokenRequestTimeoutMs = 120_000

const googleDriveClientId =
  import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID?.trim() ?? ""

const googleDriveBackupFileName =
  import.meta.env.VITE_GOOGLE_DRIVE_BACKUP_FILE_NAME?.trim() ||
  defaultBackupFileName

type GoogleTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type GoogleTokenClient = {
  requestAccessToken: () => void
}

type GoogleTokenClientConfig = {
  client_id: string
  scope: string
  callback: (response: GoogleTokenResponse) => void
  error_callback?: (error: GoogleTokenError) => void
}

type GoogleTokenError = {
  type?: string
  message?: string
}

type DriveFileMetadata = {
  id: string
  name: string
  modifiedTime?: string
}

type DriveFileList = {
  files?: DriveFileMetadata[]
}

export type GoogleDriveBackupLoadResult = {
  backup: BackupFile
  fileName: string
  modifiedTime?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (
            config: GoogleTokenClientConfig,
          ) => GoogleTokenClient
        }
      }
    }
  }
}

let googleIdentityScriptPromise: Promise<void> | undefined

function assertGoogleDriveConfigured() {
  if (!googleDriveClientId) {
    throw new Error(
      "Google Drive backup needs VITE_GOOGLE_DRIVE_CLIENT_ID in .env.local.",
    )
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts.oauth2) {
    return Promise.resolve()
  }

  googleIdentityScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${googleIdentityScriptSrc}"]`,
    )

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve()
        return
      }

      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener(
        "error",
        () => {
          existingScript.remove()
          reject(new Error("Google sign-in script could not be loaded."))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement("script")

    script.async = true
    script.defer = true
    script.src = googleIdentityScriptSrc
    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error("Google sign-in script could not be loaded."))
    }
    document.head.append(script)
  }).catch((error: unknown) => {
    googleIdentityScriptPromise = undefined
    throw error
  })

  return googleIdentityScriptPromise
}

function formatGoogleTokenError(error: GoogleTokenError) {
  return error.message || error.type || "Google authorization failed."
}

export function preloadGoogleDriveBackup() {
  void loadGoogleIdentityScript().catch(() => undefined)
}

async function requestDriveAccessToken() {
  assertGoogleDriveConfigured()
  await loadGoogleIdentityScript()

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const timeoutId = window.setTimeout(() => {
      settle(undefined, new Error("Google sign-in was canceled or timed out."))
    }, tokenRequestTimeoutMs)

    const settle = (token?: string, error?: Error) => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)

      if (error) {
        reject(error)
        return
      }

      if (token) {
        resolve(token)
        return
      }

      reject(new Error("Google authorization did not return an access token."))
    }

    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: googleDriveClientId,
      scope: driveAppDataScope,
      callback: (response) => {
        if (response.error) {
          settle(
            undefined,
            new Error(
              response.error_description ||
                response.error ||
                "Google authorization failed.",
            ),
          )
          return
        }

        settle(response.access_token)
      },
      error_callback: (error) =>
        settle(undefined, new Error(formatGoogleTokenError(error))),
    })

    if (!tokenClient) {
      settle(undefined, new Error("Google authorization is unavailable."))
      return
    }

    tokenClient.requestAccessToken()
  })
}

async function readDriveError(response: Response) {
  try {
    const data = (await response.clone().json()) as {
      error?: { message?: string }
    }
    const message = data.error?.message

    if (message) {
      return message
    }
  } catch {
    // Fall through to the text body or a status-based message.
  }

  const text = await response.text()

  return text || `Google Drive request failed with ${response.status}.`
}

async function driveRequest(
  accessToken: string,
  url: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers)

  headers.set("Authorization", `Bearer ${accessToken}`)

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw new Error(await readDriveError(response))
  }

  return response
}

async function driveJsonRequest<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
) {
  const response = await driveRequest(accessToken, url, init)

  return (await response.json()) as T
}

async function driveTextRequest(
  accessToken: string,
  url: string,
  init?: RequestInit,
) {
  const response = await driveRequest(accessToken, url, init)

  return response.text()
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

async function findGoogleDriveBackupFile(accessToken: string) {
  const params = new URLSearchParams({
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "1",
    q: `name = '${escapeDriveQueryValue(
      googleDriveBackupFileName,
    )}' and trashed = false`,
    spaces: "appDataFolder",
  })
  const fileList = await driveJsonRequest<DriveFileList>(
    accessToken,
    `${driveApiBaseUrl}/files?${params.toString()}`,
  )

  return fileList.files?.[0]
}

function createMultipartUploadBody(
  metadata: Record<string, unknown>,
  content: string,
) {
  const boundary = `upraglog_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${backupMimeType}; charset=UTF-8`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n")

  return { body, boundary }
}

async function uploadGoogleDriveBackup(
  accessToken: string,
  content: string,
) {
  const existingFile = await findGoogleDriveBackupFile(accessToken)
  const metadata: Record<string, unknown> = {
    appProperties: {
      app: "upraglog",
      kind: "backup",
    },
    mimeType: backupMimeType,
    name: googleDriveBackupFileName,
  }

  if (!existingFile) {
    metadata.parents = ["appDataFolder"]
  }

  const { body, boundary } = createMultipartUploadBody(metadata, content)
  const fileUrl = existingFile
    ? `${driveUploadBaseUrl}/files/${encodeURIComponent(existingFile.id)}`
    : `${driveUploadBaseUrl}/files`
  const params = new URLSearchParams({
    fields: "id,name,modifiedTime",
    uploadType: "multipart",
  })

  return driveJsonRequest<DriveFileMetadata>(
    accessToken,
    `${fileUrl}?${params.toString()}`,
    {
      body,
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      method: existingFile ? "PATCH" : "POST",
    },
  )
}

async function downloadGoogleDriveBackup(
  accessToken: string,
  file: DriveFileMetadata,
) {
  const params = new URLSearchParams({ alt: "media" })

  return driveTextRequest(
    accessToken,
    `${driveApiBaseUrl}/files/${encodeURIComponent(file.id)}?${params.toString()}`,
  )
}

export async function backupToGoogleDrive() {
  const accessToken = await requestDriveAccessToken()
  const backupJson = await exportBackupJson()
  const file = await uploadGoogleDriveBackup(accessToken, backupJson)
  const timestamp = file.modifiedTime
    ? new Date(file.modifiedTime).toLocaleString()
    : new Date().toLocaleString()

  return `Google Drive backup saved at ${timestamp}.`
}

export async function loadBackupFromGoogleDrive(): Promise<GoogleDriveBackupLoadResult> {
  const accessToken = await requestDriveAccessToken()
  const file = await findGoogleDriveBackupFile(accessToken)

  if (!file) {
    throw new Error("No Google Drive backup was found for this app.")
  }

  const backupJson = await downloadGoogleDriveBackup(accessToken, file)
  const backup = parseBackupJson(backupJson)

  return {
    backup,
    fileName: file.name,
    modifiedTime: file.modifiedTime,
  }
}
