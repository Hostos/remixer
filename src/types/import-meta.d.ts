// import-meta.d.ts
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 