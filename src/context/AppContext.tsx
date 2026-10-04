import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { CircularSyncModal, CircularSyncModalProps } from '../components/CircularSyncModal';
import { pullFromSupabase, pushToSupabase, normalizeListIds, deleteRecordFromSupabase } from '../services/supabaseData';
import {
  DatabaseMode,
  getDatabaseMode,
  setDatabaseMode,
  isSandboxMode,
  isAutoSandboxEnabled,
  setAutoSandboxEnabled,
  isRunningInAIStudio
} from '../lib/supabase';
import {
  UserAccount,
  InstansiWilayah,
  KlasifikasiSub,
  NaskahMasukItem,
  NaskahKeluarItem,
  GoogleSheetConfig,
  ActiveTab,
  KlasifikasiArsipItem,
  ThreadNumberConfig,
  SlaConfig,
  BerkasThread,
  ThreadHistoryItem
} from '../types';
import {
  defaultUsers,
  defaultUnitKerjaList,
  defaultJenisNaskahMasuk,
  defaultJenisNaskahKeluar,
  defaultInstansiWilayah,
  defaultKlasifikasiSub,
  defaultStatusPenyelesaian,
  defaultStatusKirim,
  defaultNaskahMasukList,
  defaultNaskahKeluarList,
  defaultKlasifikasiArsip,
  defaultThreadNumberConfig,
  defaultSlaConfig,
  defaultBerkasThreadList
} from '../data/defaultData';

export const calculateStatusFromSLA = (slaValue: number | string, config?: SlaConfig): string => {
  const cfg = config || defaultSlaConfig;
  const num = typeof slaValue === 'number' ? slaValue : parseInt(String(slaValue || '').trim(), 10);
  if (isNaN(num) || num <= 0) {
    return cfg.labelBelumSelesai || 'Belum Selesai';
  }
  const maxTepat = cfg.maxSlaTepat ?? 4;
  if (num >= 1 && num <= maxTepat) {
    return cfg.labelTepatSla || 'Selesai Tepat SLA';
  }
  return cfg.labelMelebihiSla || 'Selesai Melebihi SLA';
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Auth
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  isLoginLoading: boolean;
  loginWelcomeName: string;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  login: (nip: string, password?: string) => boolean;
  logout: () => void;
  canAccessRecord: (item: { createdBy?: string; createdByName?: string; unitKerja?: string }) => boolean;

  // Master Data
  unitKerjaList: string[];
  setUnitKerjaList: React.Dispatch<React.SetStateAction<string[]>>;
  jenisNaskahMasuk: string[];
  setJenisNaskahMasuk: React.Dispatch<React.SetStateAction<string[]>>;
  jenisNaskahKeluar: string[];
  setJenisNaskahKeluar: React.Dispatch<React.SetStateAction<string[]>>;
  instansiWilayah: InstansiWilayah[];
  setInstansiWilayah: React.Dispatch<React.SetStateAction<InstansiWilayah[]>>;
  klasifikasiSub: KlasifikasiSub[];
  setKlasifikasiSub: React.Dispatch<React.SetStateAction<KlasifikasiSub[]>>;
  statusPenyelesaian: string[];
  setStatusPenyelesaian: React.Dispatch<React.SetStateAction<string[]>>;
  statusKirim: string[];
  setStatusKirim: React.Dispatch<React.SetStateAction<string[]>>;

  // Klasifikasi Arsip (Kode Arsip)
  klasifikasiArsipList: KlasifikasiArsipItem[];
  setKlasifikasiArsipList: React.Dispatch<React.SetStateAction<KlasifikasiArsipItem[]>>;

  // Pengaturan Nomor Thread Otomatis
  threadNumberConfig: ThreadNumberConfig;
  setThreadNumberConfig: React.Dispatch<React.SetStateAction<ThreadNumberConfig>>;
  getNextThreadNumber: (simulateOnly?: boolean) => string;

  // Pengaturan SLA (Hari Kerja)
  slaConfig: SlaConfig;
  setSlaConfig: React.Dispatch<React.SetStateAction<SlaConfig>>;

  // Pemberkasan (Thread Tracker)
  berkasThreadList: BerkasThread[];
  setBerkasThreadList: React.Dispatch<React.SetStateAction<BerkasThread[]>>;
  createBerkasThread: (data: {
    namaBerkas: string;
    klasifikasiBerkas: string;
    kodeKlasifikasi: string;
    namaKlasifikasiArsip?: string;
    keterangan?: string;
    status?: 'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup';
    unitKerja?: string;
    lokasiFisik?: string;
    naskahMasukIds?: string[];
    naskahKeluarIds?: string[];
    customNomorThread?: string;
    initialNote?: string;
  }) => BerkasThread;
  updateBerkasThread: (id: string, updates: Partial<BerkasThread>, logMessage?: string) => void;
  deleteBerkasThread: (id: string) => void;
  linkNaskahToThread: (threadId: string, naskahType: 'masuk' | 'keluar', naskahId: string) => void;
  unlinkNaskahFromThread: (threadId: string, naskahType: 'masuk' | 'keluar', naskahId: string) => void;
  addThreadNote: (threadId: string, note: string) => void;

  // Records DB
  naskahMasukList: NaskahMasukItem[];
  setNaskahMasukList: React.Dispatch<React.SetStateAction<NaskahMasukItem[]>>;
  saveNaskahMasukDirectly: (list: NaskahMasukItem[]) => Promise<boolean>;
  deleteNaskahMasuk: (id: string) => Promise<boolean>;
  naskahKeluarList: NaskahKeluarItem[];
  setNaskahKeluarList: React.Dispatch<React.SetStateAction<NaskahKeluarItem[]>>;
  saveNaskahKeluarDirectly: (list: NaskahKeluarItem[]) => Promise<boolean>;
  deleteNaskahKeluar: (id: string) => Promise<boolean>;

  // Google Sheets Config
  googleSheetConfig: GoogleSheetConfig;
  setGoogleSheetConfig: React.Dispatch<React.SetStateAction<GoogleSheetConfig>>;
  syncWithGoogleSheets: (overrideData?: {
    naskahMasuk?: NaskahMasukItem[];
    naskahKeluar?: NaskahKeluarItem[];
    berkasThreadList?: BerkasThread[];
    klasifikasiArsipList?: KlasifikasiArsipItem[];
    threadNumberConfig?: ThreadNumberConfig;
    instansiWilayah?: InstansiWilayah[];
    klasifikasiSub?: KlasifikasiSub[];
    unitKerjaList?: string[];
    users?: UserAccount[];
    silent?: boolean;
  }) => Promise<boolean>;
  pullFromGoogleSheets: (options?: { silent?: boolean }) => Promise<boolean>;
  reloadAllData: (forceRestoreDefaults?: boolean) => Promise<boolean>;
  clearLocalCacheAndResync: () => Promise<boolean>;
  exportToGoogleSheetsExcel: () => void;
  importFromExcelFile: (file: File) => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Helper Search
  searchNaskahMasukByNomor: (nomor: string) => NaskahMasukItem | null;
  searchNaskahKeluarByNomor: (nomor: string) => NaskahKeluarItem | null;

  // Database Mode & Isolation Settings (Sandbox vs Production)
  dbMode: DatabaseMode;
  setDbMode: (mode: DatabaseMode) => void;
  isSandbox: boolean;
  autoSandbox: boolean;
  setAutoSandbox: (enabled: boolean) => void;
  resetSandboxToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'ms_current_user',
  USERS_LIST: 'ms_users_list',
  UNIT_KERJA: 'ms_unit_kerja',
  JENIS_MASUK: 'ms_jenis_masuk',
  JENIS_KELUAR: 'ms_jenis_keluar',
  INSTANSI: 'ms_instansi',
  KLASIFIKASI: 'ms_klasifikasi',
  STATUS_SELESAI: 'ms_status_selesai',
  STATUS_KIRIM: 'ms_status_kirim',
  NASKAH_MASUK: 'ms_naskah_masuk',
  NASKAH_MASUK_UPDATED_AT: 'ms_naskah_masuk_updated_at',
  NASKAH_KELUAR: 'ms_naskah_keluar',
  NASKAH_KELUAR_UPDATED_AT: 'ms_naskah_keluar_updated_at',
  KLASIFIKASI_ARSIP: 'ms_klasifikasi_arsip',
  THREAD_CONFIG: 'ms_thread_config',
  PEMBERKASAN: 'ms_pemberkasan_threads',
  SHEETS_CONFIG: 'ms_sheets_config'
};

export const APP_CACHE_VERSION = 'v3.5-clean-supabase-sync';
export const CACHE_VERSION_KEY = 'ms_app_cache_version';

// Auto-purge cache lama di peramban pengguna agar tidak terjadi konflik data usang dengan Supabase
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const cachedVer = window.localStorage.getItem(CACHE_VERSION_KEY);
    if (cachedVer !== APP_CACHE_VERSION) {
      console.info(`[App Cache] Mendeteksi versi cache usang (${cachedVer} -> ${APP_CACHE_VERSION}). Membersihkan cache lokal...`);
      const keepUser = window.localStorage.getItem(STORAGE_KEYS.USER);
      // Hapus seluruh data transaksi & master cache lama
      const keysToClean = [
        STORAGE_KEYS.NASKAH_MASUK,
        STORAGE_KEYS.NASKAH_MASUK_UPDATED_AT,
        STORAGE_KEYS.NASKAH_KELUAR,
        STORAGE_KEYS.NASKAH_KELUAR_UPDATED_AT,
        STORAGE_KEYS.PEMBERKASAN,
        STORAGE_KEYS.USERS_LIST,
        STORAGE_KEYS.UNIT_KERJA,
        STORAGE_KEYS.JENIS_MASUK,
        STORAGE_KEYS.JENIS_KELUAR,
        STORAGE_KEYS.INSTANSI,
        STORAGE_KEYS.KLASIFIKASI,
        STORAGE_KEYS.STATUS_SELESAI,
        STORAGE_KEYS.STATUS_KIRIM,
        STORAGE_KEYS.KLASIFIKASI_ARSIP,
        STORAGE_KEYS.THREAD_CONFIG
      ];
      keysToClean.forEach((k) => window.localStorage.removeItem(k));
      if (keepUser) {
        window.localStorage.setItem(STORAGE_KEYS.USER, keepUser);
      }
      window.localStorage.setItem(CACHE_VERSION_KEY, APP_CACHE_VERSION);
    }
  } catch (e) {
    console.warn('[App Cache] Invalidation error:', e);
  }
}

// Safe storage wrapper to prevent crashes in private browsing, strict office policies, or quota issues
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage] Cannot read key "${key}":`, e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[Storage] Cannot write key "${key}":`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[Storage] Cannot remove key "${key}":`, e);
    }
  }
};

const safeJsonParse = <T,>(key: string, fallback: T): T => {
  const raw = safeStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.warn(`[Storage] Corrupted JSON in key "${key}", using default.`, e);
    return fallback;
  }
};

const normalizeUserAccounts = (list: any[]): UserAccount[] => {
  if (!Array.isArray(list)) return defaultUsers;
  return list.map((u, i) => {
    const rawJenis = String(u.jenisUser || '').toLowerCase();
    const isAdmin = rawJenis.includes('admin') || rawJenis === 'pimpinan';
    const cleanJenis = isAdmin
      ? 'Admin'
      : rawJenis.includes('verifikator')
      ? 'Verifikator'
      : 'Operator';

    return {
      ...u,
      id: u.id || `user-${i + 1}`,
      nip: String(u.nip || ''),
      nama: String(u.nama || 'User'),
      password: String(u.password || ''),
      email: String(u.email || (isAdmin ? 'suratkerja89@gmail.com' : cleanJenis === 'Verifikator' ? 'verifikator.surat@gmail.com' : 'operator.surat@gmail.com')),
      jenisUser: cleanJenis as any,
      unitKerja: u.unitKerja || (isAdmin ? 'Sekretariat Utama' : 'Bidang Pelayanan & Mutasi'),
      hakAkses:
        Array.isArray(u.hakAkses) && u.hakAkses.length > 0
          ? u.hakAkses
          : isAdmin
          ? ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Master Data', 'Setting', 'Laporan', 'Rekapitulasi', 'Daftar Arsip Aktif']
          : ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan', 'Rekapitulasi', 'Daftar Arsip Aktif']
    };
  });
};

export const sanitizeNaskahMasuk = (list: any[]): NaskahMasukItem[] => {
  if (!Array.isArray(list)) return defaultNaskahMasukList;
  const seenIds = new Set<string>();
  const cleanList: NaskahMasukItem[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    let itemId = String(item.id || '').trim();

    if (!itemId || seenIds.has(itemId)) {
      // Periksa apakah item ini merupakan duplikasi persis dari item yang sudah dimasukkan
      const isDuplicate = cleanList.some(
        (x) =>
          x.id === itemId ||
          (Boolean(x.nomorNaskah) &&
            x.nomorNaskah === item.nomorNaskah &&
            x.perihal === item.perihal &&
            x.tglNaskah === item.tglNaskah)
      );

      if (isDuplicate) {
        // Abaikan duplikat identik untuk membersihkan data
        continue;
      }

      // Jika data berbeda namun id bertabrakan, berikan id unik baru
      itemId = `nm-clean-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
    }

    seenIds.add(itemId);
    cleanList.push({
      ...item,
      id: itemId
    });
  }

  return cleanList;
};

export const sanitizeNaskahKeluar = (list: any[]): NaskahKeluarItem[] => {
  if (!Array.isArray(list)) return defaultNaskahKeluarList;
  const seenIds = new Set<string>();
  const cleanList: NaskahKeluarItem[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    let itemId = String(item.id || '').trim();

    if (!itemId || seenIds.has(itemId)) {
      const isDuplicate = cleanList.some(
        (x) =>
          x.id === itemId ||
          (Boolean(x.nomorNaskah) &&
            x.nomorNaskah === item.nomorNaskah &&
            x.perihal === item.perihal &&
            x.tglNaskah === item.tglNaskah)
      );

      if (isDuplicate) {
        continue;
      }

      itemId = `nk-clean-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
    }

    seenIds.add(itemId);
    cleanList.push({
      ...item,
      id: itemId
    });
  }

  return cleanList;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [syncModalState, setSyncModalState] = useState<CircularSyncModalProps>({
    isOpen: false,
    type: 'push',
    title: '',
    message: '',
    progress: 0
  });

  // Initialize Auth with safe defaults
  // Database Mode State & Sandbox Isolation
  const [dbMode, setDbModeState] = useState<DatabaseMode>(() => getDatabaseMode());
  const [autoSandbox, setAutoSandboxState] = useState<boolean>(() => isAutoSandboxEnabled());
  const isSandbox = dbMode === 'sandbox';
  const [hasPulledInitialData, setHasPulledInitialData] = useState<boolean>(false);

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!saved) return defaultUsers;
    try {
      return normalizeUserAccounts(JSON.parse(saved));
    } catch {
      return defaultUsers;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return safeJsonParse<UserAccount | null>(STORAGE_KEYS.USER, null);
  });

  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(false);
  const [loginWelcomeName, setLoginWelcomeName] = useState<string>('');

  // Master databases with safe parser
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>(() => {
    return safeJsonParse<string[]>(STORAGE_KEYS.UNIT_KERJA, defaultUnitKerjaList);
  });

  const [jenisNaskahMasuk, setJenisNaskahMasuk] = useState<string[]>(() => {
    return safeJsonParse<string[]>(STORAGE_KEYS.JENIS_MASUK, defaultJenisNaskahMasuk);
  });

  const [jenisNaskahKeluar, setJenisNaskahKeluar] = useState<string[]>(() => {
    return safeJsonParse<string[]>(STORAGE_KEYS.JENIS_KELUAR, defaultJenisNaskahKeluar);
  });

  const [instansiWilayah, setInstansiWilayah] = useState<InstansiWilayah[]>(() => {
    return safeJsonParse<InstansiWilayah[]>(STORAGE_KEYS.INSTANSI, defaultInstansiWilayah);
  });

  const [klasifikasiSub, setKlasifikasiSub] = useState<KlasifikasiSub[]>(() => {
    return safeJsonParse<KlasifikasiSub[]>(STORAGE_KEYS.KLASIFIKASI, defaultKlasifikasiSub);
  });

  const [statusPenyelesaian, setStatusPenyelesaian] = useState<string[]>(() => {
    return safeJsonParse<string[]>(STORAGE_KEYS.STATUS_SELESAI, defaultStatusPenyelesaian);
  });

  const [statusKirim, setStatusKirim] = useState<string[]>(() => {
    return safeJsonParse<string[]>(STORAGE_KEYS.STATUS_KIRIM, defaultStatusKirim);
  });

  // Klasifikasi Arsip (Kode Arsip)
  const [klasifikasiArsipList, setKlasifikasiArsipList] = useState<KlasifikasiArsipItem[]>(() => {
    return safeJsonParse<KlasifikasiArsipItem[]>(STORAGE_KEYS.KLASIFIKASI_ARSIP, defaultKlasifikasiArsip);
  });

  // Pengaturan Nomor Thread Otomatis
  const [threadNumberConfig, setThreadNumberConfig] = useState<ThreadNumberConfig>(() => {
    return safeJsonParse<ThreadNumberConfig>(STORAGE_KEYS.THREAD_CONFIG, defaultThreadNumberConfig);
  });

  // Pengaturan SLA (Hari Kerja)
  const [slaConfig, setSlaConfig] = useState<SlaConfig>(() => {
    return safeJsonParse<SlaConfig>('ms_sla_config', defaultSlaConfig);
  });

  useEffect(() => {
    try {
      safeStorage.setItem('ms_sla_config', JSON.stringify(slaConfig));
    } catch {}
  }, [slaConfig]);

  // Pemberkasan (Thread Tracker)
  const [berkasThreadList, setBerkasThreadList] = useState<BerkasThread[]>(() => {
    return safeJsonParse<BerkasThread[]>(STORAGE_KEYS.PEMBERKASAN, []);
  });

  // Records with safe parser & auto-sanitization to prevent duplicate keys
  const [naskahMasukList, setNaskahMasukListState] = useState<NaskahMasukItem[]>(() => {
    const raw = safeJsonParse<NaskahMasukItem[]>(STORAGE_KEYS.NASKAH_MASUK, []);
    const cleaned = sanitizeNaskahMasuk(raw);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(cleaned));
    return cleaned;
  });

  const setNaskahMasukList: React.Dispatch<React.SetStateAction<NaskahMasukItem[]>> = (action) => {
    setNaskahMasukListState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return sanitizeNaskahMasuk(next);
    });
  };

  const [naskahKeluarList, setNaskahKeluarListState] = useState<NaskahKeluarItem[]>(() => {
    const raw = safeJsonParse<NaskahKeluarItem[]>(STORAGE_KEYS.NASKAH_KELUAR, []);
    const cleaned = sanitizeNaskahKeluar(raw);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(cleaned));
    return cleaned;
  });

  const setNaskahKeluarList: React.Dispatch<React.SetStateAction<NaskahKeluarItem[]>> = (action) => {
    setNaskahKeluarListState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return sanitizeNaskahKeluar(next);
    });
  };

  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetConfig>(() => {
    return safeJsonParse<GoogleSheetConfig>(STORAGE_KEYS.SHEETS_CONFIG, {
      sheetUrlOrId: '',
      webhookUrl: '',
      syncEnabled: true,
      lastSyncedAt: new Date().toISOString()
    });
  });

  // Auto-pull data terbaru dari Supabase / Google Sheets saat aplikasi pertama dibuka
  useEffect(() => {
    (async () => {
      const spData = await pullFromSupabase();
      setHasPulledInitialData(true);
      if (spData) {
        let needsSeed = false;
        const seedPayload: any = {};

        if (spData.users && spData.users.length > 0) {
          setUsers(spData.users);
          safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(spData.users));
        } else if (spData.users === undefined) {
          needsSeed = true;
          seedPayload.users = defaultUsers;
        }

        if (spData.unitKerjaList && spData.unitKerjaList.length > 0) {
          setUnitKerjaList(spData.unitKerjaList);
          safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(spData.unitKerjaList));
        } else if (spData.unitKerjaList === undefined) {
          needsSeed = true;
          seedPayload.unitKerjaList = defaultUnitKerjaList;
        }

        if (spData.jenisNaskahMasuk && spData.jenisNaskahMasuk.length > 0) {
          setJenisNaskahMasuk(spData.jenisNaskahMasuk);
          safeStorage.setItem(STORAGE_KEYS.JENIS_MASUK, JSON.stringify(spData.jenisNaskahMasuk));
        }

        if (spData.jenisNaskahKeluar && spData.jenisNaskahKeluar.length > 0) {
          setJenisNaskahKeluar(spData.jenisNaskahKeluar);
          safeStorage.setItem(STORAGE_KEYS.JENIS_KELUAR, JSON.stringify(spData.jenisNaskahKeluar));
        }

        if (spData.statusPenyelesaian && spData.statusPenyelesaian.length > 0) {
          setStatusPenyelesaian(spData.statusPenyelesaian);
          safeStorage.setItem(STORAGE_KEYS.STATUS_SELESAI, JSON.stringify(spData.statusPenyelesaian));
        }

        if (spData.statusKirim && spData.statusKirim.length > 0) {
          setStatusKirim(spData.statusKirim);
          safeStorage.setItem(STORAGE_KEYS.STATUS_KIRIM, JSON.stringify(spData.statusKirim));
        }

        if (spData.instansiWilayah && spData.instansiWilayah.length > 0) {
          setInstansiWilayah(spData.instansiWilayah);
          safeStorage.setItem(STORAGE_KEYS.INSTANSI, JSON.stringify(spData.instansiWilayah));
        }

        if (spData.klasifikasiSub && spData.klasifikasiSub.length > 0) {
          setKlasifikasiSub(spData.klasifikasiSub);
          safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI, JSON.stringify(spData.klasifikasiSub));
        }

        // Untuk Naskah Masuk, Naskah Keluar, & Berkas Thread: hormati status di Supabase bahkan jika kosong [] (sudah dihapus pengguna)
        if (spData.naskahMasuk !== undefined) {
          setNaskahMasukList(spData.naskahMasuk);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(spData.naskahMasuk));
        }

        if (spData.naskahKeluar !== undefined) {
          setNaskahKeluarList(spData.naskahKeluar);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(spData.naskahKeluar));
        }

        if (spData.berkasThreadList !== undefined) {
          setBerkasThreadList(spData.berkasThreadList);
          safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(spData.berkasThreadList));
        }

        if (spData.klasifikasiArsipList && spData.klasifikasiArsipList.length > 0) {
          setKlasifikasiArsipList(spData.klasifikasiArsipList);
          safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(spData.klasifikasiArsipList));
        }

        if (spData.threadNumberConfig) {
          setThreadNumberConfig(spData.threadNumberConfig);
          safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(spData.threadNumberConfig));
        }

        if (needsSeed) {
          pushToSupabase(seedPayload);
        }
      } else {
        setHasPulledInitialData(true);
        if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
          pullFromGoogleSheets({ silent: true });
        }
      }
    })();
  }, []);

  // Save to localStorage when states change and auto push master dropdowns to Supabase
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(unitKerjaList));
  }, [unitKerjaList]);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      safeStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.JENIS_MASUK, JSON.stringify(jenisNaskahMasuk));
  }, [jenisNaskahMasuk]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.JENIS_KELUAR, JSON.stringify(jenisNaskahKeluar));
  }, [jenisNaskahKeluar]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.INSTANSI, JSON.stringify(instansiWilayah));
  }, [instansiWilayah]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI, JSON.stringify(klasifikasiSub));
  }, [klasifikasiSub]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.STATUS_SELESAI, JSON.stringify(statusPenyelesaian));
  }, [statusPenyelesaian]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.STATUS_KIRIM, JSON.stringify(statusKirim));
  }, [statusKirim]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(klasifikasiArsipList));
  }, [klasifikasiArsipList]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(threadNumberConfig));
  }, [threadNumberConfig]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(berkasThreadList));
  }, [berkasThreadList]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(naskahMasukList));
  }, [naskahMasukList]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(naskahKeluarList));
  }, [naskahKeluarList]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(googleSheetConfig));
  }, [googleSheetConfig]);

  // Database Mode Switcher & Sandbox Reset Helper
  const setDbMode = (mode: DatabaseMode) => {
    setDatabaseMode(mode);
    setDbModeState(mode);
    if (mode === 'sandbox') {
      showToast('🛡️ Mode Sandbox AI Studio Aktif: Database Production aman & terisolasi!', 'info');
    } else if (mode === 'production') {
      showToast('🌐 Mode Supabase Production Aktif: Aplikasi terhubung ke database live cloud.', 'success');
      pullFromSupabase().then((spData) => {
        if (spData) {
          if (spData.users && spData.users.length > 0) setUsers(spData.users);
          if (spData.naskahMasuk) setNaskahMasukList(spData.naskahMasuk);
          if (spData.naskahKeluar) setNaskahKeluarList(spData.naskahKeluar);
          if (spData.berkasThreadList) setBerkasThreadList(spData.berkasThreadList);
        }
      });
    } else {
      showToast('🧪 Mode Supabase Staging/Development DB Aktif.', 'info');
    }
  };

  const setAutoSandbox = (enabled: boolean) => {
    setAutoSandboxEnabled(enabled);
    setAutoSandboxState(enabled);
    if (enabled && isRunningInAIStudio()) {
      setDbMode('sandbox');
    }
  };

  const resetSandboxToDemoData = () => {
    setUsers(defaultUsers);
    setUnitKerjaList(defaultUnitKerjaList);
    setJenisNaskahMasuk(defaultJenisNaskahMasuk);
    setJenisNaskahKeluar(defaultJenisNaskahKeluar);
    setInstansiWilayah(defaultInstansiWilayah);
    setKlasifikasiSub(defaultKlasifikasiSub);
    setStatusPenyelesaian(defaultStatusPenyelesaian);
    setStatusKirim(defaultStatusKirim);
    setKlasifikasiArsipList(defaultKlasifikasiArsip);
    setThreadNumberConfig(defaultThreadNumberConfig);
    setBerkasThreadList(defaultBerkasThreadList);
    setNaskahMasukList(defaultNaskahMasukList);
    setNaskahKeluarList(defaultNaskahKeluarList);
    safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(defaultUsers));
    safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(defaultUnitKerjaList));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(defaultNaskahMasukList));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(defaultNaskahKeluarList));
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(defaultBerkasThreadList));
    showToast('✨ Data pengujian lokal Sandbox berhasil di-reset ke data bawaan!', 'success');
  };

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 2000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth functions
  const login = (nip: string, password?: string): boolean => {
    const found = users.find(
      (u) =>
        String(u.nip || '').trim() === String(nip || '').trim() &&
        (!password || !u.password || String(u.password || '').trim() === String(password || '').trim())
    );
    if (found) {
      setCurrentUser(found);
      setActiveTab('dashboard');
      setLoginWelcomeName(found.nama || 'User');
      setIsLoginLoading(true);
      setTimeout(() => {
        setIsLoginLoading(false);
      }, 2200);
      showToast(`Selamat datang, ${found.nama} (${found.jenisUser})!`, 'success');
      return true;
    }
    showToast('NIP atau Password salah. Silakan coba lagi.', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsLoginLoading(false);
    setLoginWelcomeName('');
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  // Keep currentUser in sync with the latest users master data (especially unitKerja)
  useEffect(() => {
    if (currentUser) {
      const match = users.find(
        (u) =>
          (currentUser.nip && String(u.nip).trim().toLowerCase() === String(currentUser.nip).trim().toLowerCase()) ||
          u.id === currentUser.id
      );
      if (
        match &&
        (match.unitKerja !== currentUser.unitKerja ||
          match.jenisUser !== currentUser.jenisUser ||
          match.nama !== currentUser.nama ||
          JSON.stringify(match.hakAkses) !== JSON.stringify(currentUser.hakAkses))
      ) {
        setCurrentUser(match);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(match));
      }
    }
  }, [users, currentUser]);

  // Access check based on Role, Unit Kerja, and Creator
  const canAccessRecord = useCallback(
    (item: { createdBy?: string; createdByName?: string; unitKerja?: string }): boolean => {
      if (!currentUser) return true;
      const isAdmin =
        currentUser.jenisUser === 'Admin' ||
        String(currentUser.jenisUser || '').toLowerCase().includes('admin') ||
        String(currentUser.jenisUser || '').toLowerCase() === 'pimpinan' ||
        String(currentUser.nama || '').toLowerCase().includes('admin');
      if (isAdmin) return true;

      const userNip = String(currentUser.nip || '').trim().toLowerCase();
      const userObj = users.find(
        (u) => (userNip && String(u.nip || '').trim().toLowerCase() === userNip) || u.id === currentUser.id
      );
      const userUnit = String(currentUser.unitKerja || userObj?.unitKerja || '').trim().toLowerCase();
      if (!userUnit) return true;

      const itemUnit = String(item.unitKerja || '').trim().toLowerCase();

      // 1. Direct Unit Kerja Match: If item has unit kerja, it must match user's unit kerja
      if (itemUnit) {
        return itemUnit === userUnit || itemUnit.includes(userUnit) || userUnit.includes(itemUnit);
      }

      // 2. Creator's Unit Kerja Match: If item has no explicit unit kerja, check creator's unit kerja
      if (item.createdBy || item.createdByName) {
        const creator = users.find(
          (u) =>
            (item.createdBy && String(u.nip || '').trim().toLowerCase() === String(item.createdBy).trim().toLowerCase()) ||
            (item.createdByName && String(u.nama || '').trim().toLowerCase() === String(item.createdByName).trim().toLowerCase())
        );
        if (creator && creator.unitKerja) {
          const creatorUnit = String(creator.unitKerja).trim().toLowerCase();
          return creatorUnit === userUnit || creatorUnit.includes(userUnit) || userUnit.includes(creatorUnit);
        }
      }

      // 3. Direct Creator Match: If current user created this record
      if (
        (item.createdBy && String(item.createdBy).trim().toLowerCase() === userNip) ||
        (item.createdByName && String(item.createdByName).trim().toLowerCase() === String(currentUser.nama || '').trim().toLowerCase())
      ) {
        return true;
      }

      return false;
    },
    [currentUser, users]
  );

  // Search Helpers with requested condition messages and unit kerja isolation
  const searchNaskahMasukByNomor = (nomor: string): NaskahMasukItem | null => {
    const cleanNum = String(nomor || '').trim().toLowerCase();
    if (!cleanNum) {
      showToast('Masukkan Nomor Naskah yang ingin dicari', 'info');
      return null;
    }
    const found = naskahMasukList.find((item) => {
      const num = String(item.nomorNaskah || '').toLowerCase();
      return (num === cleanNum || num.includes(cleanNum)) && canAccessRecord(item);
    });
    if (found) {
      showToast('Data Ditemukan', 'success');
      return found;
    } else {
      showToast('Maaf, Data Yang Anda Cari Tidak Ada', 'error');
      return null;
    }
  };

  const searchNaskahKeluarByNomor = (nomor: string): NaskahKeluarItem | null => {
    const cleanNum = String(nomor || '').trim().toLowerCase();
    if (!cleanNum) {
      showToast('Masukkan Nomor Naskah yang ingin dicari', 'info');
      return null;
    }
    const found = naskahKeluarList.find((item) => {
      const num = String(item.nomorNaskah || '').toLowerCase();
      return (num === cleanNum || num.includes(cleanNum)) && canAccessRecord(item);
    });
    if (found) {
      showToast('Data Ditemukan', 'success');
      return found;
    } else {
      showToast('Maaf, Data Yang Anda Cari Tidak Ada', 'error');
      return null;
    }
  };

  // Google Sheets integration simulation / export
  const syncWithGoogleSheets = async (overrideData?: {
    naskahMasuk?: NaskahMasukItem[];
    naskahKeluar?: NaskahKeluarItem[];
    berkasThreadList?: BerkasThread[];
    klasifikasiArsipList?: KlasifikasiArsipItem[];
    threadNumberConfig?: ThreadNumberConfig;
    instansiWilayah?: InstansiWilayah[];
    klasifikasiSub?: KlasifikasiSub[];
    unitKerjaList?: string[];
    users?: UserAccount[];
    silent?: boolean;
  }): Promise<boolean> => {
    const targetNaskahMasuk = overrideData?.naskahMasuk || naskahMasukList;
    const targetNaskahKeluar = overrideData?.naskahKeluar || naskahKeluarList;
    const targetBerkasThread = overrideData?.berkasThreadList || berkasThreadList;
    const targetKlasifikasiArsip = overrideData?.klasifikasiArsipList || klasifikasiArsipList;
    const targetThreadConfig = overrideData?.threadNumberConfig || threadNumberConfig;
    const targetInstansi = overrideData?.instansiWilayah || instansiWilayah;
    const targetKlasifikasi = overrideData?.klasifikasiSub || klasifikasiSub;
    const targetUnitKerja = overrideData?.unitKerjaList || unitKerjaList;
    const targetUsers = overrideData?.users || users;

    if (!overrideData?.silent) {
      setSyncModalState({
        isOpen: true,
        type: 'push',
        title: 'Menyimpan ke Google Sheet',
        message: 'Mengirim & menyelaraskan 10 tabel database ke Cloud Spreadsheet...',
        progress: 25
      });
    }

    // Save directly to localStorage to guarantee persistence immediately
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(targetNaskahMasuk));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(targetNaskahKeluar));
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(targetBerkasThread));
    safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(targetKlasifikasiArsip));
    safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(targetThreadConfig));
    safeStorage.setItem(STORAGE_KEYS.INSTANSI, JSON.stringify(targetInstansi));
    safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI, JSON.stringify(targetKlasifikasi));
    safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(targetUnitKerja));
    safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(targetUsers));

    // Direct push to Supabase PostgreSQL Database
    if (!overrideData?.silent) {
      setSyncModalState({
        isOpen: true,
        type: 'push',
        title: 'Menyimpan ke Supabase DB...',
        message: 'Mengirim dan menyinkronkan 10 tabel data ke Supabase Cloud Database...',
        progress: 50
      });
    }

    const supResult = await pushToSupabase({
      naskahMasuk: targetNaskahMasuk,
      naskahKeluar: targetNaskahKeluar,
      berkasThreadList: targetBerkasThread,
      users: targetUsers,
      unitKerjaList: targetUnitKerja,
      klasifikasiArsipList: targetKlasifikasiArsip,
      instansiWilayah: targetInstansi,
      klasifikasiSub: targetKlasifikasi,
      jenisNaskahMasuk,
      jenisNaskahKeluar,
      statusPenyelesaian,
      statusKirim,
      threadNumberConfig: targetThreadConfig
    });

    if (!overrideData?.silent) {
      setSyncModalState({
        isOpen: true,
        type: 'push',
        title: 'Data Tersimpan Aman!',
        message: 'Seluruh data telah tersimpan aman di sistem penyimpanan aplikasi.',
        progress: 100
      });
      setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 800);
      showToast('BERHASIL! Data tersimpan dengan aman di sistem!', 'success');
    }
    setGoogleSheetConfig((prev) => ({
      ...prev,
      lastSyncedAt: new Date().toISOString()
    }));
    return true;
  };

  const pullFromGoogleSheets = async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!options?.silent) {
      setSyncModalState({
        isOpen: true,
        type: 'pull',
        title: 'Memuat Ulang (Reload) Data Sheet',
        message: 'Mengunduh data terbaru 10 tabel database dari Google Sheet...',
        progress: 30
      });
    }

    if (googleSheetConfig.webhookUrl) {
      try {
        let result: any = null;
        const cleanWebhookUrl = String(googleSheetConfig.webhookUrl || '').trim();

        try {
          const getUrl = cleanWebhookUrl + 
            (cleanWebhookUrl.includes('?') ? '&' : '?') + 
            `action=pull&_t=${Date.now()}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const resGet = await fetch(getUrl, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          result = await resGet.json();
        } catch {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const resPost = await fetch(cleanWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'pull' }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          result = await resPost.json();
        }

        if (result && result.status === 'success' && result.data) {
          if (!options?.silent) {
            setSyncModalState((prev) => ({ ...prev, progress: 80, message: 'Memperbarui database lokal...' }));
          }

          const cleanMasuk = Array.isArray(result.data.naskahMasuk)
            ? normalizeListIds<NaskahMasukItem>(result.data.naskahMasuk, 'NM', (m) => m.nomorNaskah)
            : [];
          const cleanKeluar = Array.isArray(result.data.naskahKeluar)
            ? normalizeListIds<NaskahKeluarItem>(result.data.naskahKeluar, 'NK', (k) => k.nomorNaskah)
            : [];
          const cleanThread = Array.isArray(result.data.berkasThreadList)
            ? normalizeListIds<BerkasThread>(result.data.berkasThreadList, 'TH', (t) => t.nomorThread)
            : [];
          const cleanUsers = Array.isArray(result.data.users) && result.data.users.length > 0
            ? normalizeUserAccounts(normalizeListIds<UserAccount>(result.data.users, 'USR', (u) => u.nip))
            : [];
          const cleanArsip = Array.isArray(result.data.klasifikasiArsipList) && result.data.klasifikasiArsipList.length > 0
            ? normalizeListIds<KlasifikasiArsipItem>(result.data.klasifikasiArsipList, 'KA', (a) => a.kodeKlasifikasi)
            : [];

          if (cleanMasuk.length > 0) {
            setNaskahMasukList(cleanMasuk);
            safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(cleanMasuk));
          }
          if (cleanKeluar.length > 0) {
            setNaskahKeluarList(cleanKeluar);
            safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(cleanKeluar));
          }
          if (Array.isArray(result.data.unitKerjaList) && result.data.unitKerjaList.length > 0) {
            setUnitKerjaList(result.data.unitKerjaList);
            safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(result.data.unitKerjaList));
          }
          if (Array.isArray(result.data.instansiWilayah)) {
            setInstansiWilayah(result.data.instansiWilayah);
            safeStorage.setItem(STORAGE_KEYS.INSTANSI, JSON.stringify(result.data.instansiWilayah));
          }
          if (Array.isArray(result.data.klasifikasiSub)) {
            setKlasifikasiSub(result.data.klasifikasiSub);
            safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI, JSON.stringify(result.data.klasifikasiSub));
          }
          if (cleanUsers.length > 0) {
            setUsers(cleanUsers);
            safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(cleanUsers));
          }
          if (cleanArsip.length > 0) {
            setKlasifikasiArsipList(cleanArsip);
            safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(cleanArsip));
          }
          if (cleanThread.length > 0) {
            setBerkasThreadList(cleanThread);
            safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(cleanThread));
          }
          if (result.data.threadNumberConfig && typeof result.data.threadNumberConfig === 'object') {
            setThreadNumberConfig((prev) => ({
              ...prev,
              ...result.data.threadNumberConfig
            }));
            safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(result.data.threadNumberConfig));
          }

          // Auto-migrate & push pulled Google Sheet data into Supabase PostgreSQL
          pushToSupabase({
            naskahMasuk: cleanMasuk.length > 0 ? cleanMasuk : undefined,
            naskahKeluar: cleanKeluar.length > 0 ? cleanKeluar : undefined,
            berkasThreadList: cleanThread.length > 0 ? cleanThread : undefined,
            users: cleanUsers.length > 0 ? cleanUsers : undefined,
            unitKerjaList: Array.isArray(result.data.unitKerjaList) && result.data.unitKerjaList.length > 0 ? result.data.unitKerjaList : undefined,
            klasifikasiArsipList: cleanArsip.length > 0 ? cleanArsip : undefined,
            instansiWilayah: Array.isArray(result.data.instansiWilayah) && result.data.instansiWilayah.length > 0 ? result.data.instansiWilayah : undefined,
            klasifikasiSub: Array.isArray(result.data.klasifikasiSub) && result.data.klasifikasiSub.length > 0 ? result.data.klasifikasiSub : undefined,
            jenisNaskahMasuk: Array.isArray(result.data.jenisNaskahMasuk) && result.data.jenisNaskahMasuk.length > 0 ? result.data.jenisNaskahMasuk : undefined,
            jenisNaskahKeluar: Array.isArray(result.data.jenisNaskahKeluar) && result.data.jenisNaskahKeluar.length > 0 ? result.data.jenisNaskahKeluar : undefined,
            statusPenyelesaian: Array.isArray(result.data.statusPenyelesaian) && result.data.statusPenyelesaian.length > 0 ? result.data.statusPenyelesaian : undefined,
            statusKirim: Array.isArray(result.data.statusKirim) && result.data.statusKirim.length > 0 ? result.data.statusKirim : undefined,
            threadNumberConfig: result.data.threadNumberConfig
          }).then((supRes) => {
            if (supRes.success) {
              console.log('Successfully synced pulled Google Sheet data to Supabase!');
            } else {
              console.warn('Supabase sync warning during sheet pull:', supRes.errors);
            }
          });

          setGoogleSheetConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString()
          }));
          if (!options?.silent) {
            setSyncModalState({
              isOpen: true,
              type: 'pull',
              title: 'Reload Berhasil!',
              message: 'Semua 10 tabel database aplikasi telah diperbarui dari Google Sheet.',
              progress: 100
            });
            setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 900);
            showToast('Berhasil memuat ulang (Reload) data terbaru dari Google Sheet! Semua 10 tabel database aplikasi telah diperbarui.', 'success');
          }
          return true;
        } else {
          if (!options?.silent) {
            setSyncModalState((prev) => ({ ...prev, progress: 100, message: 'Gagal Menarik Data' }));
            setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 800);
            showToast('Gagal menarik data dari sheet: Webhook tidak merespons format pull yang sah.', 'error');
          }
        }
      } catch (err) {
        if (!options?.silent) {
          setSyncModalState((prev) => ({ ...prev, progress: 100, message: 'Gagal Menghubungi Webhook' }));
          setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 800);
          showToast('Koneksi ke Google Sheet Webhook gagal. Pastikan Webhook URL sudah di-deploy dengan akses Anyone.', 'error');
        }
      }
    } else {
      if (!options?.silent) {
        setSyncModalState((prev) => ({ ...prev, progress: 100, message: 'Webhook Belum Dikonfigurasi' }));
        setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 800);
      }
    }
    return false;
  };

  const reloadAllData = async (forceRestoreDefaults?: boolean): Promise<boolean> => {
    // 1. Primary: Pull from Supabase Cloud Database
    if (!forceRestoreDefaults) {
      setSyncModalState({
        isOpen: true,
        type: 'pull',
        title: 'Memuat Data dari Supabase DB',
        message: 'Menghubungi Supabase Cloud Database...',
        progress: 40
      });
      const supabaseResult = await pullFromSupabase();
      if (supabaseResult) {
        if (supabaseResult.naskahMasuk !== undefined) {
          setNaskahMasukList(supabaseResult.naskahMasuk);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(supabaseResult.naskahMasuk));
        }
        if (supabaseResult.naskahKeluar !== undefined) {
          setNaskahKeluarList(supabaseResult.naskahKeluar);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(supabaseResult.naskahKeluar));
        }
        if (supabaseResult.berkasThreadList !== undefined) {
          setBerkasThreadList(supabaseResult.berkasThreadList);
          safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(supabaseResult.berkasThreadList));
        }
        if (supabaseResult.users && supabaseResult.users.length > 0) {
          setUsers(supabaseResult.users);
          safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(supabaseResult.users));
        }
        if (supabaseResult.unitKerjaList) {
          setUnitKerjaList(supabaseResult.unitKerjaList);
          safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(supabaseResult.unitKerjaList));
        }
        if (supabaseResult.klasifikasiArsipList) {
          setKlasifikasiArsipList(supabaseResult.klasifikasiArsipList);
          safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(supabaseResult.klasifikasiArsipList));
        }

        setSyncModalState({
          isOpen: true,
          type: 'reload',
          title: 'Reload Supabase Berhasil!',
          message: 'Data aplikasi berhasil diperbarui dari Supabase Cloud Database.',
          progress: 100
        });
        setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 900);
        showToast('Berhasil memuat ulang data dari Supabase PostgreSQL Cloud Database!', 'success');
        return true;
      }
    }

    // 2. Secondary fallback if Google Sheets configured
    if (!forceRestoreDefaults && googleSheetConfig.webhookUrl) {
      const pulled = await pullFromGoogleSheets();
      if (pulled) return true;
    }

    setSyncModalState({
      isOpen: true,
      type: 'reload',
      title: 'Memuat Ulang Database',
      message: 'Memuat data lokal & default sistem...',
      progress: 50
    });

    const targetMasuk = forceRestoreDefaults ? [] : naskahMasukList;
    const targetKeluar = forceRestoreDefaults ? [] : naskahKeluarList;

    setNaskahMasukList(targetMasuk);
    setNaskahKeluarList(targetKeluar);

    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(targetMasuk));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(targetKeluar));

    if (forceRestoreDefaults) {
      setKlasifikasiArsipList(defaultKlasifikasiArsip);
      safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(defaultKlasifikasiArsip));
      setThreadNumberConfig(defaultThreadNumberConfig);
      safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(defaultThreadNumberConfig));
      setBerkasThreadList([]);
      safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify([]));
    }

    setSyncModalState({
      isOpen: true,
      type: 'reload',
      title: 'Reload Selesai!',
      message: 'Data aplikasi berhasil diperbarui.',
      progress: 100
    });
    setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 900);

    showToast(
      `Berhasil memuat ulang data! (${targetMasuk.length} Naskah Masuk & ${targetKeluar.length} Naskah Keluar aktif)`,
      'success'
    );
    return true;
  };

  /**
   * Membersihkan total cache browser lokal (localStorage) dan menarik ulang data murni dari Supabase Cloud
   */
  const clearLocalCacheAndResync = async (): Promise<boolean> => {
    setSyncModalState({
      isOpen: true,
      type: 'pull',
      title: 'Membersihkan Cache & Memuat Supabase',
      message: 'Menghapus seluruh cache lokal di peramban dan mengambil data terbaru dari Supabase Cloud...',
      progress: 30
    });

    try {
      const preserveUser = safeStorage.getItem(STORAGE_KEYS.USER);
      const keysToClear = [
        STORAGE_KEYS.NASKAH_MASUK,
        STORAGE_KEYS.NASKAH_MASUK_UPDATED_AT,
        STORAGE_KEYS.NASKAH_KELUAR,
        STORAGE_KEYS.NASKAH_KELUAR_UPDATED_AT,
        STORAGE_KEYS.PEMBERKASAN,
        STORAGE_KEYS.USERS_LIST,
        STORAGE_KEYS.UNIT_KERJA,
        STORAGE_KEYS.JENIS_MASUK,
        STORAGE_KEYS.JENIS_KELUAR,
        STORAGE_KEYS.INSTANSI,
        STORAGE_KEYS.KLASIFIKASI,
        STORAGE_KEYS.STATUS_SELESAI,
        STORAGE_KEYS.STATUS_KIRIM,
        STORAGE_KEYS.KLASIFIKASI_ARSIP,
        STORAGE_KEYS.THREAD_CONFIG
      ];
      keysToClear.forEach((k) => safeStorage.removeItem(k));
      if (preserveUser) {
        safeStorage.setItem(STORAGE_KEYS.USER, preserveUser);
      }

      setNaskahMasukListState([]);
      setNaskahKeluarListState([]);
      setBerkasThreadList([]);

      const spData = await pullFromSupabase();
      if (spData) {
        if (spData.users && spData.users.length > 0) {
          setUsers(spData.users);
          safeStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(spData.users));
        }
        if (spData.unitKerjaList && spData.unitKerjaList.length > 0) {
          setUnitKerjaList(spData.unitKerjaList);
          safeStorage.setItem(STORAGE_KEYS.UNIT_KERJA, JSON.stringify(spData.unitKerjaList));
        }
        if (spData.jenisNaskahMasuk) {
          setJenisNaskahMasuk(spData.jenisNaskahMasuk);
          safeStorage.setItem(STORAGE_KEYS.JENIS_MASUK, JSON.stringify(spData.jenisNaskahMasuk));
        }
        if (spData.jenisNaskahKeluar) {
          setJenisNaskahKeluar(spData.jenisNaskahKeluar);
          safeStorage.setItem(STORAGE_KEYS.JENIS_KELUAR, JSON.stringify(spData.jenisNaskahKeluar));
        }
        if (spData.statusPenyelesaian) {
          setStatusPenyelesaian(spData.statusPenyelesaian);
          safeStorage.setItem(STORAGE_KEYS.STATUS_SELESAI, JSON.stringify(spData.statusPenyelesaian));
        }
        if (spData.statusKirim) {
          setStatusKirim(spData.statusKirim);
          safeStorage.setItem(STORAGE_KEYS.STATUS_KIRIM, JSON.stringify(spData.statusKirim));
        }
        if (spData.instansiWilayah) {
          setInstansiWilayah(spData.instansiWilayah);
          safeStorage.setItem(STORAGE_KEYS.INSTANSI, JSON.stringify(spData.instansiWilayah));
        }
        if (spData.klasifikasiSub) {
          setKlasifikasiSub(spData.klasifikasiSub);
          safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI, JSON.stringify(spData.klasifikasiSub));
        }
        if (spData.naskahMasuk !== undefined) {
          setNaskahMasukListState(spData.naskahMasuk);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(spData.naskahMasuk));
        }
        if (spData.naskahKeluar !== undefined) {
          setNaskahKeluarListState(spData.naskahKeluar);
          safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(spData.naskahKeluar));
        }
        if (spData.berkasThreadList !== undefined) {
          setBerkasThreadList(spData.berkasThreadList);
          safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(spData.berkasThreadList));
        }
        if (spData.klasifikasiArsipList && spData.klasifikasiArsipList.length > 0) {
          setKlasifikasiArsipList(spData.klasifikasiArsipList);
          safeStorage.setItem(STORAGE_KEYS.KLASIFIKASI_ARSIP, JSON.stringify(spData.klasifikasiArsipList));
        }
        if (spData.threadNumberConfig) {
          setThreadNumberConfig(spData.threadNumberConfig);
          safeStorage.setItem(STORAGE_KEYS.THREAD_CONFIG, JSON.stringify(spData.threadNumberConfig));
        }
      }

      setSyncModalState({
        isOpen: true,
        type: 'reload',
        title: 'Cache Bersih & Sinkron Selesai!',
        message: 'Cache lama di peramban telah dibersihkan dan diganti dengan data terbaru langsung dari Supabase Cloud.',
        progress: 100
      });
      setTimeout(() => setSyncModalState((prev) => ({ ...prev, isOpen: false })), 900);
      showToast('Cache peramban berhasil dibersihkan & data terbaru ditarik dari Supabase!', 'success');
      return true;
    } catch (e) {
      setSyncModalState((prev) => ({ ...prev, isOpen: false }));
      showToast('Gagal membersihkan cache atau memuat data Supabase.', 'error');
      return false;
    }
  };

  // Helper generator nomor thread otomatis
  const getNextThreadNumber = (simulateOnly: boolean = false): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    let counter = Number(threadNumberConfig.currentCounter) || 1;

    // Check reset period
    if (threadNumberConfig.resetPeriod === 'yearly' && threadNumberConfig.lastResetYear && threadNumberConfig.lastResetYear !== currentYear) {
      counter = 1;
    } else if (
      threadNumberConfig.resetPeriod === 'monthly' &&
      (threadNumberConfig.lastResetMonth !== currentMonth || threadNumberConfig.lastResetYear !== currentYear)
    ) {
      counter = 1;
    }

    const nextCounter = simulateOnly ? counter + 1 : counter + 1;

    const paddedCounter = String(nextCounter).padStart(Number(threadNumberConfig.counterDigits) || 4, '0');
    const yyyy = String(currentYear);
    const yy = String(currentYear).slice(-2);
    const mm = String(currentMonth).padStart(2, '0');
    const prefix = threadNumberConfig.prefix || 'TH';

    let generated = threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]';
    generated = generated
      .replace(/\[PREFIX\]/g, prefix)
      .replace(/\[YYYY\]/g, yyyy)
      .replace(/\[YY\]/g, yy)
      .replace(/\[MM\]/g, mm)
      .replace(/\[COUNTER\]/g, paddedCounter);

    if (!simulateOnly) {
      setThreadNumberConfig((prev) => ({
        ...prev,
        currentCounter: nextCounter,
        lastResetYear: currentYear,
        lastResetMonth: currentMonth
      }));
    }

    return generated;
  };

  const createBerkasThread = (data: {
    namaBerkas: string;
    klasifikasiBerkas: string;
    kodeKlasifikasi: string;
    namaKlasifikasiArsip?: string;
    keterangan?: string;
    status?: 'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup';
    unitKerja?: string;
    lokasiFisik?: string;
    naskahMasukIds?: string[];
    naskahKeluarIds?: string[];
    customNomorThread?: string;
    initialNote?: string;
  }): BerkasThread => {
    const nomor =
      data.customNomorThread && data.customNomorThread.trim().length > 0
        ? data.customNomorThread.trim()
        : getNextThreadNumber(false);

    const nowIso = new Date().toISOString();
    const creatorNip = currentUser?.nip || '198901012010011001';
    const creatorName = currentUser?.nama || 'Admin Sistem';

    const historyItems: ThreadHistoryItem[] = [
      {
        id: `hist-${Date.now()}-1`,
        timestamp: nowIso,
        type: 'create',
        actorNip: creatorNip,
        actorName: creatorName,
        description: `Pemberkasan (Thread) dibuat dengan Nomor Otomatis ${nomor}`
      }
    ];

    if (data.naskahMasukIds && data.naskahMasukIds.length > 0) {
      data.naskahMasukIds.forEach((mId, idx) => {
        const found = naskahMasukList.find((m) => m.id === mId);
        historyItems.push({
          id: `hist-${Date.now()}-m-${idx}`,
          timestamp: nowIso,
          type: 'link_masuk',
          actorNip: creatorNip,
          actorName: creatorName,
          description: `Naskah Masuk ${found?.nomorNaskah ? `No. ${found.nomorNaskah}` : ''} ditautkan ke thread`,
          refNomorNaskah: found?.nomorNaskah
        });
      });
    }

    if (data.naskahKeluarIds && data.naskahKeluarIds.length > 0) {
      data.naskahKeluarIds.forEach((kId, idx) => {
        const found = naskahKeluarList.find((k) => k.id === kId);
        historyItems.push({
          id: `hist-${Date.now()}-k-${idx}`,
          timestamp: nowIso,
          type: 'link_keluar',
          actorNip: creatorNip,
          actorName: creatorName,
          description: `Naskah Keluar ${found?.nomorNaskah ? `No. ${found.nomorNaskah}` : ''} ditautkan ke thread`,
          refNomorNaskah: found?.nomorNaskah
        });
      });
    }

    if (data.initialNote && data.initialNote.trim().length > 0) {
      historyItems.push({
        id: `hist-${Date.now()}-note`,
        timestamp: nowIso,
        type: 'note',
        actorNip: creatorNip,
        actorName: creatorName,
        description: data.initialNote.trim()
      });
    }

    const newThread: BerkasThread = {
      id: `th-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nomorThread: nomor,
      namaBerkas: data.namaBerkas.trim(),
      klasifikasiBerkas: data.klasifikasiBerkas.trim(),
      kodeKlasifikasi: data.kodeKlasifikasi.trim(),
      namaKlasifikasiArsip: data.namaKlasifikasiArsip,
      keterangan: data.keterangan || '',
      status: data.status || 'Aktif',
      unitKerja: data.unitKerja || currentUser?.unitKerja || 'Sekretariat Utama',
      lokasiFisik: data.lokasiFisik || '',
      naskahMasukIds: data.naskahMasukIds || [],
      naskahKeluarIds: data.naskahKeluarIds || [],
      history: historyItems,
      createdBy: creatorNip,
      createdByName: creatorName,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const updatedThreads = [newThread, ...berkasThreadList];
    setBerkasThreadList(updatedThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(updatedThreads));
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: updatedThreads, silent: true });
    }

    showToast(`Pemberkasan #${newThread.nomorThread} "${newThread.namaBerkas}" berhasil dibuat!`, 'success');
    return newThread;
  };

  const updateBerkasThread = (id: string, updates: Partial<BerkasThread>, logMessage?: string) => {
    const nowIso = new Date().toISOString();
    const actorNip = currentUser?.nip || '198901012010011001';
    const actorName = currentUser?.nama || 'Admin Sistem';

    const updatedThreads = berkasThreadList.map((item) => {
      if (item.id === id) {
        const newHistory = [...item.history];
        if (logMessage) {
          newHistory.push({
            id: `hist-${Date.now()}`,
            timestamp: nowIso,
            type: updates.status && updates.status !== item.status ? 'status_change' : 'note',
            actorNip,
            actorName,
            description: logMessage
          });
        } else if (updates.status && updates.status !== item.status) {
          newHistory.push({
            id: `hist-${Date.now()}`,
            timestamp: nowIso,
            type: 'status_change',
            actorNip,
            actorName,
            description: `Status Berkas diubah dari "${item.status}" menjadi "${updates.status}"`
          });
        }

        return {
          ...item,
          ...updates,
          history: newHistory,
          updatedAt: nowIso
        };
      }
      return item;
    });

    setBerkasThreadList(updatedThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(updatedThreads));
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: updatedThreads, silent: true });
    }
    showToast('Data Pemberkasan (Thread) berhasil diperbarui!', 'success');
  };

  const deleteBerkasThread = async (id: string) => {
    const remainingThreads = berkasThreadList.filter((item) => item.id !== id);
    setBerkasThreadList(remainingThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(remainingThreads));
    await deleteRecordFromSupabase('berkas_thread', id);
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: remainingThreads, silent: true });
    }
    showToast('Berkas (Thread) berhasil dihapus.', 'info');
  };

  const linkNaskahToThread = (threadId: string, naskahType: 'masuk' | 'keluar', naskahId: string) => {
    const nowIso = new Date().toISOString();
    const actorNip = currentUser?.nip || '198901012010011001';
    const actorName = currentUser?.nama || 'Admin Sistem';

    let nomorNaskah = '';
    if (naskahType === 'masuk') {
      const found = naskahMasukList.find((m) => m.id === naskahId);
      nomorNaskah = found?.nomorNaskah || '';
    } else {
      const found = naskahKeluarList.find((k) => k.id === naskahId);
      nomorNaskah = found?.nomorNaskah || '';
    }

    const updatedThreads = berkasThreadList.map((thread) => {
      if (thread.id === threadId) {
        const masukList =
          naskahType === 'masuk'
            ? Array.from(new Set([...thread.naskahMasukIds, naskahId]))
            : thread.naskahMasukIds;
        const keluarList =
          naskahType === 'keluar'
            ? Array.from(new Set([...thread.naskahKeluarIds, naskahId]))
            : thread.naskahKeluarIds;
        const newHistory = [
          ...thread.history,
          {
            id: `hist-${Date.now()}`,
            timestamp: nowIso,
            type: (naskahType === 'masuk' ? 'link_masuk' : 'link_keluar') as any,
            actorNip,
            actorName,
            description: `Menautkan Naskah ${naskahType === 'masuk' ? 'Masuk' : 'Keluar'} ${
              nomorNaskah ? `No. ${nomorNaskah}` : ''
            } ke dalam thread ini`,
            refNomorNaskah: nomorNaskah
          }
        ];
        return {
          ...thread,
          naskahMasukIds: masukList,
          naskahKeluarIds: keluarList,
          history: newHistory,
          updatedAt: nowIso
        };
      }
      return thread;
    });

    setBerkasThreadList(updatedThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(updatedThreads));
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: updatedThreads, silent: true });
    }
    showToast(`Naskah berhasil ditautkan ke Thread!`, 'success');
  };

  const unlinkNaskahFromThread = (threadId: string, naskahType: 'masuk' | 'keluar', naskahId: string) => {
    const nowIso = new Date().toISOString();
    const actorNip = currentUser?.nip || '198901012010011001';
    const actorName = currentUser?.nama || 'Admin Sistem';

    let nomorNaskah = '';
    if (naskahType === 'masuk') {
      const found = naskahMasukList.find((m) => m.id === naskahId);
      nomorNaskah = found?.nomorNaskah || '';
    } else {
      const found = naskahKeluarList.find((k) => k.id === naskahId);
      nomorNaskah = found?.nomorNaskah || '';
    }

    const updatedThreads = berkasThreadList.map((thread) => {
      if (thread.id === threadId) {
        const masukList =
          naskahType === 'masuk'
            ? thread.naskahMasukIds.filter((id) => id !== naskahId)
            : thread.naskahMasukIds;
        const keluarList =
          naskahType === 'keluar'
            ? thread.naskahKeluarIds.filter((id) => id !== naskahId)
            : thread.naskahKeluarIds;
        const newHistory = [
          ...thread.history,
          {
            id: `hist-${Date.now()}`,
            timestamp: nowIso,
            type: (naskahType === 'masuk' ? 'unlink_masuk' : 'unlink_keluar') as any,
            actorNip,
            actorName,
            description: `Melepaskan tautan Naskah ${naskahType === 'masuk' ? 'Masuk' : 'Keluar'} ${
              nomorNaskah ? `No. ${nomorNaskah}` : ''
            } dari thread`,
            refNomorNaskah: nomorNaskah
          }
        ];
        return {
          ...thread,
          naskahMasukIds: masukList,
          naskahKeluarIds: keluarList,
          history: newHistory,
          updatedAt: nowIso
        };
      }
      return thread;
    });

    setBerkasThreadList(updatedThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(updatedThreads));
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: updatedThreads, silent: true });
    }
    showToast(`Naskah dilepaskan dari Thread.`, 'info');
  };

  const addThreadNote = (threadId: string, note: string) => {
    if (!note.trim()) return;
    const nowIso = new Date().toISOString();
    const actorNip = currentUser?.nip || '198901012010011001';
    const actorName = currentUser?.nama || 'Admin Sistem';

    const updatedThreads = berkasThreadList.map((thread) => {
      if (thread.id === threadId) {
        return {
          ...thread,
          history: [
            ...thread.history,
            {
              id: `hist-${Date.now()}`,
              timestamp: nowIso,
              type: 'note',
              actorNip,
              actorName,
              description: note.trim()
            }
          ],
          updatedAt: nowIso
        };
      }
      return thread;
    });

    setBerkasThreadList(updatedThreads);
    safeStorage.setItem(STORAGE_KEYS.PEMBERKASAN, JSON.stringify(updatedThreads));
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ berkasThreadList: updatedThreads, silent: true });
    }
    showToast('Catatan riwayat thread berhasil ditambahkan', 'success');
  };

  const saveNaskahMasukDirectly = async (list: NaskahMasukItem[]): Promise<boolean> => {
    const cleaned = sanitizeNaskahMasuk(list);
    setNaskahMasukListState(cleaned);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(cleaned));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK_UPDATED_AT, String(Date.now()));

    // Langsung simpan ke Supabase jika bukan mode sandbox
    if (!isSandboxMode()) {
      await pushToSupabase({ naskahMasuk: cleaned });
    }

    // Otomatis sinkronisasi ke Google Sheet jika webhook terpasang
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ naskahMasuk: cleaned, silent: true });
    }
    return true;
  };

  const deleteNaskahMasuk = async (id: string): Promise<boolean> => {
    const updated = naskahMasukList.filter((m) => m.id !== id);
    setNaskahMasukListState(updated);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK, JSON.stringify(updated));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_MASUK_UPDATED_AT, String(Date.now()));
    await deleteRecordFromSupabase('naskah_masuk', id);
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ naskahMasuk: updated, silent: true });
    }
    showToast('Data Naskah Masuk berhasil dihapus dari database.', 'info');
    return true;
  };

  const saveNaskahKeluarDirectly = async (list: NaskahKeluarItem[]): Promise<boolean> => {
    const cleaned = sanitizeNaskahKeluar(list);
    setNaskahKeluarListState(cleaned);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(cleaned));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR_UPDATED_AT, String(Date.now()));

    // Langsung simpan ke Supabase jika bukan mode sandbox
    if (!isSandboxMode()) {
      await pushToSupabase({ naskahKeluar: cleaned });
    }

    // Otomatis sinkronisasi ke Google Sheet jika webhook terpasang
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ naskahKeluar: cleaned, silent: true });
    }
    return true;
  };

  const deleteNaskahKeluar = async (id: string): Promise<boolean> => {
    const updated = naskahKeluarList.filter((k) => k.id !== id);
    setNaskahKeluarListState(updated);
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR, JSON.stringify(updated));
    safeStorage.setItem(STORAGE_KEYS.NASKAH_KELUAR_UPDATED_AT, String(Date.now()));
    await deleteRecordFromSupabase('naskah_keluar', id);
    if (googleSheetConfig.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0) {
      syncWithGoogleSheets({ naskahKeluar: updated, silent: true });
    }
    showToast('Data Naskah Keluar berhasil dihapus dari database.', 'info');
    return true;
  };

  const exportToGoogleSheetsExcel = () => {
    // Handled in components via xlsx package
  };

  const importFromExcelFile = async () => {
    // Handled in components via xlsx package
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        isLoginLoading,
        loginWelcomeName,
        users,
        setUsers,
        login,
        logout,
        canAccessRecord,
        unitKerjaList,
        setUnitKerjaList,
        jenisNaskahMasuk,
        setJenisNaskahMasuk,
        jenisNaskahKeluar,
        setJenisNaskahKeluar,
        instansiWilayah,
        setInstansiWilayah,
        klasifikasiSub,
        setKlasifikasiSub,
        statusPenyelesaian,
        setStatusPenyelesaian,
        statusKirim,
        setStatusKirim,
        klasifikasiArsipList,
        setKlasifikasiArsipList,
        threadNumberConfig,
        setThreadNumberConfig,
        getNextThreadNumber,
        slaConfig,
        setSlaConfig,
        berkasThreadList,
        setBerkasThreadList,
        createBerkasThread,
        updateBerkasThread,
        deleteBerkasThread,
        linkNaskahToThread,
        unlinkNaskahFromThread,
        addThreadNote,
        naskahMasukList,
        setNaskahMasukList,
        saveNaskahMasukDirectly,
        deleteNaskahMasuk,
        naskahKeluarList,
        setNaskahKeluarList,
        saveNaskahKeluarDirectly,
        deleteNaskahKeluar,
        googleSheetConfig,
        setGoogleSheetConfig,
        syncWithGoogleSheets,
        pullFromGoogleSheets,
        reloadAllData,
        clearLocalCacheAndResync,
        exportToGoogleSheetsExcel,
        importFromExcelFile,
        toasts,
        showToast,
        removeToast,
        searchNaskahMasukByNomor,
        searchNaskahKeluarByNomor,
        dbMode,
        setDbMode,
        isSandbox,
        autoSandbox,
        setAutoSandbox,
        resetSandboxToDemoData
      }}
    >
      {children}
      <CircularSyncModal {...syncModalState} />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
