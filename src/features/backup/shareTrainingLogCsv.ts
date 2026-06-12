import { getSettings } from "@/db/repositories/settingsRepo"
import { downloadTextFile } from "./exportJson"
import { exportTrainingLogCsv } from "./exportTrainingLogCsv"
import { buildTrainingLogShareInstructions } from "./shareTrainingLogMessage"

type ShareTrainingLogCsvOptions = {
  monthLimit?: number | null
  shareMessage?: string
  includeMessage?: boolean
  includeAiInstructions?: boolean
  attachMessageAsFile?: boolean
}

type DownloadReason =
  | "share-unavailable"
  | "files-not-shareable"
  | "share-failed"

export type ShareTrainingLogCsvResult =
  | { status: "shared" }
  | { status: "downloaded"; reason: DownloadReason }
  | { status: "canceled" }

function canShareData(shareData: ShareData) {
  if (typeof navigator.canShare !== "function") {
    return true
  }

  try {
    return navigator.canShare(shareData)
  } catch {
    return false
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function downloadCsv(filename: string, text: string, reason: DownloadReason) {
  downloadTextFile(filename, text, "text/csv;charset=utf-8")
  return { status: "downloaded", reason } satisfies ShareTrainingLogCsvResult
}

function shareCandidates(candidates: Array<ShareData | undefined>) {
  return candidates.filter(
    (candidate): candidate is ShareData =>
      candidate !== undefined && canShareData(candidate),
  )
}

export async function shareTrainingLogCsv(
  options: ShareTrainingLogCsvOptions = {},
): Promise<ShareTrainingLogCsvResult> {
  const settings = await getSettings()
  const monthLimit =
    "monthLimit" in options
      ? options.monthLimit
      : settings.spreadsheetExportMonthLimit
  const includeMessage =
    options.includeMessage ?? settings.spreadsheetShareIncludeMessage
  const includeAiInstructions =
    options.includeAiInstructions ??
    settings.spreadsheetShareIncludeAiInstructions
  const attachMessageAsFile =
    options.attachMessageAsFile ??
    settings.spreadsheetShareAttachMessageAsFile
  const shareMessage = options.shareMessage ?? settings.spreadsheetShareMessage
  const { filename, text } = await exportTrainingLogCsv({ monthLimit })
  const file = new File([text], filename, { type: "text/csv" })
  const shareTextParts = [
    includeMessage ? shareMessage.trim() : "",
    includeAiInstructions ? await buildTrainingLogShareInstructions() : "",
  ].filter(Boolean)
  const shareText = shareTextParts.join("\n\n")
  const shareMessageFile = attachMessageAsFile && shareText
    ? new File([shareText], "upraglog-share-message.txt", {
        type: "text/plain",
      })
    : undefined
  const title = "Upraglog training log"
  const textFileOnlyShareData: ShareData | undefined = shareMessageFile
    ? {
        files: [file, shareMessageFile],
        title,
      }
    : undefined
  const fileShareData: ShareData = {
    files: [file],
    title,
  }
  const fullShareData: ShareData | undefined = shareText
    ? {
        ...fileShareData,
        text: shareText,
      }
    : undefined

  if (typeof navigator.share !== "function") {
    return downloadCsv(filename, text, "share-unavailable")
  }

  const shareDataCandidates = shareCandidates(
    attachMessageAsFile
      ? [textFileOnlyShareData, fullShareData, fileShareData]
      : [fullShareData, fileShareData],
  )

  if (shareDataCandidates.length === 0) {
    return downloadCsv(filename, text, "files-not-shareable")
  }

  for (const shareData of shareDataCandidates) {
    try {
      await navigator.share(shareData)
      return { status: "shared" }
    } catch (error) {
      if (isAbortError(error)) {
        return { status: "canceled" }
      }
    }
  }

  return downloadCsv(filename, text, "share-failed")
}
