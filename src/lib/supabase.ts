import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ncwqsxocpxzqdisijcr.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jd3FzeG9jY3B4enFkaXNpamNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Mjg2NTQsImV4cCI6MjEwNjMwNDY1NH0.O46992LDQvl3J6fd6jaQnhRKO6TfWi_TNtlBGxocVbw';

export const getCleanUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_SUPABASE_URL;
  }
  let cleaned = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null' || cleaned.length < 10) {
    return DEFAULT_SUPABASE_URL;
  }
  cleaned = cleaned.replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
};

export const getCleanKey = (rawKey?: string | null): string => {
  if (!rawKey || typeof rawKey !== 'string') {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  let cleaned = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null' || cleaned.length < 20) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return cleaned;
};

const metaEnv = (import.meta as any).env || {};

export const getStoredSupabaseConfig = (): { url: string; anonKey: string } => {
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_URL') : null;
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') : null;
  return {
    url: getCleanUrl(customUrl || metaEnv.VITE_SUPABASE_URL),
    anonKey: getCleanKey(customKey || metaEnv.VITE_SUPABASE_ANON_KEY)
  };
};

const initialConfig = getStoredSupabaseConfig();

export const SUPABASE_URL = initialConfig.url;
export const SUPABASE_ANON_KEY = initialConfig.anonKey;

export const createCustomSupabaseClient = (url?: string, key?: string): SupabaseClient => {
  const finalUrl = getCleanUrl(url || SUPABASE_URL);
  const finalKey = getCleanKey(key || SUPABASE_ANON_KEY);
  return createClient(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
};

export let supabase: SupabaseClient = createCustomSupabaseClient();

export const updateSupabaseClient = (url: string, key: string): SupabaseClient => {
  const finalUrl = getCleanUrl(url);
  const finalKey = getCleanKey(key);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('CUSTOM_SUPABASE_URL', finalUrl);
    localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', finalKey);
  }
  supabase = createCustomSupabaseClient(finalUrl, finalKey);
  return supabase;
};

export const resetSupabaseConfigToDefault = (): SupabaseClient => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('CUSTOM_SUPABASE_URL');
    localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
  }
  supabase = createCustomSupabaseClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  return supabase;
};
