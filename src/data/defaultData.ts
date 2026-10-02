import {
  UserAccount,
  InstansiWilayah,
  KlasifikasiSub,
  NaskahMasukItem,
  NaskahKeluarItem,
  KlasifikasiArsipItem,
  ThreadNumberConfig,
  SlaConfig,
  BerkasThread
} from '../types';

export const defaultUsers: UserAccount[] = [
  {
    id: 'user-1',
    nip: '198901012010011001',
    nama: 'Riswan Anas',
    password: 'admin',
    email: 'suratkerja89@gmail.com',
    jenisUser: 'Admin',
    unitKerja: 'Sekretariat Utama',
    hakAkses: ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Master Data', 'Setting', 'Laporan', 'Rekapitulasi', 'Daftar Arsip Aktif']
  },
  {
    id: 'user-2',
    nip: '199203152015022003',
    nama: 'Ahmad Fauzi (Operator)',
    password: 'user',
    email: 'operator.surat@gmail.com',
    jenisUser: 'Operator',
    unitKerja: 'Bidang Pelayanan & Mutasi',
    hakAkses: ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan', 'Rekapitulasi', 'Daftar Arsip Aktif']
  },
  {
    id: 'user-3',
    nip: '199508202018032005',
    nama: 'Siti Rahmawati (Verifikator)',
    password: 'user',
    email: 'verifikator.surat@gmail.com',
    jenisUser: 'Verifikator',
    unitKerja: 'Bidang Pelayanan & Mutasi',
    hakAkses: ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan', 'Rekapitulasi', 'Daftar Arsip Aktif']
  }
];

export const defaultUnitKerjaList: string[] = [
  'Sekretariat Utama',
  'Bidang Pelayanan & Mutasi',
  'Bidang Pengadaan & Kepangkatan',
  'Bidang Informasi Kepegawaian',
  'Bagian Umum & Keuangan',
  'Inspektorat',
  'Bagian Umum'
];

export const defaultJenisNaskahMasuk: string[] = [
  'Surat Biasa',
  'Surat Undangan',
  'Surat Edaran',
  'Nota Dinas',
  'Surat Perintah',
  'Surat Keputusan',
  'Surat Pengantar',
  'Surat Rahasia',
  'Surat Tugas',
  'Instruksi',
  'Pengumuman'
];

export const defaultJenisNaskahKeluar: string[] = [
  'Surat Biasa',
  'Surat Undangan',
  'Surat Edaran',
  'Nota Dinas',
  'Surat Tugas',
  'Surat Keterangan',
  'Surat Jawaban',
  'Surat Panggilan',
  'Surat Perintah',
  'Surat Keputusan',
  'Instruksi',
  'Pengumuman'
];

export const defaultInstansiWilayah: InstansiWilayah[] = [
  { id: 'ins-1', instansi: 'BKN Pusat Jakarta', wilayahKerja: 'Kantor Pusat Jakarta' },
  { id: 'ins-2', instansi: 'Kanreg I BKN Yogyakarta', wilayahKerja: 'Wilayah Kerja Kanreg I (DI Yogyakarta)' },
  { id: 'ins-3', instansi: 'Kanreg II BKN Surabaya', wilayahKerja: 'Wilayah Kerja Kanreg II (Jawa Timur)' },
  { id: 'ins-4', instansi: 'Kanreg III BKN Bandung', wilayahKerja: 'Wilayah Kerja Kanreg III (Jawa Barat & Banten)' },
  { id: 'ins-5', instansi: 'Kanreg IV BKN Makassar', wilayahKerja: 'Wilayah Kerja Kanreg IV (Sulawesi Selatan)' },
  { id: 'ins-6', instansi: 'Kanreg V BKN Jakarta', wilayahKerja: 'Wilayah Kerja Kanreg V (DKI Jakarta)' },
  { id: 'ins-7', instansi: 'Kementerian PANRB', wilayahKerja: 'Pusat Jakarta' },
  { id: 'ins-8', instansi: 'Kementerian Dalam Negeri', wilayahKerja: 'Pusat Jakarta' },
  { id: 'ins-9', instansi: 'Pemerintah Provinsi Jawa Barat', wilayahKerja: 'Bandung - Jawa Barat' },
  { id: 'ins-10', instansi: 'Pemerintah Provinsi DKI Jakarta', wilayahKerja: 'Balai Kota DKI Jakarta' }
];

export const defaultKlasifikasiSub: KlasifikasiSub[] = [
  {
    id: 'klas-1',
    klasifikasiUtama: 'Pengaduan Kepegawaian',
    subKlasifikasiList: [
      'Pengaduan Keterlambatan Layanan',
      'Pengaduan Pelanggaran Disiplin Pegawai',
      'Pengaduan Sengketa Mutasi',
      'Pengaduan Layanan Pensiun'
    ]
  },
  {
    id: 'klas-2',
    klasifikasiUtama: 'Mutasi & Promosi',
    subKlasifikasiList: [
      'Kenaikan Pangkat Reguler',
      'Kenaikan Pangkat Pilihan',
      'Mutasi Antar Instansi',
      'Pengangkatan Dalam Jabatan Fungsional'
    ]
  },
  {
    id: 'klas-3',
    klasifikasiUtama: 'Pensiun & Pemberhentian',
    subKlasifikasiList: [
      'Pensiun Batas Usia Pensiun (BUP)',
      'Pensiun Atas Permintaan Sendiri',
      'Pemberhentian Sementara',
      'Janda / Duda Pensiunan'
    ]
  },
  {
    id: 'klas-4',
    klasifikasiUtama: 'Umum & Kerjasama',
    subKlasifikasiList: [
      'Undangan Rapat Koordinasi',
      'Kerjasama Antar Instansi (MoU)',
      'Permohonan Narasumber',
      'Permintaan Data & Informasi'
    ]
  }
];

export const defaultStatusPenyelesaian: string[] = [
  'Selesai Tepat SLA',
  'Selesai Melebihi SLA',
  'Belum Selesai',
  'Selesai',
  'Dalam Proses',
  'Ditunda',
  'Menunggu Verifikasi',
  'Disposisi Pimpinan'
];

export const defaultStatusKirim: string[] = [
  'Terkirim',
  'Belum Terkirim',
  'Gagal Kirim',
  'Diterima Tujuan',
  'Menunggu Kurir / Ekspedisi'
];

export const defaultNaskahMasukList: NaskahMasukItem[] = [];

export const defaultNaskahKeluarList: NaskahKeluarItem[] = [];

export const defaultKlasifikasiArsip: KlasifikasiArsipItem[] = [
  {
    id: 'ka-1',
    kodeKlasifikasi: 'KP.01.00',
    namaKlasifikasi: 'Pengadaan dan Rekrutmen Pegawai ASN',
    deskripsi: 'Berkas proses seleksi CASN, formasi jabatan, penetapan NIP, dan pengangkatan CPNS/PPPK.',
    retensiAktif: 2,
    retensiInaktif: 5,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-2',
    kodeKlasifikasi: 'KP.02.00',
    namaKlasifikasi: 'Mutasi, Kepangkatan, dan Jabatan',
    deskripsi: 'Kenaikan pangkat berkala, mutasi antar instansi, pengangkatan dalam jabatan struktural/fungsional.',
    retensiAktif: 2,
    retensiInaktif: 5,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-3',
    kodeKlasifikasi: 'KP.03.00',
    namaKlasifikasi: 'Disiplin, Etika, dan Pengawasan Pegawai',
    deskripsi: 'Pemeriksaan pelanggaran disiplin ASN, sanksi hukuman disiplin, dan persidangan BAPEK.',
    retensiAktif: 3,
    retensiInaktif: 7,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-4',
    kodeKlasifikasi: 'KP.04.00',
    namaKlasifikasi: 'Pensiun dan Pemberhentian Pegawai',
    deskripsi: 'Batas usia pensiun (BUP), pensiun dini, pensiun janda/duda, dan penetapan SK pensiun.',
    retensiAktif: 2,
    retensiInaktif: 10,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-5',
    kodeKlasifikasi: 'HK.01.00',
    namaKlasifikasi: 'Peraturan Perundang-Undangan & Telaah Hukum',
    deskripsi: 'Rancangan Keputusan, telaahan hukum, regulasi instansi, dan nota kesepahaman (MoU).',
    retensiAktif: 5,
    retensiInaktif: 10,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-6',
    kodeKlasifikasi: 'OT.01.00',
    namaKlasifikasi: 'Organisasi, Tata Laksana, dan Reformasi Birokrasi',
    deskripsi: 'Penataan struktur kelembagaan, analisis beban kerja, SOP, evaluasi reformasi birokrasi.',
    retensiAktif: 2,
    retensiInaktif: 5,
    nasibAkhir: 'Permanen',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-7',
    kodeKlasifikasi: 'KU.01.00',
    namaKlasifikasi: 'Perencanaan Anggaran & Keuangan',
    deskripsi: 'Rencana kerja dan anggaran, DIPA, revisi anggaran, pertanggungjawaban belanja dinas.',
    retensiAktif: 2,
    retensiInaktif: 10,
    nasibAkhir: 'Musnah',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ka-8',
    kodeKlasifikasi: 'HM.01.00',
    namaKlasifikasi: 'Hubungan Masyarakat, Publikasi, dan Protokol',
    deskripsi: 'Siaran pers, peliputan media, pengelolaan website/medsos, dan agenda keprotokolan.',
    retensiAktif: 1,
    retensiInaktif: 3,
    nasibAkhir: 'Dinilai Kembali',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const defaultThreadNumberConfig: ThreadNumberConfig = {
  prefix: 'TH',
  separator: '-',
  format: '[PREFIX]-[YYYY]-[COUNTER]',
  counterDigits: 4,
  currentCounter: 1,
  resetPeriod: 'yearly',
  lastResetYear: 2026,
  lastResetMonth: 9
};

export const defaultSlaConfig: SlaConfig = {
  maxSlaTepat: 4,
  labelBelumSelesai: 'Belum Selesai',
  labelTepatSla: 'Selesai Tepat SLA',
  labelMelebihiSla: 'Selesai Melebihi SLA'
};

export const defaultBerkasThreadList: BerkasThread[] = [];
