export type UserRole = 'Admin' | 'Operator' | 'Verifikator' | 'Public';

export interface UserAccount {
  id: string;
  nip: string;
  nama: string;
  password?: string;
  email?: string; // Email Google untuk penerimaan kode verifikasi OTP
  jenisUser: UserRole;
  unitKerja?: string; // Unit Kerja pengguna (misal: Bidang Pelayanan, Bagian Umum, dll)
  hakAkses: string[]; // e.g. ["Dashboard", "Naskah Masuk", "Naskah Keluar", "Master Data", "Laporan"]
}

export interface InstansiWilayah {
  id: string;
  instansi: string;
  wilayahKerja: string;
}

export interface KlasifikasiSub {
  id: string;
  klasifikasiUtama: string;
  subKlasifikasiList: string[];
}

export interface NaskahMasukItem {
  id: string;
  tglTerima: string; // YYYY-MM-DD
  nomorNaskah: string;
  tglNaskah: string; // YYYY-MM-DD
  perihal: string;
  jenisNaskah: string;
  pengirimNaskah: string;
  instansiTerkait: string;
  wilayahKerja: string;
  unitKerja?: string; // Unit Kerja penerima/pengelola naskah masuk
  klasifikasiUtama: string;
  subKlasifikasi: string;
  statusPenyelesaian: string;
  sla: number; // in days
  fileLinkNaskahMasuk: string;
  fileLinkNaskahDijawab: string;
  createdBy: string; // NIP of creator
  createdByName: string; // Name of creator
  createdAt: string;
}

export interface NaskahKeluarItem {
  id: string;
  tglNaskah: string;
  nomorNaskah: string;
  perihal: string;
  jenisNaskah: string;
  tujuanNaskah: string;
  instansiTerkait: string;
  wilayahKerja: string;
  unitKerja?: string; // Unit Kerja pengirim/pembuat naskah keluar
  klasifikasiUtama: string;
  subKlasifikasi: string;
  tglKirim: string; // empty string if unset
  statusPengiriman: string; // active only if tglKirim is set
  buktiKirim?: string; // Bukti Kirim (link resi / foto / dokumen bukti pengiriman)
  fileLinkNaskahMasuk: string;
  fileLinkNaskahDijawab: string;
  catatan: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface GoogleSheetConfig {
  sheetUrlOrId: string;
  webhookUrl: string;
  syncEnabled: boolean;
  lastSyncedAt?: string;
}

export interface KlasifikasiArsipItem {
  id: string;
  kodeKlasifikasi: string; // e.g. "KP.01.00", "KP.02.00", "HK.01.00", "KU.01.00"
  namaKlasifikasi: string; // e.g. "Pengadaan dan Rekrutmen Pegawai", "Mutasi dan Kenaikan Pangkat"
  deskripsi?: string;
  retensiAktif?: number; // Tahun retensi berkas aktif (contoh: 2)
  retensiInaktif?: number; // Tahun retensi berkas inaktif (contoh: 5)
  nasibAkhir?: 'Musnah' | 'Permanen' | 'Dinilai Kembali';
  createdAt?: string;
}

export interface ThreadNumberConfig {
  prefix: string; // e.g. "TH" atau "BRK"
  separator: string; // e.g. "-" atau "/"
  format: string; // e.g. "[PREFIX]-[YYYY]-[COUNTER]" atau "[PREFIX]/[YYYY]/[MM]/[COUNTER]"
  counterDigits: number; // e.g. 4 -> 0001
  currentCounter: number; // counter berjalan
  resetPeriod: 'yearly' | 'monthly' | 'never';
  lastResetYear?: number;
  lastResetMonth?: number;
}

export interface SlaConfig {
  maxSlaTepat: number; // Default: 4 Hari Kerja
  labelBelumSelesai: string; // Default: "Belum Selesai"
  labelTepatSla: string; // Default: "Selesai Tepat SLA"
  labelMelebihiSla: string; // Default: "Selesai Melebihi SLA"
}

export interface ThreadHistoryItem {
  id: string;
  timestamp: string; // ISO date string
  type: 'create' | 'link_masuk' | 'link_keluar' | 'unlink_masuk' | 'unlink_keluar' | 'status_change' | 'note';
  actorNip: string;
  actorName: string;
  description: string;
  refNomorNaskah?: string;
}

export interface BerkasThread {
  id: string;
  nomorThread: string; // Nomor Thread Otomatis sesuai konfigurasi
  namaBerkas: string; // Textbox Nama Berkas
  klasifikasiBerkas: string; // Dropdown Klasifikasi (Klasifikasi Utama / Sub-Klasifikasi)
  kodeKlasifikasi: string; // Kode Klasifikasi (Kode Arsip dari Master Data "Klasifikasi Arsip")
  namaKlasifikasiArsip?: string; // Uraian dari Kode Arsip terpilih
  keterangan?: string; // Catatan / Deskripsi berkas
  uraianBerkas?: string; // Alias untuk uraian / deskripsi berkas
  status: 'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup';
  statusBerkas?: 'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup';
  unitKerja?: string;
  lokasiFisik?: string; // Lokasi penyimpanan fisik arsip (boks/rak/lemari)
  naskahMasukIds: string[]; // List ID Naskah Masuk terhubung
  naskahKeluarIds: string[]; // List ID Naskah Keluar terhubung
  history: ThreadHistoryItem[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'naskahMasuk'
  | 'naskahKeluar'
  | 'pemberkasan'
  | 'masterData'
  | 'masterJenisMasuk'
  | 'masterJenisKeluar'
  | 'masterUnitKerja'
  | 'masterInstansi'
  | 'masterSubKlasifikasi'
  | 'masterKlasifikasiArsip'
  | 'masterStatus'
  | 'settings'
  | 'settingUserRole'
  | 'settingCounterThread'
  | 'settingSla'
  | 'settingSupabase'
  | 'settingResetTables'
  | 'laporan'
  | 'rekapitulasi'
  | 'daftarArsipAktif';
