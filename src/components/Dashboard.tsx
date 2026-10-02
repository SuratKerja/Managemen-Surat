import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Inbox,
  CheckCircle2,
  Clock,
  Send,
  Archive,
  UserCheck,
  ShieldAlert,
  FileText,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Database,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  BarChart3,
  Layers,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  X,
  Search,
  FileSpreadsheet,
  Maximize2,
  Table,
  FolderCheck,
  FolderClock,
  FolderKanban
} from 'lucide-react';
import { WidgetDataTableModal } from './WidgetDataTableModal';


export const Dashboard: React.FC = () => {
  const {
    naskahMasukList,
    naskahKeluarList,
    currentUser,
    users,
    unitKerjaList,
    setActiveTab,
    reloadAllData,
    jenisNaskahMasuk,
    jenisNaskahKeluar,
    canAccessRecord,
    berkasThreadList
  } = useApp();

  const [isChartVisible, setIsChartVisible] = useState<boolean>(false);
  const [showLineMasuk, setShowLineMasuk] = useState<boolean>(true);
  const [showLineKeluar, setShowLineKeluar] = useState<boolean>(true);
  const [showLineTotal, setShowLineTotal] = useState<boolean>(true);
  const [chartViewMode, setChartViewMode] = useState<'jenis' | 'bulanan'>('jenis');

  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.jenisUser || '').toLowerCase() === 'pimpinan' ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  const userUnitKerja = currentUser?.unitKerja || 'Sekretariat Utama';

  // Khusus role admin: Menampilkan seluruh data di dashboard
  // Role user: Menampilkan data masing-masing unit kerja
  const activeUnitScope = isAdmin ? 'ALL' : userUnitKerja;

  const checkMatchUnit = (itemUnit?: string, itemCreatedBy?: string, itemCreatedByName?: string, targetUnit?: string) => {
    if (!targetUnit || targetUnit === 'ALL') return true;
    const target = targetUnit.trim().toLowerCase();

    // 1. Direct unitKerja on item
    const cleanItemUnit = String(itemUnit || '').trim().toLowerCase();
    if (cleanItemUnit) {
      if (cleanItemUnit === target || cleanItemUnit.includes(target) || target.includes(cleanItemUnit)) {
        return true;
      }
    }

    // 2. Lookup creator's unitKerja in users list
    if (itemCreatedBy || itemCreatedByName) {
      const creator = (users || []).find(
        (u) =>
          (itemCreatedBy && String(u.nip || '').trim().toLowerCase() === String(itemCreatedBy).trim().toLowerCase()) ||
          (itemCreatedByName && String(u.nama || '').trim().toLowerCase() === String(itemCreatedByName).trim().toLowerCase())
      );
      if (creator && creator.unitKerja) {
        const creatorUnit = String(creator.unitKerja).trim().toLowerCase();
        if (creatorUnit === target || creatorUnit.includes(target) || target.includes(creatorUnit)) {
          return true;
        }
      }
    }

    return false;
  };

  const [adminUnitFilter, setAdminUnitFilter] = useState<string>('ALL');

  const filteredMasuk = useMemo(() => {
    if (isAdmin) {
      if (adminUnitFilter !== 'ALL') {
        const target = adminUnitFilter.trim().toLowerCase();
        return naskahMasukList.filter((item) => {
          const u = String(item.unitKerja || '').trim().toLowerCase();
          return u === target || u.includes(target) || target.includes(u);
        });
      }
      return naskahMasukList;
    }
    return naskahMasukList.filter((item) => canAccessRecord(item));
  }, [naskahMasukList, isAdmin, adminUnitFilter, canAccessRecord]);

  const filteredKeluar = useMemo(() => {
    if (isAdmin) {
      if (adminUnitFilter !== 'ALL') {
        const target = adminUnitFilter.trim().toLowerCase();
        return naskahKeluarList.filter((item) => {
          const u = String(item.unitKerja || '').trim().toLowerCase();
          return u === target || u.includes(target) || target.includes(u);
        });
      }
      return naskahKeluarList;
    }
    return naskahKeluarList.filter((item) => canAccessRecord(item));
  }, [naskahKeluarList, isAdmin, adminUnitFilter, canAccessRecord]);

  // Active Scope Label for display
  const activeScopeLabel = isAdmin
    ? (adminUnitFilter === 'ALL' ? 'Seluruh Unit Kerja' : adminUnitFilter)
    : userUnitKerja;

  // Counts
  const countMasukTotal = filteredMasuk.length;
  const countMasukSelesai = filteredMasuk.filter((item) => {
    const s = String(item.statusPenyelesaian || '').toLowerCase().trim();
    return s.includes('selesai') && !s.includes('belum');
  }).length;
  const countMasukProses = filteredMasuk.filter((item) => {
    const s = String(item.statusPenyelesaian || '').toLowerCase().trim();
    return !s.includes('selesai') || s.includes('belum');
  }).length;

  const countKeluarTotal = filteredKeluar.length;
  const countKeluarTerkirim = filteredKeluar.filter((item) => {
    const s = String(item.statusPengiriman || '').toLowerCase().trim();
    const isZeroDate = !item.tglKirim || item.tglKirim === '0' || item.tglKirim === '0000-00-00' || String(item.tglKirim).trim() === '';
    return !isZeroDate && ((s.includes('terkirim') && !s.includes('belum')) || s.includes('diterima') || s.includes('selesai'));
  }).length;

  const countKeluarBelumTerkirim = filteredKeluar.filter((item) => {
    const s = String(item.statusPengiriman || '').toLowerCase().trim();
    const isZeroDate = !item.tglKirim || item.tglKirim === '0' || item.tglKirim === '0000-00-00' || String(item.tglKirim).trim() === '';
    return s.includes('belum') || isZeroDate || !s || s.includes('gagal');
  }).length;

  const countArsipTotal = countMasukTotal + countKeluarTotal;

  // Recent entries combined
  const recentEntries = [
    ...filteredMasuk.map((item) => ({
      id: item.id,
      nomorNaskah: item.nomorNaskah,
      perihal: item.perihal,
      tanggal: item.tglNaskah || item.tglTerima,
      instansi: item.instansiTerkait,
      unitKerja: item.unitKerja || 'Bagian Umum',
      jenis: 'Masuk' as const,
      status: item.statusPenyelesaian,
      author: item.createdByName
    })),
    ...filteredKeluar.map((item) => ({
      id: item.id,
      nomorNaskah: item.nomorNaskah,
      perihal: item.perihal,
      tanggal: item.tglNaskah,
      instansi: item.tujuanNaskah,
      unitKerja: item.unitKerja || 'Bagian Umum',
      jenis: 'Keluar' as const,
      status: item.statusPengiriman,
      author: item.createdByName
    }))
  ]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 6);

  // Detail Modal State for inspecting card records
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    type: 'masuk' | 'keluar' | 'all';
    items: any[];
    actionTab: 'naskahMasuk' | 'naskahKeluar' | 'laporan';
  } | null>(null);

  const [selectedCardTitle, setSelectedCardTitle] = useState<string | null>(null);


  const listMasukSelesai = useMemo(() => {
    return filteredMasuk.filter((item) => {
      const s = String(item.statusPenyelesaian || '').toLowerCase().trim();
      return s.includes('selesai') && !s.includes('belum');
    });
  }, [filteredMasuk]);

  const listMasukProses = useMemo(() => {
    return filteredMasuk.filter((item) => {
      const s = String(item.statusPenyelesaian || '').toLowerCase().trim();
      return !s.includes('selesai') || s.includes('belum');
    });
  }, [filteredMasuk]);

  const listKeluarTerkirim = useMemo(() => {
    return filteredKeluar.filter((item) => {
      const s = String(item.statusPengiriman || '').toLowerCase().trim();
      const isZeroDate = !item.tglKirim || item.tglKirim === '0' || item.tglKirim === '0000-00-00' || String(item.tglKirim).trim() === '';
      return !isZeroDate && ((s.includes('terkirim') && !s.includes('belum')) || s.includes('diterima') || s.includes('selesai'));
    });
  }, [filteredKeluar]);

  const listKeluarBelumTerkirim = useMemo(() => {
    return filteredKeluar.filter((item) => {
      const s = String(item.statusPengiriman || '').toLowerCase().trim();
      const isZeroDate = !item.tglKirim || item.tglKirim === '0' || item.tglKirim === '0000-00-00' || String(item.tglKirim).trim() === '';
      return s.includes('belum') || isZeroDate || !s || s.includes('gagal');
    });
  }, [filteredKeluar]);

  const listArsipTotal = useMemo(() => {
    return [
      ...filteredMasuk.map((m) => ({ ...m, _type: 'Masuk' })),
      ...filteredKeluar.map((k) => ({ ...k, _type: 'Keluar' }))
    ];
  }, [filteredMasuk, filteredKeluar]);

  // ID Naskah yang sudah terhubung dalam thread pemberkasan
  const allLinkedMasukIds = useMemo(() => {
    const ids = new Set<string>();
    (berkasThreadList || []).forEach((t) => {
      (t.naskahMasukIds || []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [berkasThreadList]);

  const allLinkedKeluarIds = useMemo(() => {
    const ids = new Set<string>();
    (berkasThreadList || []).forEach((t) => {
      (t.naskahKeluarIds || []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [berkasThreadList]);

  // H. Naskah Sudah Diberkaskan (Archived)
  const listNaskahArchived = useMemo(() => {
    const archivedMasuk = filteredMasuk
      .filter((m) => allLinkedMasukIds.has(m.id))
      .map((m) => ({ ...m, _type: 'Masuk', _arsipStatus: 'Archived' }));
    const archivedKeluar = filteredKeluar
      .filter((k) => allLinkedKeluarIds.has(k.id))
      .map((k) => ({ ...k, _type: 'Keluar', _arsipStatus: 'Archived' }));
    return [...archivedMasuk, ...archivedKeluar];
  }, [filteredMasuk, filteredKeluar, allLinkedMasukIds, allLinkedKeluarIds]);

  const countNaskahArchived = listNaskahArchived.length;

  // I. Naskah Belum Diberkaskan (Active)
  const listNaskahActived = useMemo(() => {
    const activeMasuk = filteredMasuk
      .filter((m) => !allLinkedMasukIds.has(m.id))
      .map((m) => ({ ...m, _type: 'Masuk', _arsipStatus: 'Active' }));
    const activeKeluar = filteredKeluar
      .filter((k) => !allLinkedKeluarIds.has(k.id))
      .map((k) => ({ ...k, _type: 'Keluar', _arsipStatus: 'Active' }));
    return [...activeMasuk, ...activeKeluar];
  }, [filteredMasuk, filteredKeluar, allLinkedMasukIds, allLinkedKeluarIds]);

  const countNaskahActived = listNaskahActived.length;

  // J. Jumlah Berkas (Global Thread)
  const listGlobalThread = useMemo(() => {
    return (berkasThreadList || []).map((t) => ({
      id: t.id,
      nomorNaskah: t.nomorThread,
      perihal: t.namaBerkas,
      jenisNaskah: t.klasifikasiBerkas || t.kodeKlasifikasi || 'Berkas Thread',
      unitKerja: t.unitKerja || '-',
      tglNaskah: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '-',
      statusPenyelesaian: t.status,
      pengirimNaskah: t.createdByName || '-',
      instansiTerkait: `${(t.naskahMasukIds || []).length} Masuk, ${(t.naskahKeluarIds || []).length} Keluar`,
      _type: 'Thread'
    }));
  }, [berkasThreadList]);

  const countGlobalThread = (berkasThreadList || []).length;

  // Cards summary (Termasuk Status Belum Terkirim & Pemberkasan)
  const cards = [
    {
      title: 'a. Jumlah Naskah Masuk',
      value: countMasukTotal,
      subtitle: isAdmin ? 'Total Seluruh Unit Kerja' : `Unit: ${userUnitKerja}`,
      icon: <Inbox className="w-5 h-5 text-white" />,
      badgeColor: 'bg-emerald-600 text-white border-emerald-400',
      gradient: 'from-emerald-700 via-emerald-600 to-teal-700',
      actionTab: 'naskahMasuk' as const,
      getItems: () => filteredMasuk,
      type: 'masuk' as const
    },
    {
      title: 'b. Naskah Masuk (Selesai)',
      value: countMasukSelesai,
      subtitle: isAdmin ? 'Selesai (Semua Unit)' : `Selesai (${userUnitKerja})`,
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      badgeColor: 'bg-teal-600 text-white border-teal-400',
      gradient: 'from-teal-600 via-emerald-600 to-emerald-700',
      actionTab: 'naskahMasuk' as const,
      getItems: () => listMasukSelesai,
      type: 'masuk' as const
    },
    {
      title: 'c. Naskah Masuk (Dalam Proses)',
      value: countMasukProses,
      subtitle: isAdmin ? 'Proses (Semua Unit)' : `Proses (${userUnitKerja})`,
      icon: <Clock className="w-5 h-5 text-white" />,
      badgeColor: 'bg-amber-600 text-white border-amber-400',
      gradient: 'from-amber-600 via-amber-500 to-emerald-700',
      actionTab: 'naskahMasuk' as const,
      getItems: () => listMasukProses,
      type: 'masuk' as const
    },
    {
      title: 'd. Jumlah Surat Keluar',
      value: countKeluarTotal,
      subtitle: isAdmin ? 'Total Seluruh Unit Kerja' : `Unit: ${userUnitKerja}`,
      icon: <Send className="w-5 h-5 text-white" />,
      badgeColor: 'bg-emerald-700 text-white border-emerald-500',
      gradient: 'from-emerald-800 via-teal-700 to-emerald-600',
      actionTab: 'naskahKeluar' as const,
      getItems: () => filteredKeluar,
      type: 'keluar' as const
    },
    {
      title: 'e. Status Terkirim',
      value: countKeluarTerkirim,
      subtitle: isAdmin ? 'Terkirim (Semua Unit)' : `Terkirim (${userUnitKerja})`,
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      badgeColor: 'bg-cyan-700 text-white border-cyan-400',
      gradient: 'from-cyan-600 via-teal-600 to-emerald-700',
      actionTab: 'naskahKeluar' as const,
      getItems: () => listKeluarTerkirim,
      type: 'keluar' as const
    },
    {
      title: 'f. Status Belum Terkirim',
      value: countKeluarBelumTerkirim,
      subtitle: isAdmin ? 'Belum Kirim (Semua Unit)' : `Belum Kirim (${userUnitKerja})`,
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      badgeColor: 'bg-rose-700 text-white border-rose-400',
      gradient: 'from-rose-600 via-amber-600 to-orange-700',
      actionTab: 'naskahKeluar' as const,
      getItems: () => listKeluarBelumTerkirim,
      type: 'keluar' as const
    },
    {
      title: 'g. Total Naskah',
      value: countArsipTotal,
      subtitle: isAdmin ? 'Total Masuk + Keluar (Semua Unit)' : `Total Masuk + Keluar (${userUnitKerja})`,
      icon: <Archive className="w-5 h-5 text-white" />,
      badgeColor: 'bg-emerald-900 text-emerald-200 border-emerald-400',
      gradient: 'from-emerald-900 via-emerald-800 to-slate-900',
      actionTab: 'laporan' as const,
      getItems: () => listArsipTotal,
      type: 'all' as const
    },
    {
      title: 'h. Naskah Sudah Diberkaskan',
      value: countNaskahArchived,
      subtitle: isAdmin ? 'Archived (Semua Unit)' : `Archived (${userUnitKerja})`,
      icon: <FolderCheck className="w-5 h-5 text-white" />,
      badgeColor: 'bg-emerald-600 text-white border-emerald-400',
      gradient: 'from-emerald-800 via-teal-700 to-green-900',
      actionTab: 'pemberkasan' as const,
      getItems: () => listNaskahArchived,
      type: 'all' as const
    },
    {
      title: 'i. Naskah Belum Diberkaskan',
      value: countNaskahActived,
      subtitle: isAdmin ? 'Active (Semua Unit)' : `Active (${userUnitKerja})`,
      icon: <FolderClock className="w-5 h-5 text-white" />,
      badgeColor: 'bg-amber-600 text-white border-amber-400',
      gradient: 'from-amber-600 via-orange-600 to-amber-800',
      actionTab: 'naskahMasuk' as const,
      getItems: () => listNaskahActived,
      type: 'all' as const
    },
    {
      title: 'j. Jumlah Berkas (Global Thread)',
      value: countGlobalThread,
      subtitle: 'Total Berkas Thread Global',
      icon: <FolderKanban className="w-5 h-5 text-white" />,
      badgeColor: 'bg-indigo-600 text-white border-indigo-400',
      gradient: 'from-indigo-900 via-purple-900 to-slate-950',
      actionTab: 'pemberkasan' as const,
      getItems: () => listGlobalThread,
      type: 'all' as const
    }
  ];

  const handleOpenDetailModal = (card: typeof cards[0]) => {
    setSelectedCardTitle(card.title);
    setDetailModal({
      isOpen: true,
      title: card.title,
      subtitle: card.subtitle,
      type: card.type,
      items: card.getItems(),
      actionTab: card.actionTab
    });
  };


  // --- Data preparation for Grafik Garis Jenis Naskah Dinas ---
  // Hanya gunakan Jenis Naskah Dinas yang terdaftar resmi pada Master Data
  const masterJenisList = Array.from(
    new Set([
      ...(jenisNaskahMasuk || []),
      ...(jenisNaskahKeluar || [])
    ])
  )
    .map((j) => (j || '').trim())
    .filter((j) => j.length > 0);

  const jenisChartData = masterJenisList.map((jenis) => {
    const jClean = jenis.toLowerCase();
    const masukCount = filteredMasuk.filter(
      (m) => String(m.jenisNaskah || '').trim().toLowerCase() === jClean
    ).length;
    const keluarCount = filteredKeluar.filter(
      (k) => String(k.jenisNaskah || '').trim().toLowerCase() === jClean
    ).length;
    return {
      name: jenis,
      'Naskah Masuk': masukCount,
      'Naskah Keluar': keluarCount,
      'Total Naskah': masukCount + keluarCount
    };
  }).sort((a, b) => b['Total Naskah'] - a['Total Naskah']);

  // Data tren bulanan untuk opsi tampilan garis waktu
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const bulananChartData = monthNames.map((mName, mIdx) => {
    const masukCount = filteredMasuk.filter((item) => {
      const d = item.tglNaskah || item.tglTerima;
      if (!d) return false;
      const month = new Date(d).getMonth();
      return month === mIdx;
    }).length;

    const keluarCount = filteredKeluar.filter((item) => {
      const d = item.tglNaskah || item.tglKirim;
      if (!d) return false;
      const month = new Date(d).getMonth();
      return month === mIdx;
    }).length;

    return {
      name: mName,
      'Naskah Masuk': masukCount,
      'Naskah Keluar': keluarCount,
      'Total Naskah': masukCount + keluarCount
    };
  });

  const activeChartData = chartViewMode === 'jenis' ? jenisChartData : bulananChartData;
  const topJenis = jenisChartData.length > 0 ? jenisChartData[0] : null;
  const totalJenisAktif = jenisChartData.filter((d) => d['Total Naskah'] > 0).length;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Chart Geometry Calculations
  const chartSvgData = useMemo(() => {
    if (!activeChartData || activeChartData.length === 0) return null;

    const width = 1000;
    const height = 360;
    const padding = {
      top: 30,
      right: 40,
      bottom: chartViewMode === 'jenis' ? 85 : 45,
      left: 55
    };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Find maximum value
    let maxVal = 1;
    activeChartData.forEach((d) => {
      if (showLineMasuk) maxVal = Math.max(maxVal, d['Naskah Masuk']);
      if (showLineKeluar) maxVal = Math.max(maxVal, d['Naskah Keluar']);
      if (showLineTotal) maxVal = Math.max(maxVal, d['Total Naskah']);
    });

    // Nice round upper ceiling for Y axis
    const niceCeil = (val: number) => {
      if (val <= 5) return 5;
      if (val <= 10) return 10;
      if (val <= 25) return 25;
      if (val <= 50) return 50;
      if (val <= 100) return 100;
      const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
      return Math.ceil(val / magnitude) * magnitude;
    };

    const yMax = niceCeil(maxVal);
    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

    const getX = (idx: number) => {
      if (activeChartData.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (idx / (activeChartData.length - 1)) * plotWidth;
    };

    const getY = (val: number) => {
      return padding.top + plotHeight - (val / yMax) * plotHeight;
    };

    // Calculate line points
    const pointsMasuk = activeChartData.map((d, i) => ({
      x: getX(i),
      y: getY(d['Naskah Masuk']),
      val: d['Naskah Masuk']
    }));

    const pointsKeluar = activeChartData.map((d, i) => ({
      x: getX(i),
      y: getY(d['Naskah Keluar']),
      val: d['Naskah Keluar']
    }));

    const pointsTotal = activeChartData.map((d, i) => ({
      x: getX(i),
      y: getY(d['Total Naskah']),
      val: d['Total Naskah']
    }));

    // Generate smooth or polyline path strings
    const createPathD = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      return pts.reduce((acc, pt, i, arr) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`;
        const prev = arr[i - 1];
        const cp1x = prev.x + (pt.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (pt.x - prev.x) / 2;
        const cp2y = pt.y;
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
      }, '');
    };

    const createAreaD = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      const lineD = createPathD(pts);
      const last = pts[pts.length - 1];
      const first = pts[0];
      const bottomY = padding.top + plotHeight;
      return `${lineD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    };

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      yMax,
      yTicks,
      getX,
      getY,
      pointsMasuk,
      pointsKeluar,
      pointsTotal,
      pathMasuk: createPathD(pointsMasuk),
      areaMasuk: createAreaD(pointsMasuk),
      pathKeluar: createPathD(pointsKeluar),
      areaKeluar: createAreaD(pointsKeluar),
      pathTotal: createPathD(pointsTotal),
      areaTotal: createAreaD(pointsTotal)
    };
  }, [activeChartData, showLineMasuk, showLineKeluar, showLineTotal, chartViewMode]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monitoring Naskah
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              Selamat Datang, <span className="font-bold text-white">{currentUser?.nama || 'User'}</span> ({currentUser?.jenisUser || (isAdmin ? 'Admin' : 'User')})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => reloadAllData()}
              className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold rounded-xl text-xs shadow-lg border border-emerald-400/40 transition-all flex items-center gap-2"
              title="Muat ulang data dari Google Sheet atau Database"
            >
              <RefreshCw className="w-4 h-4 text-cyan-300" />
              <span>Reload Data</span>
            </button>
            <button
              onClick={() => setActiveTab('naskahMasuk')}
              className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Inbox className="w-4 h-4 text-emerald-700" />
              <span>+ Input Naskah Masuk</span>
            </button>
            <button
              onClick={() => setActiveTab('naskahKeluar')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all border border-emerald-400/40 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>+ Input Naskah Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unit Kerja Scope & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Cakupan Monitoring Arsip' : 'Unit Kerja Aktif'}
            </div>
            <div className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
              <span>{activeScopeLabel}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
            <span className="text-xs font-bold text-emerald-900 whitespace-nowrap">Filter Unit Kerja:</span>
            <select
              value={adminUnitFilter}
              onChange={(e) => setAdminUnitFilter(e.target.value)}
              className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-lg py-1 px-3 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Semua Unit Kerja (Agregat)</option>
              {unitKerjaList.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {countArsipTotal === 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-white rounded-2xl">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">
                Statistik Unit Kerja Masih Kosong (0 Data)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Belum ada naskah masuk atau keluar yang terdata untuk Unit Kerja <span className="font-bold">{activeScopeLabel}</span>. Klik tombol <span className="font-bold">Reload Data</span> atau tambahkan naskah baru.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reloadAllData(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload & Muat Data Sample</span>
            </button>
          </div>
        </div>
      )}

      {/* Rekapitulasi Cards (Termasuk Status Belum Terkirim) */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card, idx) => {
            const isSelected = selectedCardTitle === card.title;
            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDetailModal(card)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenDetailModal(card);
                  }
                }}
                title="Klik untuk menampilkan seluruh informasi data dalam tabel"
                className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-3.5 sm:p-4 text-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border relative overflow-hidden group flex flex-col justify-between select-none ${
                  isSelected
                    ? 'ring-3 ring-emerald-300 border-white shadow-xl scale-[1.01]'
                    : 'border-white/10 hover:border-white/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100/90 block leading-tight line-clamp-2" title={card.title}>
                      {card.title}
                    </span>
                    <div className="p-1.5 sm:p-2 bg-white/15 rounded-xl backdrop-blur-xs border border-white/20 group-hover:scale-105 transition-transform shrink-0">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                    {card.value.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner informasi aktif saat kartu widget diklik */}
        {selectedCardTitle && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-lg border border-emerald-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Kartu Aktif: {selectedCardTitle}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                    Tabel Seluruh Informasi
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Klik tombol di samping untuk membuka kembali dialog tabel seluruh kolom informasi lengkap dan unduh data Excel.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetCard = cards.find((c) => c.title === selectedCardTitle);
                  if (targetCard) handleOpenDetailModal(targetCard);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all border border-emerald-400/30"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Buka Tabel Seluruh Informasi</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardTitle(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors"
                title="Tutup Status Pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* GRAFIK GARIS JENIS NASKAH DINAS */}
      <div className={`bg-white rounded-3xl shadow-xl border border-emerald-200 p-6 transition-all duration-300 ${isChartVisible ? 'space-y-6' : ''}`}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isChartVisible ? 'border-b border-slate-100 pb-5' : ''}`}>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Grafik Garis Jenis Naskah Dinas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi komparasi volume Naskah Masuk, Naskah Keluar, dan Total Naskah berdasarkan kategori Jenis Naskah Dinas
            </p>
          </div>

          {/* Mode Switch, Line Toggles, & Hide/Show Button */}
          <div className="flex flex-wrap items-center gap-3">
            {isChartVisible && (
              <>
                {/* View Switch Button */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('jenis')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      chartViewMode === 'jenis'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Per Jenis Naskah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('bulanan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      chartViewMode === 'bulanan'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tren Bulanan</span>
                  </button>
                </div>

                {/* Line Visibility Toggles */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowLineMasuk(!showLineMasuk)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      showLineMasuk
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                        : 'bg-transparent text-slate-400 opacity-60'
                    }`}
                    title="Tampilkan/Sembunyikan Garis Naskah Masuk"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                    <span>Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLineKeluar(!showLineKeluar)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      showLineKeluar
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
                        : 'bg-transparent text-slate-400 opacity-60'
                    }`}
                    title="Tampilkan/Sembunyikan Garis Naskah Keluar"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                    <span>Keluar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLineTotal(!showLineTotal)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      showLineTotal
                        ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-xs'
                        : 'bg-transparent text-slate-400 opacity-60'
                    }`}
                    title="Tampilkan/Sembunyikan Garis Total Naskah"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                    <span>Total</span>
                  </button>
                </div>
              </>
            )}

            {/* Tombol Hide / Show Grafik */}
            <button
              type="button"
              onClick={() => setIsChartVisible(!isChartVisible)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
                isChartVisible
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
              }`}
              title={isChartVisible ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
            >
              {isChartVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sembunyikan Grafik</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Tampilkan Grafik</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isChartVisible && (
          <>
            {/* Highlight Summary Info Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Jenis Terbanyak
                  </span>
                  <span className="text-sm font-extrabold text-emerald-950 truncate block mt-0.5">
                    {topJenis ? topJenis.name : '-'}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-200/80 px-2.5 py-1 rounded-lg">
                  {topJenis ? `${topJenis['Total Naskah']} Surat` : '0'}
                </span>
              </div>

              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    Kategori Naskah Terisi
                  </span>
                  <span className="text-sm font-extrabold text-teal-950 block mt-0.5">
                    {totalJenisAktif} dari {jenisChartData.length} Kategori
                  </span>
                </div>
                <span className="text-xs font-black text-teal-700 bg-teal-200/80 px-2.5 py-1 rounded-lg">
                  {Math.round((totalJenisAktif / (jenisChartData.length || 1)) * 100)}%
                </span>
              </div>

              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                    Total Arsip Naskah
                  </span>
                  <span className="text-sm font-extrabold text-purple-950 block mt-0.5">
                    {countArsipTotal} Naskah Terdaftar
                  </span>
                </div>
                <span className="text-xs font-black text-purple-700 bg-purple-200/80 px-2.5 py-1 rounded-lg">
                  {countMasukTotal} Masuk / {countKeluarTotal} Keluar
                </span>
              </div>
            </div>

            {/* Line Chart Area */}
            <div className="w-full relative select-none">
              {!chartSvgData || activeChartData.length === 0 ? (
                <div className="w-full h-80 flex flex-col items-center justify-center text-slate-400">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Belum ada data jenis naskah untuk ditampilkan.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Floating Tooltip if Hovered */}
                  {hoveredIndex !== null && activeChartData[hoveredIndex] && (
                    <div
                      className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
                      style={{
                        left: `${(chartSvgData.getX(hoveredIndex) / chartSvgData.width) * 100}%`,
                        top: `${(Math.min(
                          showLineMasuk ? chartSvgData.pointsMasuk[hoveredIndex].y : 999,
                          showLineKeluar ? chartSvgData.pointsKeluar[hoveredIndex].y : 999,
                          showLineTotal ? chartSvgData.pointsTotal[hoveredIndex].y : 999
                        ) / chartSvgData.height) * 100}%`
                      }}
                    >
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                        <div className="font-extrabold text-emerald-300 border-b border-slate-700/80 pb-1 text-center truncate">
                          {activeChartData[hoveredIndex].name}
                        </div>
                        {showLineMasuk && (
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Naskah Masuk:
                            </span>
                            <span className="font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                              {activeChartData[hoveredIndex]['Naskah Masuk'].toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        {showLineKeluar && (
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                              Naskah Keluar:
                            </span>
                            <span className="font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                              {activeChartData[hoveredIndex]['Naskah Keluar'].toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        {showLineTotal && (
                          <div className="flex items-center justify-between gap-3 text-slate-200 pt-1 border-t border-slate-800">
                            <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              Total Naskah:
                            </span>
                            <span className="font-black text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/60">
                              {activeChartData[hoveredIndex]['Total Naskah'].toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SVG Canvas */}
                  <svg
                    viewBox={`0 0 ${chartSvgData.width} ${chartSvgData.height}`}
                    className="w-full h-80 sm:h-96 overflow-visible"
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient id="masukGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="keluarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines & Y Axis labels */}
                    {chartSvgData.yTicks.map((val, idx) => {
                      const y = chartSvgData.getY(val);
                      return (
                        <g key={`ytick-${idx}`}>
                          <line
                            x1={chartSvgData.padding.left}
                            y1={y}
                            x2={chartSvgData.width - chartSvgData.padding.right}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={chartSvgData.padding.left - 12}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#64748b"
                            fontWeight="600"
                          >
                            {Math.round(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded Areas Under Lines */}
                    {showLineMasuk && (
                      <path d={chartSvgData.areaMasuk} fill="url(#masukGrad)" />
                    )}
                    {showLineKeluar && (
                      <path d={chartSvgData.areaKeluar} fill="url(#keluarGrad)" />
                    )}
                    {showLineTotal && (
                      <path d={chartSvgData.areaTotal} fill="url(#totalGrad)" />
                    )}

                    {/* Hover vertical crosshair indicator */}
                    {hoveredIndex !== null && (
                      <line
                        x1={chartSvgData.getX(hoveredIndex)}
                        y1={chartSvgData.padding.top}
                        x2={chartSvgData.getX(hoveredIndex)}
                        y2={chartSvgData.height - chartSvgData.padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Curve Lines */}
                    {showLineTotal && (
                      <path
                        d={chartSvgData.pathTotal}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="3.5"
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                      />
                    )}
                    {showLineKeluar && (
                      <path
                        d={chartSvgData.pathKeluar}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    )}
                    {showLineMasuk && (
                      <path
                        d={chartSvgData.pathMasuk}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Point Dots & Interactive Columns */}
                    {activeChartData.map((d, idx) => {
                      const isHovered = hoveredIndex === idx;
                      const pMasuk = chartSvgData.pointsMasuk[idx];
                      const pKeluar = chartSvgData.pointsKeluar[idx];
                      const pTotal = chartSvgData.pointsTotal[idx];
                      const x = chartSvgData.getX(idx);

                      return (
                        <g key={`points-${idx}`}>
                          {/* Dots on the lines */}
                          {showLineTotal && (
                            <circle
                              cx={pTotal.x}
                              cy={pTotal.y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? '#7e22ce' : '#ffffff'}
                              stroke="#9333ea"
                              strokeWidth={isHovered ? 3 : 2}
                              className="transition-all"
                            />
                          )}
                          {showLineKeluar && (
                            <circle
                              cx={pKeluar.x}
                              cy={pKeluar.y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? '#0369a1' : '#ffffff'}
                              stroke="#0284c7"
                              strokeWidth={isHovered ? 3 : 2}
                              className="transition-all"
                            />
                          )}
                          {showLineMasuk && (
                            <circle
                              cx={pMasuk.x}
                              cy={pMasuk.y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? '#047857' : '#ffffff'}
                              stroke="#059669"
                              strokeWidth={isHovered ? 3 : 2}
                              className="transition-all"
                            />
                          )}

                          {/* X Axis Label */}
                          <text
                            x={x}
                            y={chartSvgData.height - chartSvgData.padding.bottom + (chartViewMode === 'jenis' ? 18 : 22)}
                            textAnchor={chartViewMode === 'jenis' ? 'end' : 'middle'}
                            transform={
                              chartViewMode === 'jenis'
                                ? `rotate(-35, ${x}, ${chartSvgData.height - chartSvgData.padding.bottom + 18})`
                                : undefined
                            }
                            fontSize={chartViewMode === 'jenis' ? '10.5' : '12'}
                            fontWeight={isHovered ? '800' : '600'}
                            fill={isHovered ? '#047857' : '#475569'}
                            className="transition-colors pointer-events-none"
                          >
                            {d.name}
                          </text>

                          {/* Invisible full-height hover target slice */}
                          <rect
                            x={x - (chartSvgData.plotWidth / activeChartData.length) / 2}
                            y={chartSvgData.padding.top}
                            width={chartSvgData.plotWidth / activeChartData.length}
                            height={chartSvgData.plotHeight + 40}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onTouchStart={() => setHoveredIndex(idx)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Recent Records Table */}
      <div className="bg-gradient-to-b from-white via-white to-emerald-50/70 rounded-3xl shadow-xl border border-emerald-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/90 border-b border-emerald-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">
              Aktivitas Surat Terkini
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {recentEntries.length} naskah surat terbaru di sistem
            </p>
          </div>
          <button
            onClick={() => setActiveTab('laporan')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 shadow-sm hover:shadow transition-all"
          >
            Buka Menu Laporan Lengkap →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Nomor Naskah</th>
                <th className="py-3.5 px-4">Perihal</th>
                <th className="py-3.5 px-4">Unit Kerja</th>
                <th className="py-3.5 px-4">Instansi / Tujuan</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Penginput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Belum ada data naskah yang diinput untuk unit kerja ini.
                  </td>
                </tr>
              ) : (
                recentEntries.map((row, idx) => (
                  <tr key={`${row.id || 'recent'}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">
                      {row.jenis === 'Masuk' ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                          Masuk
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-bold">
                          Keluar
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{row.nomorNaskah}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">{row.perihal}</td>
                    <td className="py-3.5 px-4 text-emerald-800 font-semibold">{row.unitKerja}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{row.instansi}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{row.tanggal}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        (row.status || '').toLowerCase().includes('belum')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{row.author}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Detail Data Records Modal - Menampilkan Seluruh Kolom Informasi Tabel */}
      <WidgetDataTableModal
        isOpen={Boolean(detailModal && detailModal.isOpen)}
        onClose={() => setDetailModal(null)}
        title={detailModal?.title || ''}
        subtitle={detailModal?.subtitle || ''}
        type={detailModal?.type || 'all'}
        items={detailModal?.items || []}
        actionTab={detailModal?.actionTab || 'laporan'}
        onNavigateToTab={setActiveTab}
        unitKerjaList={unitKerjaList}
      />
    </div>
  );
};


