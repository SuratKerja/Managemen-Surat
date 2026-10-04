import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Inbox,
  Send,
  Database,
  FileSpreadsheet,
  BarChart3,
  RefreshCw,
  CloudUpload,
  DownloadCloud,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronRight,
  FolderKanban,
  Archive,
  Settings,
  Users,
  Hash,
  Trash2,
  Tag,
  FolderOpen,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';

interface TopBarProps {
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenGoogleSheetsModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenGoogleSheetsModal,
  isFullscreen,
  onToggleFullscreen
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    logout,
    googleSheetConfig,
    syncWithGoogleSheets,
    reloadAllData,
    isSandbox,
    dbMode
  } = useApp();

  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  const handlePullDB = async () => {
    setIsPulling(true);
    await reloadAllData();
    setIsPulling(false);
  };

  const handlePushDB = async () => {
    setIsPushing(true);
    await syncWithGoogleSheets(); // Pushes directly to Supabase Cloud Database
    setIsPushing(false);
  };

  const tabMeta: Record<
    ActiveTab,
    { title: string; subtitle: string; icon: React.ReactNode; color: string }
  > = {
    dashboard: {
      title: 'Dashboard Monitoring',
      subtitle: 'Ringkasan & status sirkulasi surat',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" />,
      color: 'emerald'
    },
    naskahMasuk: {
      title: 'Naskah Masuk',
      subtitle: 'Penerimaan, agenda & disposisi surat masuk',
      icon: <Inbox className="w-4 h-4 text-teal-600" />,
      color: 'teal'
    },
    naskahKeluar: {
      title: 'Naskah Keluar',
      subtitle: 'Pencatatan, pengiriman & bukti kirim surat keluar',
      icon: <Send className="w-4 h-4 text-cyan-600" />,
      color: 'cyan'
    },
    pemberkasan: {
      title: 'Pemberkasan (Thread Surat)',
      subtitle: 'Penggabungan naskah masuk & naskah keluar terkait dan riwayat alur berkas',
      icon: <FolderKanban className="w-4 h-4 text-amber-600" />,
      color: 'amber'
    },
    rekapitulasi: {
      title: 'Rekapitulasi Naskah',
      subtitle: 'Matriks & analitik sebaran naskah dinas',
      icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
      color: 'violet'
    },
    laporan: {
      title: 'Laporan & Ekspor',
      subtitle: 'Pencarian arsip & ekspor Excel / PDF',
      icon: <FileSpreadsheet className="w-4 h-4 text-purple-600" />,
      color: 'purple'
    },
    daftarArsipAktif: {
      title: 'Daftar Arsip Aktif',
      subtitle: 'Daftar inventaris berkas arsip aktif & item naskah dinas (Folio Landscape)',
      icon: <Archive className="w-4 h-4 text-emerald-600" />,
      color: 'emerald'
    },
    masterData: {
      title: 'Master Data',
      subtitle: 'Pengelolaan data dropdown & referensi utama sistem',
      icon: <Database className="w-4 h-4 text-indigo-600" />,
      color: 'indigo'
    },
    masterJenisMasuk: {
      title: 'Master Data • Jenis Naskah Masuk',
      subtitle: 'Opsi dropdown jenis naskah untuk registrasi naskah masuk',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      color: 'emerald'
    },
    masterJenisKeluar: {
      title: 'Master Data • Jenis Naskah Keluar',
      subtitle: 'Opsi dropdown jenis naskah untuk registrasi naskah keluar',
      icon: <FileText className="w-4 h-4 text-teal-600" />,
      color: 'teal'
    },
    masterUnitKerja: {
      title: 'Master Data • Unit Kerja Pengelola',
      subtitle: 'Master unit kerja & bidang pengelola naskah organisasi',
      icon: <Building2 className="w-4 h-4 text-cyan-600" />,
      color: 'cyan'
    },
    masterInstansi: {
      title: 'Master Data • Instansi & Wilayah Kerja',
      subtitle: 'Master daftar instansi luar/mitra dan wilayah kerjanya',
      icon: <Building2 className="w-4 h-4 text-blue-600" />,
      color: 'blue'
    },
    masterSubKlasifikasi: {
      title: 'Master Data • Sub-Klasifikasi Arsip',
      subtitle: 'Master rincian sub-klasifikasi arsip instansi',
      icon: <Tag className="w-4 h-4 text-amber-600" />,
      color: 'amber'
    },
    masterKlasifikasiArsip: {
      title: 'Master Data • Kode Klasifikasi Arsip',
      subtitle: 'Master kode klasifikasi, retensi aktif/inaktif & nasib akhir',
      icon: <FolderKanban className="w-4 h-4 text-orange-600" />,
      color: 'orange'
    },
    masterStatus: {
      title: 'Master Data • Status Penyelesaian & Kirim',
      subtitle: 'Master opsi status penyelesaian naskah dan status pengiriman',
      icon: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
      color: 'purple'
    },
    settings: {
      title: 'Setting & Konfigurasi',
      subtitle: 'Modul pusat pengaturan dan sub-menu aplikasi',
      icon: <Settings className="w-4 h-4 text-cyan-600" />,
      color: 'cyan'
    },
    settingUserRole: {
      title: 'Setting • Pengaturan Role & User',
      subtitle: 'Pengelolaan akun, NIP, password, dan hak akses menu',
      icon: <Users className="w-4 h-4 text-blue-600" />,
      color: 'blue'
    },
    settingCounterThread: {
      title: 'Setting • Format Penomoran Thread',
      subtitle: 'Konfigurasi prefix, separator & counter otomatis pemberkasan',
      icon: <Hash className="w-4 h-4 text-amber-600" />,
      color: 'amber'
    },
    settingSla: {
      title: 'Setting • Aturan SLA (Hari Kerja)',
      subtitle: 'Batas hari kerja SLA & otomatisasi Status Penyelesaian Naskah Masuk',
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      color: 'emerald'
    },
    settingSupabase: {
      title: 'Setting • Supabase Cloud DB',
      subtitle: 'Koneksi, diagnosa tabel & DDL SQL setup Supabase PostgreSQL',
      icon: <Database className="w-4 h-4 text-cyan-600" />,
      color: 'cyan'
    },
    settingResetTables: {
      title: 'Setting • Reset Data Per-Tabel',
      subtitle: 'Panel pengosongan data lokal & cloud per-tabel',
      icon: <Trash2 className="w-4 h-4 text-rose-600" />,
      color: 'rose'
    }
  };

  const currentTab = tabMeta[activeTab] || tabMeta.dashboard;

  return (
    <header className="h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">
      {/* Left Section: Sidebar Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Buka Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar (Fullscreen Rail)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-emerald-700" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Breadcrumb & Current Module Title */}
        <div className="flex items-center gap-2 truncate text-xs sm:text-sm">
          <span className="font-semibold text-slate-400 hidden sm:inline">Management Surat</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-slate-100 border border-slate-200/80">
              {currentTab.icon}
            </span>
            <span className="font-bold text-slate-800 tracking-tight truncate">
              {currentTab.title}
            </span>
          </div>

          {/* Unit Kerja Badge (if logged in with unit kerja) */}
          {currentUser?.unitKerja && (
            <span className="hidden md:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Building2 className="w-3 h-3" />
              <span>{currentUser.unitKerja}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right Section: Cloud Actions, Fullscreen Button & User Quick Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Environment / Database Mode Badge */}
        <button
          onClick={() => setActiveTab('settingSupabase')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isSandbox
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
          }`}
          title={
            isSandbox
              ? 'Mode Sandbox Aktif: Database Production Supabase aman & tidak tersentuh. Klik untuk kelola mode di Pengaturan.'
              : 'Mode Supabase Production Live: Terhubung ke database cloud. Klik untuk kelola mode di Pengaturan.'
          }
        >
          {isSandbox ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-tight">🛡️ Sandbox (Prod Aman)</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-black tracking-tight">🌐 Prod Live</span>
            </>
          )}
        </button>

        {/* Supabase Cloud DB Quick Actions */}
        <div className="hidden sm:flex items-center gap-1.5">
          {isAdmin && (
            <button
              onClick={handlePullDB}
              disabled={isPulling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
              title="Muat ulang (Pull) data terbaru dari Supabase Cloud Database"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
              <span className="hidden md:inline">{isPulling ? 'Menarik...' : 'Reload'}</span>
            </button>
          )}

          <button
            onClick={handlePushDB}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            title="Kirim (Push) semua perubahan data ke Supabase Database"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
            <span className="hidden md:inline">{isPushing ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

        {/* Native Fullscreen Mode Button */}
        <button
          onClick={onToggleFullscreen}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            isFullscreen
              ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 border-slate-200'
          }`}
          title={
            isFullscreen
              ? 'Keluar dari Mode Layar Penuh (ESC)'
              : 'Aktifkan Mode Layar Penuh (Fullscreen)'
          }
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden md:inline">Layar Penuh</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Fullscreen</span>
            </>
          )}
        </button>

        {/* User Chip & Logout */}
        {currentUser && (
          <div className="flex items-center gap-1.5 pl-1">
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-semibold text-slate-700"
              title={`${currentUser.nama} (${currentUser.jenisUser} - NIP: ${currentUser.nip})`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[100px] sm:max-w-[140px] truncate">{currentUser.nama}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout / Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
