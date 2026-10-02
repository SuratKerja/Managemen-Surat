-- ====================================================================
-- SCRIPT SQL SCHEMA RESMI SUPABASE UNTUK APLIKASI MANAGEMENT SURAT
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor
-- ====================================================================

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

-- 3. TABEL BERKAS THREAD (Pemberkasan Surat)
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

-- 4. TABEL USERS (Pengguna & Hak Akses)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nip TEXT UNIQUE NOT NULL,
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

-- AKTIFKAN RLS & BUAT POLICY HAK AKSES PENUH
ALTER TABLE public.naskah_masuk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Naskah_Masuk" ON public.naskah_masuk;
DROP POLICY IF EXISTS "Public full access naskah_masuk" ON public.naskah_masuk;
CREATE POLICY "Allow_All_Naskah_Masuk" ON public.naskah_masuk FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.naskah_keluar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Naskah_Keluar" ON public.naskah_keluar;
DROP POLICY IF EXISTS "Public full access naskah_keluar" ON public.naskah_keluar;
CREATE POLICY "Allow_All_Naskah_Keluar" ON public.naskah_keluar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.berkas_thread ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Berkas_Thread" ON public.berkas_thread;
DROP POLICY IF EXISTS "Public full access berkas_thread" ON public.berkas_thread;
CREATE POLICY "Allow_All_Berkas_Thread" ON public.berkas_thread FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Users" ON public.users;
DROP POLICY IF EXISTS "Public full access users" ON public.users;
CREATE POLICY "Allow_All_Users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Unit_Kerja" ON public.unit_kerja;
DROP POLICY IF EXISTS "Public full access unit_kerja" ON public.unit_kerja;
CREATE POLICY "Allow_All_Unit_Kerja" ON public.unit_kerja FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.klasifikasi_arsip ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Klasifikasi_Arsip" ON public.klasifikasi_arsip;
DROP POLICY IF EXISTS "Public full access klasifikasi_arsip" ON public.klasifikasi_arsip;
CREATE POLICY "Allow_All_Klasifikasi_Arsip" ON public.klasifikasi_arsip FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.instansi_wilayah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Instansi_Wilayah" ON public.instansi_wilayah;
DROP POLICY IF EXISTS "Public full access instansi_wilayah" ON public.instansi_wilayah;
CREATE POLICY "Allow_All_Instansi_Wilayah" ON public.instansi_wilayah FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.klasifikasi_sub ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Klasifikasi_Sub" ON public.klasifikasi_sub;
DROP POLICY IF EXISTS "Public full access klasifikasi_sub" ON public.klasifikasi_sub;
CREATE POLICY "Allow_All_Klasifikasi_Sub" ON public.klasifikasi_sub FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.master_dropdown ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Master_Dropdown" ON public.master_dropdown;
CREATE POLICY "Allow_All_Master_Dropdown" ON public.master_dropdown FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.thread_number_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Thread_Config" ON public.thread_number_config;
DROP POLICY IF EXISTS "Public full access thread_number_config" ON public.thread_number_config;
CREATE POLICY "Allow_All_Thread_Config" ON public.thread_number_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SEED DATA AWAL (Pengguna, Unit Kerja, & Konfigurasi Default)
INSERT INTO public.users (id, nip, nama, password, email, jenis_user, unit_kerja, hak_akses)
VALUES 
  ('USR-1', '198901012010011001', 'Riswan Anas', 'admin', 'suratkerja89@gmail.com', 'Admin', 'Sekretariat Utama', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Master Data", "Setting", "Laporan", "Rekapitulasi", "Daftar Arsip Aktif"]'::jsonb),
  ('USR-2', '199203152015022003', 'Ahmad Fauzi (Operator)', 'user', 'operator.surat@gmail.com', 'Operator', 'Bidang Pelayanan & Mutasi', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Laporan", "Rekapitulasi", "Daftar Arsip Aktif"]'::jsonb),
  ('USR-3', '199508202018032005', 'Siti Rahmawati (Verifikator)', 'user', 'verifikator.surat@gmail.com', 'Verifikator', 'Bidang Pelayanan & Mutasi', '["Dashboard", "Naskah Masuk", "Naskah Keluar", "Pemberkasan", "Laporan", "Rekapitulasi", "Daftar Arsip Aktif"]'::jsonb)
ON CONFLICT (nip) DO UPDATE SET 
  nama = EXCLUDED.nama,
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  jenis_user = EXCLUDED.jenis_user,
  unit_kerja = EXCLUDED.unit_kerja,
  hak_akses = EXCLUDED.hak_akses;

INSERT INTO public.unit_kerja (id, nama_unit)
VALUES 
  ('UK-1', 'Sekretariat Utama'),
  ('UK-2', 'Bidang Pelayanan & Mutasi'),
  ('UK-3', 'Bidang Pengadaan & Kepangkatan'),
  ('UK-4', 'Bidang Informasi Kepegawaian'),
  ('UK-5', 'Bagian Umum & Keuangan'),
  ('UK-6', 'Inspektorat'),
  ('UK-7', 'Bagian Umum')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.thread_number_config (id, prefix, separator, format, counter_digits, current_counter, reset_period, last_reset_year, last_reset_month)
VALUES ('default', 'TH', '-', '[PREFIX]-[YYYY]-[COUNTER]', 4, 100, 'yearly', 2026, 1)
ON CONFLICT (id) DO NOTHING;
