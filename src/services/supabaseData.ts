import { supabase } from '../lib/supabase';
import {
  UserAccount,
  NaskahMasukItem,
  NaskahKeluarItem,
  BerkasThread,
  KlasifikasiArsipItem,
  ThreadNumberConfig,
  InstansiWilayah,
  KlasifikasiSub
} from '../types';

/**
 * Script DDL SQL untuk membuat seluruh 10 tabel di Supabase SQL Editor
 */
export const SUPABASE_SCHEMA_SQL = `-- SCRIPT PEMBUATAN STRUKTUR DEDIKASI 10 TABEL DATABASE SUPABASE POSTGRESQL (100% LENGKAP)

-- 1. TABEL NASKAH MASUK
CREATE TABLE IF NOT EXISTS public.naskah_masuk (
    id TEXT PRIMARY KEY,
    nomor_naskah TEXT DEFAULT '-',
    tgl_naskah DATE,
    tgl_terima DATE,
    perihal TEXT DEFAULT '-',
    jenis_naskah TEXT DEFAULT '',
    pengirim_naskah TEXT DEFAULT '',
    instansi_terkait TEXT DEFAULT '',
    wilayah_kerja TEXT DEFAULT '',
    unit_kerja TEXT DEFAULT 'Sekretariat Utama',
    klasifikasi_utama TEXT DEFAULT '',
    klasifikasi_sub TEXT DEFAULT '',
    status_penyelesaian TEXT DEFAULT 'Dalam Proses',
    sla INT DEFAULT 3,
    file_link_naskah_masuk TEXT DEFAULT '',
    file_link_naskah_dijawab TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_by_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL NASKAH KELUAR
CREATE TABLE IF NOT EXISTS public.naskah_keluar (
    id TEXT PRIMARY KEY,
    nomor_naskah TEXT DEFAULT '-',
    tgl_naskah DATE,
    perihal TEXT DEFAULT '-',
    jenis_naskah TEXT DEFAULT '',
    tujuan_naskah TEXT DEFAULT '',
    instansi_terkait TEXT DEFAULT '',
    wilayah_kerja TEXT DEFAULT '',
    unit_kerja TEXT DEFAULT 'Sekretariat Utama',
    klasifikasi_utama TEXT DEFAULT '',
    klasifikasi_sub TEXT DEFAULT '',
    tgl_kirim DATE,
    status_pengiriman TEXT DEFAULT 'Belum Terkirim',
    bukti_kirim TEXT DEFAULT '',
    file_link_naskah_masuk TEXT DEFAULT '',
    file_link_naskah_dijawab TEXT DEFAULT '',
    catatan TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_by_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL BERKAS THREAD
CREATE TABLE IF NOT EXISTS public.berkas_thread (
    id TEXT PRIMARY KEY,
    nomor_thread TEXT DEFAULT '',
    nama_berkas TEXT DEFAULT '',
    klasifikasi_berkas TEXT DEFAULT '',
    kode_klasifikasi TEXT DEFAULT '',
    nama_klasifikasi_arsip TEXT DEFAULT '',
    keterangan TEXT DEFAULT '',
    status TEXT DEFAULT 'Aktif',
    unit_kerja TEXT DEFAULT 'Sekretariat Utama',
    lokasi_fisik TEXT DEFAULT '',
    naskah_masuk_ids JSONB DEFAULT '[]'::jsonb,
    naskah_keluar_ids JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_by TEXT DEFAULT '',
    created_by_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL USERS
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nip TEXT DEFAULT '',
    nama TEXT DEFAULT '',
    password TEXT DEFAULT '123456',
    email TEXT DEFAULT '',
    jenis_user TEXT DEFAULT 'Operator',
    unit_kerja TEXT DEFAULT 'Sekretariat Utama',
    hak_akses JSONB DEFAULT '["Dashboard","Naskah Masuk","Naskah Keluar","Pemberkasan","Laporan"]'::jsonb
);

-- 5. TABEL UNIT KERJA
CREATE TABLE IF NOT EXISTS public.unit_kerja (
    id TEXT PRIMARY KEY,
    nama_unit TEXT NOT NULL
);

-- 6. TABEL KLASIFIKASI ARSIP
CREATE TABLE IF NOT EXISTS public.klasifikasi_arsip (
    id TEXT PRIMARY KEY,
    kode_klasifikasi TEXT DEFAULT '',
    nama_klasifikasi TEXT DEFAULT '',
    deskripsi TEXT DEFAULT '',
    retensi_aktif INT DEFAULT 2,
    retensi_inaktif INT DEFAULT 5,
    nasib_akhir TEXT DEFAULT 'Permanen'
);

-- 7. TABEL INSTANSI WILAYAH
CREATE TABLE IF NOT EXISTS public.instansi_wilayah (
    id TEXT PRIMARY KEY,
    instansi TEXT DEFAULT '',
    wilayah_kerja TEXT DEFAULT ''
);

-- 8. TABEL KLASIFIKASI SUB
CREATE TABLE IF NOT EXISTS public.klasifikasi_sub (
    id TEXT PRIMARY KEY,
    klasifikasi_utama TEXT DEFAULT '',
    sub_klasifikasi_list JSONB DEFAULT '[]'::jsonb
);

-- 9. TABEL MASTER DROPDOWN
CREATE TABLE IF NOT EXISTS public.master_dropdown (
    id TEXT PRIMARY KEY,
    kategori TEXT NOT NULL,
    nilai TEXT NOT NULL
);

-- 10. TABEL THREAD NUMBER CONFIG
CREATE TABLE IF NOT EXISTS public.thread_number_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    prefix TEXT DEFAULT 'TH',
    separator TEXT DEFAULT '-',
    format TEXT DEFAULT '[PREFIX]-[YYYY]-[COUNTER]',
    counter_digits INT DEFAULT 4,
    current_counter INT DEFAULT 100,
    reset_period TEXT DEFAULT 'yearly',
    last_reset_year INT DEFAULT 2026,
    last_reset_month INT DEFAULT 1
);

-- BERIKAN HAK AKSES PENUH (GRANT ALL) UNTUK ROLE anon, authenticated, & service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.naskah_masuk TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.naskah_keluar TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.berkas_thread TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.unit_kerja TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.klasifikasi_arsip TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.instansi_wilayah TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.klasifikasi_sub TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.master_dropdown TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thread_number_config TO anon, authenticated, service_role;

-- AKTIFKAN RLS & BUAT POLICY HAK AKSES RESMI (SECURE & FULL ACCESS FOR APP)
ALTER TABLE public.naskah_masuk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Naskah_Masuk" ON public.naskah_masuk;
CREATE POLICY "Allow_All_Naskah_Masuk" ON public.naskah_masuk FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.naskah_keluar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Naskah_Keluar" ON public.naskah_keluar;
CREATE POLICY "Allow_All_Naskah_Keluar" ON public.naskah_keluar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.berkas_thread ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Berkas_Thread" ON public.berkas_thread;
CREATE POLICY "Allow_All_Berkas_Thread" ON public.berkas_thread FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Users" ON public.users;
CREATE POLICY "Allow_All_Users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Unit_Kerja" ON public.unit_kerja;
CREATE POLICY "Allow_All_Unit_Kerja" ON public.unit_kerja FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.klasifikasi_arsip ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Klasifikasi_Arsip" ON public.klasifikasi_arsip;
CREATE POLICY "Allow_All_Klasifikasi_Arsip" ON public.klasifikasi_arsip FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.instansi_wilayah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Instansi_Wilayah" ON public.instansi_wilayah;
CREATE POLICY "Allow_All_Instansi_Wilayah" ON public.instansi_wilayah FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.klasifikasi_sub ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Klasifikasi_Sub" ON public.klasifikasi_sub;
CREATE POLICY "Allow_All_Klasifikasi_Sub" ON public.klasifikasi_sub FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.master_dropdown ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Master_Dropdown" ON public.master_dropdown;
CREATE POLICY "Allow_All_Master_Dropdown" ON public.master_dropdown FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.thread_number_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Thread_Config" ON public.thread_number_config;
CREATE POLICY "Allow_All_Thread_Config" ON public.thread_number_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

/**
 * Helper untuk memastikan ID selalu valid, unik, dan non-kosong untuk PostgreSQL Supabase
 */
export const safeId = (idVal: any, prefix: string, fallbackIdx: number, secondaryVal?: string): string => {
  if (idVal !== undefined && idVal !== null) {
    const str = String(idVal).trim();
    if (str && str !== 'null' && str !== 'undefined' && str !== '0' && str !== '-') {
      return str;
    }
  }
  if (secondaryVal && typeof secondaryVal === 'string') {
    const cleanedSec = secondaryVal.replace(/[^a-zA-Z0-9_\-]/g, '_').trim();
    if (cleanedSec) {
      return `${prefix}-${cleanedSec}`;
    }
  }
  return `${prefix}-${fallbackIdx + 1}`;
};

/**
 * Konversi tanggal yang aman untuk tipe data DATE di PostgreSQL
 */
export const safeDate = (val: any): string | null => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined' || str === '0') return null;

  // Format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  return null;
};

/**
 * Normalizer data lokal untuk memastikan seluruh list item memiliki ID yang sah
 */
export const normalizeListIds = <T extends { id?: string }>(
  list: T[],
  prefix: string,
  secondaryKeyExtractor?: (item: T) => string | undefined
): (T & { id: string })[] => {
  if (!Array.isArray(list)) return [];
  return list.map((item, idx) => {
    const secVal = secondaryKeyExtractor ? secondaryKeyExtractor(item) : undefined;
    return {
      ...item,
      id: safeId(item.id, prefix, idx, secVal)
    };
  });
};

/**
 * FUNGSI DIAGNOSA KONEKSI SUPABASE
 * Memeriksa ketersediaan & hak akses untuk ke-10 tabel di Supabase
 */
export const testSupabaseConnectionAndSchema = async (): Promise<{
  connected: boolean;
  tableStatuses: { table: string; status: 'ok' | 'missing' | 'rls_error' | 'error'; message: string }[];
  summary: string;
}> => {
  const tables = [
    'naskah_masuk',
    'naskah_keluar',
    'berkas_thread',
    'users',
    'unit_kerja',
    'klasifikasi_arsip',
    'instansi_wilayah',
    'klasifikasi_sub',
    'master_dropdown',
    'thread_number_config'
  ];

  const tableStatuses: { table: string; status: 'ok' | 'missing' | 'rls_error' | 'error'; message: string }[] = [];
  let okCount = 0;

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('id').limit(1);
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          tableStatuses.push({ table: t, status: 'missing', message: `Tabel belum dibuat di Supabase SQL Editor.` });
        } else if (error.message.includes('permission denied') || error.code === '42501') {
          tableStatuses.push({ table: t, status: 'rls_error', message: `Izin akses ditolak (Permission Denied). Salin & jalankan script GRANT DDL.` });
        } else if (error.message.includes('row-level security') || error.message.includes('policy')) {
          tableStatuses.push({ table: t, status: 'rls_error', message: `Row Level Security (RLS) memblokir akses. Salin & jalankan script GRANT DDL.` });
        } else {
          tableStatuses.push({ table: t, status: 'error', message: error.message });
        }
      } else {
        tableStatuses.push({ table: t, status: 'ok', message: `Siap & Aktif` });
        okCount++;
      }
    } catch (err: any) {
      tableStatuses.push({ table: t, status: 'error', message: err?.message || 'Error koneksi' });
    }
  }

  return {
    connected: okCount > 0,
    tableStatuses,
    summary: `${okCount} dari ${tables.length} tabel aktif di Supabase Database.`
  };
};

export const pullFromSupabase = async (): Promise<{
  users?: UserAccount[];
  unitKerjaList?: string[];
  naskahMasuk?: NaskahMasukItem[];
  naskahKeluar?: NaskahKeluarItem[];
  berkasThreadList?: BerkasThread[];
  klasifikasiArsipList?: KlasifikasiArsipItem[];
  instansiWilayah?: InstansiWilayah[];
  klasifikasiSub?: KlasifikasiSub[];
  jenisNaskahMasuk?: string[];
  jenisNaskahKeluar?: string[];
  statusPenyelesaian?: string[];
  statusKirim?: string[];
  threadNumberConfig?: ThreadNumberConfig;
} | null> => {
  try {
    const { data: usersData } = await supabase.from('users').select('*');
    const { data: unitData } = await supabase.from('unit_kerja').select('*');
    const { data: masukData } = await supabase.from('naskah_masuk').select('*');
    const { data: keluarData } = await supabase.from('naskah_keluar').select('*');
    const { data: threadData } = await supabase.from('berkas_thread').select('*');
    const { data: klasifikasiArsipData } = await supabase.from('klasifikasi_arsip').select('*');
    const { data: instansiData } = await supabase.from('instansi_wilayah').select('*');
    const { data: klasifikasiSubData } = await supabase.from('klasifikasi_sub').select('*');
    const { data: dropdownData } = await supabase.from('master_dropdown').select('*');
    const { data: threadConfigData } = await supabase.from('thread_number_config').select('*').eq('id', 'default').maybeSingle();

    const result: any = {};

    if (Array.isArray(usersData) && usersData.length > 0) {
      result.users = usersData.map((u: any, idx: number) => ({
        id: safeId(u.id, 'USR', idx, u.nip),
        nip: u.nip || `NIP-${idx + 1}`,
        nama: u.nama || 'Pengguna System',
        password: u.password || '123456',
        email: u.email || '',
        jenisUser: u.jenis_user || 'Operator',
        unitKerja: u.unit_kerja || 'Sekretariat Utama',
        hakAkses: u.hak_akses || ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan']
      }));
    }

    if (Array.isArray(unitData) && unitData.length > 0) {
      result.unitKerjaList = unitData.map((uk: any) => uk.nama_unit || uk.nama).filter(Boolean);
    }

    if (Array.isArray(masukData) && masukData.length > 0) {
      result.naskahMasuk = masukData.map((m: any, idx: number) => ({
        id: safeId(m.id, 'NM', idx, m.nomor_naskah),
        tglTerima: m.tgl_terima || '',
        nomorNaskah: m.nomor_naskah || '',
        tglNaskah: m.tgl_naskah || '',
        perihal: m.perihal || '',
        jenisNaskah: m.jenis_naskah || '',
        pengirimNaskah: m.pengirim_naskah || '',
        instansiTerkait: m.instansi_terkait || '',
        wilayahKerja: m.wilayah_kerja || '',
        unitKerja: m.unit_kerja || 'Sekretariat Utama',
        klasifikasiUtama: m.klasifikasi_utama || '',
        subKlasifikasi: m.klasifikasi_sub || m.sub_klasifikasi || '',
        statusPenyelesaian: m.status_penyelesaian || 'Dalam Proses',
        sla: typeof m.sla === 'number' ? m.sla : 3,
        fileLinkNaskahMasuk: m.file_link_naskah_masuk || '',
        fileLinkNaskahDijawab: m.file_link_naskah_dijawab || '',
        createdBy: m.created_by || '',
        createdByName: m.created_by_name || '',
        createdAt: m.created_at || new Date().toISOString()
      }));
    }

    if (Array.isArray(keluarData) && keluarData.length > 0) {
      result.naskahKeluar = keluarData.map((k: any, idx: number) => ({
        id: safeId(k.id, 'NK', idx, k.nomor_naskah),
        tglNaskah: k.tgl_naskah || '',
        nomorNaskah: k.nomor_naskah || '',
        perihal: k.perihal || '',
        jenisNaskah: k.jenis_naskah || '',
        tujuanNaskah: k.tujuan_naskah || '',
        instansiTerkait: k.instansi_terkait || '',
        wilayahKerja: k.wilayah_kerja || '',
        unitKerja: k.unit_kerja || 'Sekretariat Utama',
        klasifikasiUtama: k.klasifikasi_utama || '',
        subKlasifikasi: k.klasifikasi_sub || k.sub_klasifikasi || '',
        tglKirim: k.tgl_kirim || '',
        statusPengiriman: k.status_pengiriman || 'Belum Terkirim',
        buktiKirim: k.bukti_kirim || '',
        fileLinkNaskahMasuk: k.file_link_naskah_masuk || '',
        fileLinkNaskahDijawab: k.file_link_naskah_dijawab || '',
        catatan: k.catatan || '',
        createdBy: k.created_by || '',
        createdByName: k.created_by_name || '',
        createdAt: k.created_at || new Date().toISOString()
      }));
    }

    if (Array.isArray(threadData) && threadData.length > 0) {
      result.berkasThreadList = threadData.map((t: any, idx: number) => ({
        id: safeId(t.id, 'TH', idx, t.nomor_thread),
        nomorThread: t.nomor_thread || `TH-${idx + 1}`,
        namaBerkas: t.nama_berkas || '',
        klasifikasiBerkas: t.klasifikasi_berkas || '',
        kodeKlasifikasi: t.kode_klasifikasi || '',
        namaKlasifikasiArsip: t.nama_klasifikasi_arsip || '',
        keterangan: t.keterangan || '',
        status: t.status || 'Aktif',
        unitKerja: t.unit_kerja || 'Sekretariat Utama',
        lokasiFisik: t.lokasi_fisik || '',
        naskahMasukIds: t.naskah_masuk_ids || [],
        naskahKeluarIds: t.naskah_keluar_ids || [],
        history: t.history || [],
        createdBy: t.created_by || '',
        createdByName: t.created_by_name || '',
        createdAt: t.created_at || new Date().toISOString(),
        updatedAt: t.updated_at || new Date().toISOString()
      }));
    }

    if (Array.isArray(klasifikasiArsipData) && klasifikasiArsipData.length > 0) {
      result.klasifikasiArsipList = klasifikasiArsipData.map((ka: any, idx: number) => ({
        id: safeId(ka.id, 'KA', idx, ka.kode_klasifikasi || ka.kode),
        kodeKlasifikasi: ka.kode_klasifikasi || ka.kode || '',
        namaKlasifikasi: ka.nama_klasifikasi || ka.nama || '',
        deskripsi: ka.deskripsi || '',
        retensiAktif: typeof ka.retensi_aktif === 'number' ? ka.retensi_aktif : 2,
        retensiInaktif: typeof ka.retensi_inaktif === 'number' ? ka.retensi_inaktif : 5,
        nasibAkhir: ka.nasib_akhir || 'Permanen'
      }));
    }

    if (Array.isArray(instansiData) && instansiData.length > 0) {
      result.instansiWilayah = instansiData.map((iw: any, idx: number) => ({
        id: safeId(iw.id, 'IW', idx, iw.instansi || iw.nama),
        instansi: iw.instansi || iw.nama || '',
        wilayahKerja: iw.wilayah_kerja || iw.wilayah || ''
      }));
    }

    if (Array.isArray(klasifikasiSubData) && klasifikasiSubData.length > 0) {
      result.klasifikasiSub = klasifikasiSubData.map((ks: any, idx: number) => ({
        id: safeId(ks.id, 'KS', idx, ks.klasifikasi_utama || ks.kode),
        klasifikasiUtama: ks.klasifikasi_utama || ks.kode || '',
        subKlasifikasiList: ks.sub_klasifikasi_list || []
      }));
    }

    if (Array.isArray(dropdownData) && dropdownData.length > 0) {
      result.jenisNaskahMasuk = dropdownData.filter((d) => d.kategori === 'Jenis Naskah Masuk').map((d) => d.nilai);
      result.jenisNaskahKeluar = dropdownData.filter((d) => d.kategori === 'Jenis Naskah Keluar').map((d) => d.nilai);
      result.statusPenyelesaian = dropdownData.filter((d) => d.kategori === 'Status Penyelesaian').map((d) => d.nilai);
      result.statusKirim = dropdownData.filter((d) => d.kategori === 'Status Kirim').map((d) => d.nilai);
    }

    if (threadConfigData) {
      result.threadNumberConfig = {
        format: threadConfigData.format || '[PREFIX]-[YYYY]-[COUNTER]',
        prefix: threadConfigData.prefix || 'TH',
        separator: threadConfigData.separator || '-',
        counterDigits: threadConfigData.counter_digits || 4,
        currentCounter: threadConfigData.current_counter || 100,
        resetPeriod: threadConfigData.reset_period || 'yearly',
        lastResetYear: threadConfigData.last_reset_year || new Date().getFullYear(),
        lastResetMonth: threadConfigData.last_reset_month || 1
      };
    }

    return result;
  } catch (e) {
    console.error('Error pullFromSupabase:', e);
    return null;
  }
};

export const pushToSupabase = async (payload: {
  naskahMasuk?: NaskahMasukItem[];
  naskahKeluar?: NaskahKeluarItem[];
  berkasThreadList?: BerkasThread[];
  users?: UserAccount[];
  unitKerjaList?: string[];
  klasifikasiArsipList?: KlasifikasiArsipItem[];
  instansiWilayah?: InstansiWilayah[];
  klasifikasiSub?: KlasifikasiSub[];
  jenisNaskahMasuk?: string[];
  jenisNaskahKeluar?: string[];
  statusPenyelesaian?: string[];
  statusKirim?: string[];
  threadNumberConfig?: ThreadNumberConfig;
}): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Robust safeUpsert: mencoba upsert batch, jika ada kegagalan RLS beri peringatan tunggal
  const safeUpsert = async (tableName: string, data: any[]) => {
    if (!data || data.length === 0) return;
    try {
      const res = await supabase.from(tableName).upsert(data);
      if (res.error) {
        // Jika batch gagal karena Row-Level Security (RLS) policy
        const isRlsError =
          res.error.message.includes('row-level security') ||
          res.error.message.includes('RLS') ||
          res.error.code === '42501';

        // Jika batch gagal karena tabel belum dibuat di Supabase
        const isTableMissingError =
          res.error.code === '42P01' ||
          res.error.message.includes('does not exist') ||
          res.error.message.includes('relation');

        if (isRlsError) {
          console.warn(`[Supabase RLS Warning] Tabel '${tableName}' memblokir penulisan. RLS policy perlu diatur di Supabase SQL Editor.`);
          const rlsMsg = `Tabel '${tableName}': Row Level Security (RLS) aktif di Supabase. Silakan buka Master Data -> Tab 11 (Supabase DB) & jalankan Script DDL SQL di Supabase SQL Editor.`;
          if (!errors.includes(rlsMsg)) errors.push(rlsMsg);
          return;
        }

        if (isTableMissingError) {
          console.warn(`[Supabase Missing Table] Tabel '${tableName}' belum ada di Supabase Database.`);
          const missingMsg = `Tabel '${tableName}': Belum dibuat di Supabase. Silakan buka Master Data -> Tab 11 (Supabase DB) & jalankan Script DDL SQL di Supabase SQL Editor.`;
          if (!errors.includes(missingMsg)) errors.push(missingMsg);
          return;
        }

        // Jika batch gagal karena alasan lain, coba upsert per baris
        console.warn(`Batch upsert error on ${tableName}:`, res.error.message, 'Mencoba simpan per-baris...');
        for (const row of data) {
          const singleRes = await supabase.from(tableName).upsert([row]);
          if (singleRes.error) {
            if (
              singleRes.error.message.includes('row-level security') ||
              singleRes.error.message.includes('RLS') ||
              singleRes.error.code === '42501'
            ) {
              const rlsMsg = `Tabel '${tableName}': Row Level Security (RLS) aktif di Supabase. Silakan buka Master Data -> Tab 11 (Supabase DB) & jalankan Script DDL SQL di Supabase SQL Editor.`;
              if (!errors.includes(rlsMsg)) errors.push(rlsMsg);
              break; // Hentikan loop jika menemukan RLS error
            } else {
              console.error(`Single row upsert error on ${tableName} (ID: ${row.id}):`, singleRes.error.message);
              const errMsg = `Tabel ${tableName} (ID: ${row.id}): ${singleRes.error.message}`;
              if (!errors.includes(errMsg)) errors.push(errMsg);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Exception upserting ${tableName}:`, err);
      errors.push(`Tabel ${tableName}: ${err?.message || 'Error koneksi'}`);
    }
  };

  try {
    // 1. Sync Users
    if (payload.users && payload.users.length > 0) {
      const dbUsers = payload.users.map((u, idx) => ({
        id: safeId(u.id, 'USR', idx, u.nip),
        nip: u.nip || `NIP-${idx + 1}`,
        nama: u.nama || 'Pengguna System',
        password: u.password || '123456',
        email: u.email || '',
        jenis_user: u.jenisUser || 'Operator',
        unit_kerja: u.unitKerja || 'Sekretariat Utama',
        hak_akses: u.hakAkses || ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan']
      }));
      await safeUpsert('users', dbUsers);
    }

    // 2. Sync Unit Kerja
    if (payload.unitKerjaList && payload.unitKerjaList.length > 0) {
      try {
        await supabase.from('unit_kerja').delete().neq('id', '___NON_EXISTENT_ID___');
      } catch (e) {}
      const dbUnit = payload.unitKerjaList.filter(Boolean).map((uk, idx) => ({
        id: `UK-${idx + 1}`,
        nama_unit: uk
      }));
      await safeUpsert('unit_kerja', dbUnit);
    }

    // 3. Sync Naskah Masuk
    if (payload.naskahMasuk && payload.naskahMasuk.length > 0) {
      const dbMasuk = payload.naskahMasuk.map((m, idx) => ({
        id: safeId(m.id, 'NM', idx, m.nomorNaskah),
        nomor_naskah: m.nomorNaskah || '-',
        tgl_naskah: safeDate(m.tglNaskah),
        tgl_terima: safeDate(m.tglTerima),
        perihal: m.perihal || '-',
        jenis_naskah: m.jenisNaskah || '',
        pengirim_naskah: m.pengirimNaskah || '',
        instansi_terkait: m.instansiTerkait || '',
        wilayah_kerja: m.wilayahKerja || '',
        unit_kerja: m.unitKerja || 'Sekretariat Utama',
        klasifikasi_utama: m.klasifikasiUtama || '',
        klasifikasi_sub: m.subKlasifikasi || '',
        status_penyelesaian: m.statusPenyelesaian || 'Dalam Proses',
        sla: typeof m.sla === 'number' ? m.sla : 3,
        file_link_naskah_masuk: m.fileLinkNaskahMasuk || '',
        file_link_naskah_dijawab: m.fileLinkNaskahDijawab || '',
        created_by: m.createdBy || '',
        created_by_name: m.createdByName || ''
      }));
      await safeUpsert('naskah_masuk', dbMasuk);
    }

    // 4. Sync Naskah Keluar
    if (payload.naskahKeluar && payload.naskahKeluar.length > 0) {
      const dbKeluar = payload.naskahKeluar.map((k, idx) => ({
        id: safeId(k.id, 'NK', idx, k.nomorNaskah),
        nomor_naskah: k.nomorNaskah || '-',
        tgl_naskah: safeDate(k.tglNaskah),
        perihal: k.perihal || '-',
        jenis_naskah: k.jenisNaskah || '',
        tujuan_naskah: k.tujuanNaskah || '',
        instansi_terkait: k.instansiTerkait || '',
        wilayah_kerja: k.wilayahKerja || '',
        unit_kerja: k.unitKerja || 'Sekretariat Utama',
        klasifikasi_utama: k.klasifikasiUtama || '',
        klasifikasi_sub: k.subKlasifikasi || '',
        tgl_kirim: safeDate(k.tglKirim),
        status_pengiriman: k.statusPengiriman || 'Belum Terkirim',
        bukti_kirim: k.buktiKirim || '',
        file_link_naskah_masuk: k.fileLinkNaskahMasuk || '',
        file_link_naskah_dijawab: k.fileLinkNaskahDijawab || '',
        catatan: k.catatan || '',
        created_by: k.createdBy || '',
        created_by_name: k.createdByName || ''
      }));
      await safeUpsert('naskah_keluar', dbKeluar);
    }

    // 5. Sync Berkas Thread
    if (payload.berkasThreadList && payload.berkasThreadList.length > 0) {
      const dbThreads = payload.berkasThreadList.map((t, idx) => ({
        id: safeId(t.id, 'TH', idx, t.nomorThread),
        nomor_thread: t.nomorThread || `TH-${idx + 1}`,
        nama_berkas: t.namaBerkas || 'Berkas Tanpa Judul',
        klasifikasi_berkas: t.klasifikasiBerkas || '',
        kode_klasifikasi: t.kodeKlasifikasi || '',
        nama_klasifikasi_arsip: t.namaKlasifikasiArsip || '',
        keterangan: t.keterangan || '',
        status: t.status || 'Aktif',
        unit_kerja: t.unitKerja || 'Sekretariat Utama',
        lokasi_fisik: t.lokasiFisik || '',
        naskah_masuk_ids: t.naskahMasukIds || [],
        naskah_keluar_ids: t.naskahKeluarIds || [],
        history: t.history || [],
        created_by: t.createdBy || '',
        created_by_name: t.createdByName || ''
      }));
      await safeUpsert('berkas_thread', dbThreads);
    }

    // 6. Sync Klasifikasi Arsip
    if (payload.klasifikasiArsipList && payload.klasifikasiArsipList.length > 0) {
      const dbArsip = payload.klasifikasiArsipList.map((ka, idx) => ({
        id: safeId(ka.id, 'KA', idx, ka.kodeKlasifikasi),
        kode_klasifikasi: ka.kodeKlasifikasi || '',
        nama_klasifikasi: ka.namaKlasifikasi || '',
        deskripsi: ka.deskripsi || '',
        retensi_aktif: typeof ka.retensiAktif === 'number' ? ka.retensiAktif : 2,
        retensi_inaktif: typeof ka.retensiInaktif === 'number' ? ka.retensiInaktif : 5,
        nasib_akhir: ka.nasibAkhir || 'Permanen'
      }));
      await safeUpsert('klasifikasi_arsip', dbArsip);
    }

    // 7. Sync Instansi Wilayah
    if (payload.instansiWilayah && payload.instansiWilayah.length > 0) {
      const dbInstansi = payload.instansiWilayah.map((iw, idx) => ({
        id: safeId(iw.id, 'IW', idx, iw.instansi),
        instansi: iw.instansi || '',
        wilayah_kerja: iw.wilayahKerja || ''
      }));
      await safeUpsert('instansi_wilayah', dbInstansi);
    }

    // 8. Sync Klasifikasi Sub
    if (payload.klasifikasiSub && payload.klasifikasiSub.length > 0) {
      const dbSub = payload.klasifikasiSub.map((ks, idx) => ({
        id: safeId(ks.id, 'KS', idx, ks.klasifikasiUtama),
        klasifikasi_utama: ks.klasifikasiUtama || '',
        sub_klasifikasi_list: ks.subKlasifikasiList || []
      }));
      await safeUpsert('klasifikasi_sub', dbSub);
    }

    // 9. Sync Master Dropdown
    if (payload.jenisNaskahMasuk || payload.jenisNaskahKeluar || payload.statusPenyelesaian || payload.statusKirim) {
      const categoriesToSync: string[] = [];
      if (payload.jenisNaskahMasuk) categoriesToSync.push('Jenis Naskah Masuk');
      if (payload.jenisNaskahKeluar) categoriesToSync.push('Jenis Naskah Keluar');
      if (payload.statusPenyelesaian) categoriesToSync.push('Status Penyelesaian');
      if (payload.statusKirim) categoriesToSync.push('Status Kirim');

      for (const cat of categoriesToSync) {
        try {
          await supabase.from('master_dropdown').delete().eq('kategori', cat);
        } catch (e) {}
      }

      const dropdownRows: { id: string; kategori: string; nilai: string }[] = [];
      if (payload.jenisNaskahMasuk) {
        payload.jenisNaskahMasuk.forEach((v, idx) => dropdownRows.push({ id: `JNM-${idx + 1}`, kategori: 'Jenis Naskah Masuk', nilai: v }));
      }
      if (payload.jenisNaskahKeluar) {
        payload.jenisNaskahKeluar.forEach((v, idx) => dropdownRows.push({ id: `JNK-${idx + 1}`, kategori: 'Jenis Naskah Keluar', nilai: v }));
      }
      if (payload.statusPenyelesaian) {
        payload.statusPenyelesaian.forEach((v, idx) => dropdownRows.push({ id: `SP-${idx + 1}`, kategori: 'Status Penyelesaian', nilai: v }));
      }
      if (payload.statusKirim) {
        payload.statusKirim.forEach((v, idx) => dropdownRows.push({ id: `SK-${idx + 1}`, kategori: 'Status Kirim', nilai: v }));
      }
      if (dropdownRows.length > 0) {
        await safeUpsert('master_dropdown', dropdownRows);
      }
    }

    // 10. Sync Thread Config
    if (payload.threadNumberConfig) {
      const tc = payload.threadNumberConfig;
      await safeUpsert('thread_number_config', [{
        id: 'default',
        format: tc.format || '[PREFIX]-[YYYY]-[COUNTER]',
        prefix: tc.prefix || 'TH',
        separator: tc.separator || '-',
        counter_digits: tc.counterDigits || 4,
        current_counter: tc.currentCounter || 100,
        reset_period: tc.resetPeriod || 'yearly',
        last_reset_year: tc.lastResetYear || new Date().getFullYear(),
        last_reset_month: tc.lastResetMonth || 1
      }]);
    }

    return {
      success: errors.length === 0,
      errors
    };
  } catch (e: any) {
    console.error('Error pushToSupabase:', e);
    return {
      success: false,
      errors: [e?.message || 'Gagal menyimpan ke Supabase']
    };
  }
};

/**
 * Fungsi untuk mengosongkan / me-reset satu tabel spesifik di Supabase PostgreSQL Database
 */
export const clearTableInSupabase = async (
  tableName: string,
  extraCondition?: { column: string; value: any }
): Promise<{ success: boolean; message: string }> => {
  try {
    let query = supabase.from(tableName).delete();
    if (extraCondition) {
      query = query.eq(extraCondition.column, extraCondition.value);
    } else {
      query = query.neq('id', '___DUMMY_NON_EXISTENT_ID___');
    }
    const { error } = await query;
    if (error) {
      console.warn(`[Supabase Clear Error] Gagal reset tabel '${tableName}':`, error.message);
      return {
        success: false,
        message: `Gagal me-reset tabel '${tableName}' di Supabase: ${error.message}`
      };
    }
    return {
      success: true,
      message: `Tabel '${tableName}' di Supabase berhasil dikosongkan.`
    };
  } catch (err: any) {
    console.error(`Exception clearing table ${tableName}:`, err);
    return {
      success: false,
      message: `Error koneksi saat me-reset tabel '${tableName}': ${err?.message || 'Gagal koneksi'}`
    };
  }
};

