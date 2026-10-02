/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { NaskahMasukForm } from './components/NaskahMasukForm';
import { NaskahKeluarForm } from './components/NaskahKeluarForm';
import { MasterDataSettings } from './components/MasterDataSettings';
import { SettingsView } from './components/SettingsView';
import { LaporanView } from './components/LaporanView';
import { RekapitulasiView } from './components/RekapitulasiView';
import { PemberkasanView } from './components/PemberkasanView';
import { DaftarArsipAktifView } from './components/DaftarArsipAktifView';
import { LoginScreen } from './components/LoginScreen';
import { LoginLoadingOverlay } from './components/LoginLoadingOverlay';
import { Shield, Lock, LogIn } from 'lucide-react';
import { ActiveTab } from './types';

const MainContent: React.FC<{
  onOpenLogin: () => void;
}> = ({ onOpenLogin }) => {
  const { activeTab, currentUser } = useApp();

  // Jika belum login, tampilkan LoginScreen
  if (!currentUser) {
    return (
      <main className="w-full min-h-screen flex items-center justify-center p-4">
        <LoginScreen />
      </main>
    );
  }

  // Check if role has access to specific tab
  const tabNameMap: { [key: string]: string } = {
    dashboard: 'Dashboard',
    naskahMasuk: 'Naskah Masuk',
    naskahKeluar: 'Naskah Keluar',
    pemberkasan: 'Pemberkasan',
    masterData: 'Master Data',
    settings: 'Setting',
    settingUserRole: 'Setting - Role User',
    settingCounterThread: 'Setting - Penomoran Thread',
    settingSupabase: 'Setting - Supabase DB',
    settingResetTables: 'Setting - Reset Tabel',
    laporan: 'Laporan',
    rekapitulasi: 'Rekapitulasi',
    daftarArsipAktif: 'Daftar Arsip Aktif'
  };

  const currentTabLabel = tabNameMap[activeTab] || 'Dashboard';
  const userHakAkses = Array.isArray(currentUser.hakAkses)
    ? currentUser.hakAkses
    : ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Master Data', 'Laporan'];

  const isAdmin =
    currentUser.jenisUser === 'Admin' ||
    String(currentUser.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser.nama || '').toLowerCase().includes('admin');

  const isMasterOrSetting = activeTab.startsWith('master') || activeTab.startsWith('setting') || activeTab === 'masterData' || activeTab === 'settings';

  const hasAccess = isMasterOrSetting
    ? isAdmin
    : (isAdmin ||
        userHakAkses.includes(currentTabLabel) ||
        (activeTab === 'dashboard' && userHakAkses.includes('Dashboard')) ||
        (activeTab === 'pemberkasan' && (userHakAkses.includes('Pemberkasan') || userHakAkses.includes('Naskah Masuk') || userHakAkses.includes('Naskah Keluar'))) ||
        (activeTab === 'rekapitulasi' && userHakAkses.includes('Laporan')) ||
        (activeTab === 'daftarArsipAktif' && (userHakAkses.includes('Laporan') || userHakAkses.includes('Pemberkasan'))));

  const [visitedTabs, setVisitedTabs] = useState<Set<ActiveTab>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  return (
    <main className="w-full flex-1 px-3 sm:px-6 lg:px-8 py-6">
      {!hasAccess ? (
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-rose-200 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">
            Akses Terbatas untuk Role {currentUser?.jenisUser}
          </h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Akun Anda (<span className="font-bold">{currentUser?.nama}</span>) tidak memiliki izin akses untuk membuka menu <span className="font-bold text-slate-700">{currentTabLabel}</span>. Silakan login sebagai Admin atau periksa hak akses Anda.
          </p>
          <button
            onClick={onOpenLogin}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Ganti Akun Login</span>
          </button>
        </div>
      ) : (
        <div className="w-full">
          {visitedTabs.has('dashboard') && (
            <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
              <Dashboard />
            </div>
          )}
          {visitedTabs.has('naskahMasuk') && (
            <div className={activeTab === 'naskahMasuk' ? 'block' : 'hidden'}>
              <NaskahMasukForm />
            </div>
          )}
          {visitedTabs.has('naskahKeluar') && (
            <div className={activeTab === 'naskahKeluar' ? 'block' : 'hidden'}>
              <NaskahKeluarForm />
            </div>
          )}
          {visitedTabs.has('pemberkasan') && (
            <div className={activeTab === 'pemberkasan' ? 'block' : 'hidden'}>
              <PemberkasanView />
            </div>
          )}
          {(visitedTabs.has('masterData') || visitedTabs.has('masterJenisMasuk') || visitedTabs.has('masterJenisKeluar') || visitedTabs.has('masterUnitKerja') || visitedTabs.has('masterInstansi') || visitedTabs.has('masterSubKlasifikasi') || visitedTabs.has('masterKlasifikasiArsip') || visitedTabs.has('masterStatus')) && (
            <div className={activeTab.startsWith('master') ? 'block' : 'hidden'}>
              <MasterDataSettings />
            </div>
          )}
          {(visitedTabs.has('settings') || visitedTabs.has('settingUserRole') || visitedTabs.has('settingCounterThread') || visitedTabs.has('settingSupabase') || visitedTabs.has('settingResetTables')) && (
            <div className={activeTab.startsWith('setting') ? 'block' : 'hidden'}>
              <SettingsView />
            </div>
          )}
          {visitedTabs.has('laporan') && (
            <div className={activeTab === 'laporan' ? 'block' : 'hidden'}>
              <LaporanView />
            </div>
          )}
          {visitedTabs.has('rekapitulasi') && (
            <div className={activeTab === 'rekapitulasi' ? 'block' : 'hidden'}>
              <RekapitulasiView />
            </div>
          )}
          {visitedTabs.has('daftarArsipAktif') && (
            <div className={activeTab === 'daftarArsipAktif' ? 'block' : 'hidden'}>
              <DaftarArsipAktifView />
            </div>
          )}
        </div>
      )}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { currentUser, isLoginLoading, loginWelcomeName } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);

  // Sidebar Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('mgmt_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Fullscreen Mode State & Synchronization
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Gagal mengaktifkan mode fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Gagal keluar dari mode fullscreen:', err);
        });
      }
    }
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mgmt_sidebar_collapsed', String(next));
      return next;
    });
  };

  // If not logged in, render clean full-page login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-emerald-50/80 text-slate-800 flex flex-col justify-between">
        <ToastContainer />
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <LoginScreen />
        </div>
        <footer className="bg-emerald-950 text-emerald-300/80 py-4 text-center text-xs border-t border-emerald-900/50">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-white">MANAGEMENT SURAT • Powered by Riswan Anas</span>
            <span>Database Terhubung: Supabase Cloud DB</span>
          </div>
        </footer>
        <LoginLoadingOverlay
          isOpen={isLoginLoading}
          userName={loginWelcomeName}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-slate-100/90 text-slate-800 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      <ToastContainer />

      {/* Modern Left Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/80">
        {/* Top Header Bar */}
        <TopBar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* Scrollable Fullscreen Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <MainContent
            onOpenLogin={() => setIsLoginOpen(true)}
          />

          {/* Discreet Fullscreen Footer */}
          <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200/90 py-3.5 px-4 sm:px-6 text-xs text-slate-500 mt-auto shrink-0">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-900">MANAGEMENT SURAT</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-semibold">
                  Powered by Riswan Anas
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                <span>
                  Database: <strong className="text-blue-800">Supabase Cloud DB</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Mode Sidebar Fullscreen Aktif</span>
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Modals & Overlays */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <LoginLoadingOverlay
        isOpen={isLoginLoading}
        userName={loginWelcomeName}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
