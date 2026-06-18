// Environment configuration
// This file reads environment variables and provides them to the application

export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
} as const;

// Ensure Supabase keys are present
if (!config.supabaseUrl || !config.supabaseKey) {
  console.warn('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing.');
}

export const getApiUrl = (): string => {
  if (config.apiUrl) return config.apiUrl;
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export type Config = typeof config;
