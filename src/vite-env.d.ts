/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_GOOGLE_DRIVE_CLIENT_ID?: string
  readonly VITE_GOOGLE_DRIVE_BACKUP_FILE_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
