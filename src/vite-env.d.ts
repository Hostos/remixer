/// <reference types="vite/client" />

// This augments the ImportMetaEnv interface
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Add any other environment variables your app uses here
  [key: string]: any
}

// This augments the global ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv
}
