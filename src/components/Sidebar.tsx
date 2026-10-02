import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Database,
  FileSpreadsheet,
  BarChart3,
  UserCheck,
  LogOut,
  LogIn,
  RefreshCw,
  CloudUpload,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Table,
  Maximize2,
  Minimize2,
  X,
  FileText,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  FolderKanban,
  Archive,
  Settings,
  Users,
  Hash,
  Trash2,
  Building2,
  Tag,
  FolderOpen,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenLogin: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenLogin,
  isFullscreen,
  onToggleFullscreen
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    logout,
    syncWithGoogleSheets,
    reloadAllData,
    googleSheetConfig,
    naskahMasukList,
    naskahKeluarList,
    berkasThreadList,
    canAccessRecord
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
    await syncWithGoogleSheets();
    setIsPushing(false);
  };

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    laporan: true,
    settings: true,
    masterData: true
  });

  interface SubNavItemDef {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
  }

  interface NavItemDef {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
    badgeColor?: string;
    group: 'utama' | 'laporan' | 'pengaturan';
    adminOnly?: boolean;
    subItems?: SubNavItemDef[];
  }

  const filteredNaskahMasukCount = useMemo(() => {
    if (!naskahMasukList) return 0;
    if (isAdmin) return naskahMasukList.length;
    return naskahMasukList.filter((item) => canAccessRecord(item)).length;
  }, [naskahMasukList, isAdmin, canAccessRecord]);

  const filteredNaskahKeluarCount = useMemo(() => {
    if (!naskahKeluarList) return 0;
    if (isAdmin) return naskahKeluarList.length;
    return naskahKeluarList.filter((item) => canAccessRecord(item)).length;
  }, [naskahKeluarList, isAdmin, canAccessRecord]);

  const filteredBerkasThreadCount = useMemo(() => {
    if (!berkasThreadList) return 0;
    if (isAdmin) return berkasThreadList.length;
    return berkasThreadList.filter((item) => canAccessRecord(item)).length;
  }, [berkasThreadList, isAdmin, canAccessRecord]);

  const navItems: NavItemDef[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      group: 'utama'
    },
    {
      id: 'naskahMasuk',
      label: 'Naskah Masuk',
      icon: <Inbox className="w-5 h-5 shrink-0" />,
      count: filteredNaskahMasukCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      group: 'utama'
    },
    {
      id: 'naskahKeluar',
      label: 'Naskah Keluar',
      icon: <Send className="w-5 h-5 shrink-0" />,
      count: filteredNaskahKeluarCount,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      group: 'utama'
    },
    {
      id: 'pemberkasan',
      label: 'Pemberkasan',
      icon: <FolderKanban className="w-5 h-5 shrink-0" />,
      count: filteredBerkasThreadCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      group: 'utama'
    },
    {
      id: 'laporan',
      label: 'Laporan & Arsip',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
      group: 'laporan',
      subItems: [
        {
          id: 'rekapitulasi',
          label: 'Rekapitulasi Naskah',
          icon: <Table className="w-4 h-4 shrink-0" />
        },
        {
          id: 'laporan',
          label: 'Rincian Laporan',
          icon: <FileSpreadsheet className="w-4 h-4 shrink-0" />
        },
        {
          id: 'daftarArsipAktif',
          label: 'Daftar Arsip Aktif',
          icon: <Archive className="w-4 h-4 shrink-0" />
        }
      ]
    },
    {
      id: 'settings',
      label: 'Setting',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      group: 'pengaturan',
      adminOnly: true,
      subItems: [
        {
          id: 'settingUserRole',
          label: 'Pengaturan Role & User',
          icon: <Users className="w-4 h-4 shrink-0" />
        },
        {
          id: 'settingCounterThread',
          label: 'Penomoran Thread',
          icon: <Hash className="w-4 h-4 shrink-0" />
        },
        {
          id: 'settingSla',
          label: 'Aturan SLA (Hari Kerja)',
          icon: <Clock className="w-4 h-4 shrink-0" />
        },
        {
          id: 'settingSupabase',
          label: 'Supabase Cloud DB',
          icon: <Database className="w-4 h-4 shrink-0" />
        },
        {
          id: 'settingResetTables',
          label: 'Reset Data Per-Tabel',
          icon: <Trash2 className="w-4 h-4 shrink-0" />
        }
      ]
    },
    {
      id: 'masterData',
      label: 'Master Data',
      icon: <Database className="w-5 h-5 shrink-0" />,
      group: 'pengaturan',
      adminOnly: true,
      subItems: [
        {
          id: 'masterJenisMasuk',
          label: 'Jenis Naskah Masuk',
          icon: <FileText className="w-4 h-4 shrink-0 text-emerald-300" />
        },
        {
          id: 'masterJenisKeluar',
          label: 'Jenis Naskah Keluar',
          icon: <FileText className="w-4 h-4 shrink-0 text-teal-300" />
        },
        {
          id: 'masterUnitKerja',
          label: 'Unit Kerja Pengelola',
          icon: <Building2 className="w-4 h-4 shrink-0 text-cyan-300" />
        },
        {
          id: 'masterInstansi',
          label: 'Instansi & Wilayah',
          icon: <Building2 className="w-4 h-4 shrink-0 text-blue-300" />
        },
        {
          id: 'masterSubKlasifikasi',
          label: 'Sub-Klasifikasi Arsip',
          icon: <Tag className="w-4 h-4 shrink-0 text-amber-300" />
        },
        {
          id: 'masterKlasifikasiArsip',
          label: 'Kode Klasifikasi Arsip',
          icon: <FolderKanban className="w-4 h-4 shrink-0 text-orange-300" />
        },
        {
          id: 'masterStatus',
          label: 'Status Penyelesaian',
          icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-300" />
        }
      ]
    }
  ], [filteredNaskahMasukCount, filteredNaskahKeluarCount, filteredBerkasThreadCount]);

  const handleNavClick = useCallback((tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  }, [setActiveTab, isMobileOpen, onCloseMobile]);

  const renderNavGroup = (title: string, groupKey: 'utama' | 'laporan' | 'pengaturan') => {
    const items = navItems.filter((item) => item.group === groupKey && (!item.adminOnly || isAdmin));
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        {!isCollapsed ? (
          <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            {title}
          </div>
        ) : (
          <div className="w-8 h-px bg-emerald-900/60 mx-auto my-2" />
        )}
        <div className="space-y-1 px-2">
          {items.map((item) => {
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isSubChildActive = Boolean(item.subItems?.some((sub) => sub.id === activeTab));
            const isActive = activeTab === item.id || isSubChildActive;
            const isExpanded = expandedMenus[item.id] ?? true;

            // Item with submenus
            if (hasSub && item.subItems) {
              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        if (e.button === 0) {
                          handleNavClick(item.subItems![0].id);
                        }
                      }}
                      onClick={() => handleNavClick(item.subItems![0].id)}
                      className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-colors duration-75 cursor-pointer select-none ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <span className={isActive ? 'text-cyan-200' : 'text-emerald-400/80'}>
                        {item.icon}
                      </span>
                    </button>

                    {/* Flyout Submenu in Collapsed Rail Mode */}
                    <div className="absolute left-full top-0 ml-3 py-2 px-1.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-emerald-500/40 min-w-[220px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-opacity space-y-1">
                      <div className="px-3 py-1 font-bold text-emerald-300 text-[11px] uppercase tracking-wider border-b border-emerald-800/40 mb-1">
                        {item.label}
                      </div>
                      {item.subItems.map((sub) => {
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onPointerDown={(e) => {
                              if (e.button === 0) {
                                e.stopPropagation();
                                handleNavClick(sub.id);
                              }
                            }}
                            onClick={() => handleNavClick(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors duration-75 cursor-pointer select-none ${
                              isSubActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span className={isSubActive ? 'text-cyan-200' : 'text-emerald-400'}>
                              {sub.icon}
                            </span>
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Expanded parent with submenus
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      if (e.button === 0) {
                        setExpandedMenus((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }));
                        if (!isActive) {
                          handleNavClick(item.subItems![0].id);
                        }
                      }
                    }}
                    onClick={() => {
                      // Handled by onPointerDown for zero latency
                    }}
                    title={item.label}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-75 cursor-pointer select-none ${
                      isActive
                        ? 'bg-slate-800/90 text-white border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={isActive ? 'text-cyan-300' : 'text-emerald-400/80 group-hover:text-cyan-300'}>
                        {item.icon}
                      </span>
                      <span className="truncate font-bold">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400/80 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-emerald-300' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-5 pl-2.5 border-l-2 border-emerald-800/50 space-y-1 py-0.5">
                      {item.subItems.map((sub) => {
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onPointerDown={(e) => {
                              // Trigger tab change immediately on touch/pointer down for zero perceived latency
                              if (e.button === 0) {
                                e.stopPropagation();
                                handleNavClick(sub.id);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick(sub.id);
                            }}
                            className={`w-full group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-75 relative cursor-pointer select-none ${
                              isSubActive
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 font-bold border border-emerald-400/40'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                            }`}
                          >
                            {isSubActive && (
                              <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,1)]" />
                            )}
                            <span className={isSubActive ? 'text-cyan-200' : 'text-emerald-400/80 group-hover:text-cyan-300 shrink-0'}>
                              {sub.icon}
                            </span>
                            <span className="truncate text-left">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standard item without submenus
            return (
              <button
                key={item.id}
                type="button"
                onPointerDown={(e) => {
                  if (e.button === 0) {
                    handleNavClick(item.id);
                  }
                }}
                onClick={() => handleNavClick(item.id)}
                title={`${item.label}${item.count !== undefined ? ` (${item.count} data)` : ''}`}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-75 relative cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 font-bold border border-emerald-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,1)]" />
                )}

                <span
                  className={`${
                    isActive
                      ? 'text-cyan-200'
                      : 'text-emerald-400/80 group-hover:text-cyan-300 group-hover:scale-105 transition-transform'
                  }`}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md tabular-nums ${item.badgeColor}`}
                      >
                        {item.count}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-emerald-500/30 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity">
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="ml-2 px-1.5 py-0.5 bg-emerald-800 text-emerald-200 text-[10px] rounded font-mono">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-slate-200 select-none border-r border-emerald-900/40 shadow-2xl relative overflow-hidden">
      {/* Background Ambience & Glowing Running Light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Brand */}
      <div className="p-4 border-b border-emerald-900/50 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer group ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="relative w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border border-emerald-300/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
              <Inbox className="w-5 h-5 text-white drop-shadow" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(103,232,249,1)]" />
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-base font-extrabold tracking-tight text-white leading-tight truncate">
                  MANAGEMENT SURAT
                </h1>
                <p className="text-[11px] text-emerald-300/90 font-medium tracking-wide flex items-center gap-1">
                  <span>by</span>
                  <span className="font-bold text-white underline decoration-cyan-400">
                    Riswan Anas
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button (Inside header) */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg bg-slate-900/80 hover:bg-emerald-800/60 text-slate-400 hover:text-white border border-emerald-800/40 transition-colors"
              title="Perkecil Sidebar (Fullscreen Rail)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Expand Toggle Button */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center mt-3 pt-2 border-t border-emerald-900/50">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-800/60 text-emerald-300 hover:text-white border border-emerald-800/40 transition-all hover:scale-110"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto py-2 divide-y divide-emerald-900/30 custom-scrollbar relative z-10">
        {renderNavGroup('Menu Utama', 'utama')}
        {renderNavGroup('Laporan & Analisis', 'laporan')}
        {renderNavGroup('Pengaturan Sistem', 'pengaturan')}

        {/* Database & Cloud Synchronization Widget */}
        {!isCollapsed && (
          <div className="p-3 mx-2 my-2 rounded-2xl bg-slate-900/70 border border-emerald-800/40 backdrop-blur-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Supabase Cloud DB</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aktif</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={handlePushDB}
                disabled={isPushing}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm border border-blue-400/30 disabled:opacity-60 cursor-pointer"
                title="Simpan seluruh data ke Supabase Cloud Database"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Menyimpan' : 'Simpan DB'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handlePullDB}
                  disabled={isPulling}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-blue-900 text-blue-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-blue-700/40 disabled:opacity-60 cursor-pointer"
                  title="Tarik pembaruan data terbaru dari Supabase Cloud Database"
                >
                  <DownloadCloud className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Menarik' : 'Reload DB'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Profile, Fullscreen Toggle & System Footer */}
      <div className="p-3 border-t border-emerald-900/50 bg-slate-950/90 relative z-10 space-y-2">
        {/* Fullscreen Quick Mode Toggle Button */}
        <button
          onClick={onToggleFullscreen}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isFullscreen
              ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-900/90'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-emerald-900/40'
          } ${isCollapsed ? 'justify-center px-1' : ''}`}
          title={
            isFullscreen
              ? 'Keluar dari Mode Layar Penuh (ESC)'
              : 'Aktifkan Tampilan Layar Penuh (Fullscreen)'
          }
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-cyan-300 shrink-0" />
          ) : (
            <Maximize2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between text-left">
              <span>{isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh'}</span>
              <span className="text-[10px] text-slate-400 font-mono">F11</span>
            </div>
          )}
        </button>

        {/* User Card */}
        {currentUser ? (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-emerald-800/40 ${
              isCollapsed ? 'justify-center p-1' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm border border-emerald-400/30">
              {currentUser.nama?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate leading-snug">
                  {currentUser.nama}
                </div>
                <div className="text-[10px] text-emerald-300/80 truncate">
                  {currentUser.jenisUser} • {currentUser.unitKerja || currentUser.nip}
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="p-1.5 hover:bg-rose-600/80 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Keluar dari Akun (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className={`w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer ${
              isCollapsed ? 'justify-center px-1' : ''
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Login Akun</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Rail / Expanded */}
      <aside
        className={`hidden lg:block h-screen shrink-0 transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
