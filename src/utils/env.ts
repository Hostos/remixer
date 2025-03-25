// Environment variable utility functions

/**
 * Safely access environment variables with type safety
 */
export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined`);
    return '';
  }
  
  return value as string;
};

/**
 * Specific environment variables with strong typing
 */
export const env = {
  OPENAI_API_KEY: getEnv('VITE_OPENAI_API_KEY'),
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY')
}; 