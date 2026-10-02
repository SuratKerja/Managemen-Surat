import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pushToSupabase } from '../services/supabaseData';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Database,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  LogIn,
  ShieldAlert,
  RefreshCw,
  CloudUpload,
  DownloadCloud
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenGoogleSheetsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onOpenGoogleSheetsModal }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    logout,
    syncWithGoogleSheets,
    pullFromGoogleSheets,
    reloadAllData,
    googleSheetConfig,
    showToast,
    naskahMasukList,
    naskahKeluarList,
    berkasThreadList,
    users,
    unitKerjaList,
    klasifikasiArsipList,
    instansiWilayah,
    klasifikasiSub,
    jenisNaskahMasuk,
    jenisNaskahKeluar,
    statusPenyelesaian,
    statusKirim,
    threadNumberConfig
  } = useApp();
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSupabasePushing, setIsSupabasePushing] = useState(false);

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
    await syncWithGoogleSheets();
    setIsPushing(false);
  };

  const handleSyncSupabase = async () => {
    setIsSupabasePushing(true);
    showToast('Sedang memindahkan & menyelaraskan data ke Supabase PostgreSQL...', 'info');
    const res = await pushToSupabase({
      naskahMasuk: naskahMasukList,
      naskahKeluar: naskahKeluarList,
      berkasThreadList,
      users,
      unitKerjaList,
      klasifikasiArsipList,
      instansiWilayah,
      klasifikasiSub,
      jenisNaskahMasuk,
      jenisNaskahKeluar,
      statusPenyelesaian,
      statusKirim,
      threadNumberConfig
    });
    setIsSupabasePushing(false);
    if (res.success) {
      showToast('BERHASIL! Seluruh data dari aplikasi / Google Sheet telah tersimpan di Supabase!', 'success');
    } else {
      showToast(`Gagal menyimpan ke Supabase: ${res.errors.join(' | ')}`, 'error');
    }
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    hoverClass: string;
    dotColor: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      activeClass: 'bg-white text-emerald-950 border-t-4 border-emerald-500 shadow-lg font-extrabold',
      hoverClass: 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white',
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'naskahMasuk',
      label: 'Naskah Masuk',
      icon: <Inbox className="w-4 h-4" />,
      activeClass: 'bg-white text-teal-950 border-t-4 border-teal-500 shadow-lg font-extrabold',
      hoverClass: 'text-teal-100 hover:bg-teal-800/80 hover:text-white',
      dotColor: 'bg-teal-500'
    },
    {
      id: 'naskahKeluar',
      label: 'Naskah Keluar',
      icon: <Send className="w-4 h-4" />,
      activeClass: 'bg-white text-amber-950 border-t-4 border-amber-500 shadow-lg font-extrabold',
      hoverClass: 'text-amber-100 hover:bg-amber-800/80 hover:text-white',
      dotColor: 'bg-amber-500'
    },
    {
      id: 'masterData',
      label: 'Master Data',
      icon: <Database className="w-4 h-4" />,
      activeClass: 'bg-white text-indigo-950 border-t-4 border-indigo-500 shadow-lg font-extrabold',
      hoverClass: 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white',
      dotColor: 'bg-indigo-500',
      adminOnly: true
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      activeClass: 'bg-white text-violet-950 border-t-4 border-violet-500 shadow-lg font-extrabold',
      hoverClass: 'text-violet-100 hover:bg-violet-800/80 hover:text-white',
      dotColor: 'bg-violet-500'
    }
  ];

  return (
    <header className="bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 text-white shadow-2xl sticky top-0 z-40 border-b border-emerald-500/30 overflow-hidden relative">
      {/* 1. Efek Cahaya Berjalan di Garis Atas Header (Top Glowing Running Beam) */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-950/40 overflow-hidden z-20">
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-emerald-300 to-cyan-300 animate-running-light shadow-[0_0_15px_rgba(52,211,153,1)]" />
      </div>

      {/* 2. Efek Cahaya Berjalan di Garis Bawah Header (Bottom Glowing Running Beam) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-transparent overflow-hidden z-20 pointer-events-none">
        <div
          className="w-1/4 h-full bg-gradient-to-r from-transparent via-cyan-400 to-emerald-400 animate-running-light shadow-[0_0_12px_rgba(34,211,238,0.9)]"
          style={{ animationDelay: '1.7s' }}
        />
      </div>

      {/* 3. Efek Light Sweep (Seperti pada Form Login) & Cahaya Latar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-light-sweep" />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-12 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div
          className="absolute -bottom-12 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border border-emerald-300/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)] group">
              <Inbox className="w-6 h-6 text-white drop-shadow" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(103,232,249,1)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>MANAGEMENT SURAT</span>
              </h1>
              <p className="text-xs text-emerald-300/90 font-medium tracking-wide mt-0.5 flex items-center gap-1.5">
                <span>Powered by</span>
                <span className="font-bold text-white underline decoration-cyan-400">Riswan Anas</span>
              </p>
            </div>
          </div>

          {/* User & Google Sheet DB Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Button Reload DB dari Google Sheet (PULL SAJA - Tidak menimpa sheet) - Hanya Admin */}
            {isAdmin && (
              <button
                onClick={handlePullDB}
                disabled={isPulling}
                className="flex items-center gap-1.5 bg-teal-800/80 hover:bg-teal-700 text-teal-100 hover:text-white px-3 py-1.5 rounded-lg border border-teal-500/40 text-xs font-bold transition-all shadow hover:shadow-teal-500/20 hover:border-teal-400 disabled:opacity-60 backdrop-blur-sm"
                title="Tarik (Reload) perubahan data terbaru dari Google Sheet DB ke Aplikasi tanpa menimpa data di sheet (Hanya Admin)"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Menarik...' : 'Reload DB Sheet'}</span>
              </button>
            )}

            {/* Button Simpan ke Supabase PostgreSQL */}
            <button
              onClick={handleSyncSupabase}
              disabled={isSupabasePushing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg border border-blue-400/50 text-xs font-bold transition-all shadow-md shadow-blue-600/30 hover:shadow-blue-500/50 disabled:opacity-60"
              title="Salin dan simpan seluruh data aplikasi saat ini langsung ke database Supabase PostgreSQL"
            >
              <Database className={`w-3.5 h-3.5 ${isSupabasePushing ? 'animate-spin' : ''}`} />
              <span>{isSupabasePushing ? 'Menyimpan...' : '⚡ Simpan Supabase'}</span>
            </button>

            {/* Button Simpan ke Google Sheet (PUSH SAJA) */}
            <button
              onClick={handlePushDB}
              disabled={isPushing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-lg border border-emerald-400/50 text-xs font-bold transition-all shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/50 disabled:opacity-60"
              title={
                googleSheetConfig.webhookUrl
                  ? 'Kirim dan sinkronkan seluruh data aplikasi ke Google Sheet DB sekarang'
                  : 'Simpan data (Klik GoogleSheet DB untuk menghubungkan Webhook auto-sync)'
              }
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'Menyimpan...' : 'Simpan ke Sheet'}</span>
            </button>

            {/* Google Sheets Status badge - Hanya Admin */}
            {isAdmin && (
              <button
                onClick={onOpenGoogleSheetsModal}
                className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold transition-all shadow-sm backdrop-blur-sm"
                title="Pengaturan & Sinkronisasi Database Google Sheet (Hanya Admin)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>GoogleSheet DB</span>
                {googleSheetConfig.webhookUrl ? (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]"
                    title="Webhook Google Sheet Terpasang"
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)]"
                    title="Webhook Belum Dikonfigurasi"
                  />
                )}
              </button>
            )}

            {/* Current User Role badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs backdrop-blur-sm shadow-sm">
                <UserCheck className="w-4 h-4 text-cyan-300" />
                <div className="flex flex-col">
                  <span className="font-bold text-white leading-tight">{currentUser.nama}</span>
                  <span className="text-[11px] text-emerald-300/80 font-medium">
                    NIP: {currentUser.nip} • {currentUser.jenisUser}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 p-1.5 hover:bg-rose-600/80 text-emerald-300 hover:text-white rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Aplikasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Bar - shown only when logged in */}
        {currentUser && (
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      window.open(
                        window.location.href,
                        '_blank',
                        'width=1280,height=800,scrollbars=yes,resizable=yes,status=yes'
                      );
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={`${item.label} (Tekan CTRL + Klik untuk Buka Jendela Baru)`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap border-t-4 ${
                    isActive ? item.activeClass : item.hoverClass + ' border-t-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
