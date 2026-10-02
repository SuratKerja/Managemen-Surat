-- ====================================================================
-- SCRIPT SQL SCHEMA SUPABASE UNTUK APLIKASI MANAGEMENT SURAT
-- Salin seluruh isi script ini dan Jalankan di SUPABASE SQL EDITOR
-- ====================================================================

-- 1. TABEL USERS (Pengguna & Akses Role)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nip TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jenis_user TEXT NOT NULL DEFAULT 'Pegawai',
  unit_kerja TEXT NOT NULL DEFAULT 'Sekretariat Utama',
  password TEXT NOT NULL DEFAULT '123456',
  hak_akses JSONB DEFAULT '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Laporan"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL UNIT KERJA
CREATE TABLE IF NOT EXISTS public.unit_kerja (
  id BIGSERIAL PRIMARY KEY,
  nama_unit TEXT UNIQUE NOT NULL
);

-- 3. TABEL NASKAH MASUK
CREATE TABLE IF NOT EXISTS public.naskah_masuk (
  id TEXT PRIMARY KEY,
  nomor_agenda TEXT,
  nomor_naskah TEXT NOT NULL,
  tgl_naskah TEXT,
  tgl_terima TEXT,
  instansi_terkait TEXT,
  perihal TEXT NOT NULL,
  jenis_naskah TEXT,
  status_penyelesaian TEXT DEFAULT 'Dalam Proses',
  catatan TEXT,
  klasifikasi_sub TEXT,
  sifat_naskah TEXT DEFAULT 'Biasa',
  unit_kerja TEXT DEFAULT 'Sekretariat Utama',
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL NASKAH KELUAR
CREATE TABLE IF NOT EXISTS public.naskah_keluar (
  id TEXT PRIMARY KEY,
  nomor_agenda TEXT,
  nomor_naskah TEXT NOT NULL,
  tgl_naskah TEXT,
  tujuan_naskah TEXT,
  perihal TEXT NOT NULL,
  jenis_naskah TEXT,
  status_pengiriman TEXT DEFAULT 'Belum Terkirim',
  tgl_kirim TEXT,
  catatan TEXT,
  klasifikasi_sub TEXT,
  sifat_naskah TEXT DEFAULT 'Biasa',
  unit_kerja TEXT DEFAULT 'Sekretariat Utama',
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL BERKAS THREAD (Pemberkasan Surat)
CREATE TABLE IF NOT EXISTS public.berkas_thread (
  id TEXT PRIMARY KEY,
  nomor_thread TEXT NOT NULL,
  nama_berkas TEXT NOT NULL,
  klasifikasi_berkas TEXT,
  kode_klasifikasi TEXT,
  nama_klasifikasi_arsip TEXT,
  keterangan TEXT,
  status TEXT DEFAULT 'Aktif',
  unit_kerja TEXT DEFAULT 'Sekretariat Utama',
  lokasi_fisik TEXT,
  naskah_masuk_ids JSONB DEFAULT '[]'::jsonb,
  naskah_keluar_ids JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL KLASIFIKASI ARSIP
CREATE TABLE IF NOT EXISTS public.klasifikasi_arsip (
  id TEXT PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  retensi_aktif TEXT DEFAULT '2 Tahun',
  retensi_inaktif TEXT DEFAULT '5 Tahun',
  keterangan TEXT
);

-- 7. TABEL INSTANSI WILAYAH
CREATE TABLE IF NOT EXISTS public.instansi_wilayah (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  wilayah TEXT
);

-- 8. TABEL KLASIFIKASI SUB
CREATE TABLE IF NOT EXISTS public.klasifikasi_sub (
  id BIGSERIAL PRIMARY KEY,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL
);

-- 9. TABEL THREAD NUMBER CONFIG
CREATE TABLE IF NOT EXISTS public.thread_number_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  format TEXT DEFAULT '[PREFIX]-[YYYY]-[COUNTER]',
  prefix TEXT DEFAULT 'TH',
  counter_digits INT DEFAULT 4,
  current_counter INT DEFAULT 100,
  reset_period TEXT DEFAULT 'yearly',
  last_reset_year INT DEFAULT 2026,
  last_reset_month INT DEFAULT 1
);

-- 10. TABEL APP SETTINGS (Pengaturan Tambahan)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.naskah_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.naskah_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berkas_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klasifikasi_arsip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instansi_wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klasifikasi_sub ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_number_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- HAPUS POLICY LAMA JIKA SUDAH ADA (AGAR TIDAK ERROR "ALREADY EXISTS")
-- ====================================================================

DROP POLICY IF EXISTS "Public full access users" ON public.users;
DROP POLICY IF EXISTS "Public full access unit_kerja" ON public.unit_kerja;
DROP POLICY IF EXISTS "Public full access naskah_masuk" ON public.naskah_masuk;
DROP POLICY IF EXISTS "Public full access naskah_keluar" ON public.naskah_keluar;
DROP POLICY IF EXISTS "Public full access berkas_thread" ON public.berkas_thread;
DROP POLICY IF EXISTS "Public full access klasifikasi_arsip" ON public.klasifikasi_arsip;
DROP POLICY IF EXISTS "Public full access instansi_wilayah" ON public.instansi_wilayah;
DROP POLICY IF EXISTS "Public full access klasifikasi_sub" ON public.klasifikasi_sub;
DROP POLICY IF EXISTS "Public full access thread_number_config" ON public.thread_number_config;
DROP POLICY IF EXISTS "Public full access app_settings" ON public.app_settings;

-- ====================================================================
-- BUAT POLICY BARU UNTUK AKSES FULL ANONYMOUS
-- ====================================================================

CREATE POLICY "Public full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access unit_kerja" ON public.unit_kerja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access naskah_masuk" ON public.naskah_masuk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access naskah_keluar" ON public.naskah_keluar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access berkas_thread" ON public.berkas_thread FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access klasifikasi_arsip" ON public.klasifikasi_arsip FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access instansi_wilayah" ON public.instansi_wilayah FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access klasifikasi_sub" ON public.klasifikasi_sub FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access thread_number_config" ON public.thread_number_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DATA AWAL (Pengguna & Unit Kerja Default)
-- ====================================================================

INSERT INTO public.users (nip, nama, jenis_user, unit_kerja, password, hak_akses)
VALUES 
  ('198901012010011001', 'Admin Utama', 'Admin', 'Sekretariat Utama', '123456', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Master Data", "Laporan"]'::jsonb),
  ('199203152015022002', 'Budi Santoso', 'Pegawai', 'Bagian Umum & Keuangan', '123456', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Laporan"]'::jsonb),
  ('199507202018031003', 'Siti Rahma', 'Pegawai', 'Bidang Tata Usaha', '123456', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Laporan"]'::jsonb)
ON CONFLICT (nip) DO NOTHING;

INSERT INTO public.unit_kerja (nama_unit)
VALUES 
  ('Sekretariat Utama'),
  ('Bagian Umum & Keuangan'),
  ('Bidang Tata Usaha'),
  ('Bidang Perencanaan & Program'),
  ('Subbag Kearsipan & Kepegawaian')
ON CONFLICT (nama_unit) DO NOTHING;

INSERT INTO public.thread_number_config (id, format, prefix, counter_digits, current_counter, reset_period, last_reset_year, last_reset_month)
VALUES ('default', '[PREFIX]-[YYYY]-[COUNTER]', 'TH', 4, 100, 'yearly', 2026, 1)
ON CONFLICT (id) DO NOTHING;
