// src/lib/supabase.js
// Supabase client — fails gracefully if keys are not configured.
// The app shows mock data instead of crashing.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseKey);

if (!SUPABASE_CONFIGURED && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Not configured — app will use mock data.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

// Even with placeholder values, createClient won't crash —
// calls will just fail and fall through to mock data.
export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder-key',
  {
    auth: {
      persistSession:    false,
      autoRefreshToken:  false,
      detectSessionInUrl: false,
    },
    global: {
      // Silence Supabase's own error logs when not configured
      fetch: SUPABASE_CONFIGURED ? undefined : () => Promise.reject(new Error('Supabase not configured')),
    },
  }
);
