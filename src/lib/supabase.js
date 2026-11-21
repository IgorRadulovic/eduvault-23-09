// src/lib/supabase.js
// Supabase client — fails gracefully if keys are not configured.
// The app shows mock data instead of crashing.
//
// Auth: users sign in with Firebase. Every request carries the current
// Firebase ID token (Supabase Third-Party Auth), so Row Level Security
// policies know who the user is. Logged-out visitors fall back to the anon key.

import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseKey);

if (!SUPABASE_CONFIGURED && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Not configured — app will use mock data.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

// Firebase refreshes the token automatically when it is close to expiry.
export async function getFirebaseToken() {
  return (await auth?.currentUser?.getIdToken()) ?? null;
}

// Even with placeholder values, createClient won't crash —
// calls will just fail and fall through to mock data.
export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder-key',
  {
    accessToken: getFirebaseToken,
    global: {
      // Silence Supabase's own error logs when not configured
      fetch: SUPABASE_CONFIGURED ? undefined : () => Promise.reject(new Error('Supabase not configured')),
    },
  }
);
