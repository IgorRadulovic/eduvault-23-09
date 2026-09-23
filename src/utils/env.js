export function validateEnv() {
  const missing = ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'].filter(k => !import.meta.env[k]);
  if (missing.length > 0) console.warn('[EduVault] Missing env vars:\n' + missing.map(k => `  ⚠️ ${k}`).join('\n'));
}
export const env = { siteUrl: import.meta.env.VITE_SITE_URL ?? 'https://eduvault.com', isDev: import.meta.env.DEV ?? false, isProd: import.meta.env.PROD ?? false };
