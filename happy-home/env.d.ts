/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the access-code backend, without trailing slash. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
