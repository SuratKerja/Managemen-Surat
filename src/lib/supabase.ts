import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type DatabaseMode = 'sandbox' | 'production' | 'staging';

export const DEFAULT_SUPABASE_URL = 'https://ncwqsxocpxzqdisijcr.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jd3FzeG9jY3B4enFkaXNpamNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Mjg2NTQsImV4cCI6MjEwNjMwNDY1NH0.O46992LDQvl3J6fd6jaQnhRKO6TfWi_TNtlBGxocVbw';

/**
 * Deteksi apakah aplikasi saat ini berjalan di lingkungan AI Studio Dev / Preview atau localhost
 */
export const isRunningInAIStudio = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host.includes('run.app') ||
    host.includes('googleusercontent.com') ||
    host.includes('localhost') ||
    host === '127.0.0.1'
  );
};

/**
 * Cek apakah proteksi otomatis AI Studio diaktifkan
 */
export const isAutoSandboxEnabled = (): boolean => {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem('AUTO_SANDBOX_AI_STUDIO');
  return stored === null ? true : stored === 'true';
};

export const setAutoSandboxEnabled = (enabled: boolean): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('AUTO_SANDBOX_AI_STUDIO', String(enabled));
  }
};

/**
 * Dapatkan mode database saat ini ('sandbox' | 'production' | 'staging')
 */
export const getDatabaseMode = (): DatabaseMode => {
  if (typeof localStorage === 'undefined') return 'production';

  // Jika aplikasi di-hosting di Netlify / domain produksi publik:
  // Nilai default mutlak adalah 'production' (terkoneksi langsung dengan Supabase)
  if (!isRunningInAIStudio()) {
    const customMode = localStorage.getItem('CUSTOM_SUPABASE_MODE') as DatabaseMode | null;
    return customMode || 'production';
  }

  // Jika di mode desain / preview Google AI Studio:
  // Nilai default adalah 'sandbox' (mode terisolasi dari database production)
  const customMode = localStorage.getItem('CUSTOM_SUPABASE_MODE') as DatabaseMode | null;
  if (customMode && (customMode === 'sandbox' || customMode === 'production')) {
    return customMode;
  }
  return 'sandbox';
};

/**
 * Set mode database
 */
export const setDatabaseMode = (mode: DatabaseMode): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('CUSTOM_SUPABASE_MODE', mode);
  }
};

/**
 * Cek apakah saat ini mode Sandbox aktif (tidak terhubung ke Supabase Production)
 */
export const isSandboxMode = (): boolean => {
  return getDatabaseMode() === 'sandbox';
};

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
  const mode = getDatabaseMode();
  if (mode === 'staging') {
    const stagingUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('STAGING_SUPABASE_URL') : null;
    const stagingKey = typeof localStorage !== 'undefined' ? localStorage.getItem('STAGING_SUPABASE_ANON_KEY') : null;
    return {
      url: getCleanUrl(stagingUrl),
      anonKey: getCleanKey(stagingKey)
    };
  }

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

export const updateSupabaseClient = (url: string, key: string, isStaging = false): SupabaseClient => {
  const finalUrl = getCleanUrl(url);
  const finalKey = getCleanKey(key);
  if (typeof localStorage !== 'undefined') {
    if (isStaging) {
      localStorage.setItem('STAGING_SUPABASE_URL', finalUrl);
      localStorage.setItem('STAGING_SUPABASE_ANON_KEY', finalKey);
    } else {
      localStorage.setItem('CUSTOM_SUPABASE_URL', finalUrl);
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', finalKey);
    }
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
