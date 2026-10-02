import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BerkasThread, NaskahMasukItem, NaskahKeluarItem } from '../types';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Layers,
  FileText,
  Inbox,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Printer,
  History,
  Tag,
  Building2,
  User,
  X,
  Save,
  MessageSquare,
  Settings,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Eye,
  Check,
  Paperclip,
  Maximize2,
  Minimize2,
  Table,
  CheckSquare,
  Square,
  ListChecks,
  ChevronLeft
} from 'lucide-react';

export const PemberkasanView: React.FC = () => {
  const {
    berkasThreadList,
    createBerkasThread,
    updateBerkasThread,
    deleteBerkasThread,
    linkNaskahToThread,
    unlinkNaskahFromThread,
    addThreadNote,
    getNextThreadNumber,
    threadNumberConfig,
    setThreadNumberConfig,
    klasifikasiArsipList,
    klasifikasiSub,
    unitKerjaList,
    naskahMasukList,
    naskahKeluarList,
    currentUser,
    showToast,
    setActiveTab
  } = useApp();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [klasifikasiFilter, setKlasifikasiFilter] = useState<string>('ALL');

  // View mode for thread list: 'table' (default compact table) | 'card' (card list) | 'expandedTable' (full width table)
  const [threadViewMode, setThreadViewMode] = useState<'table' | 'card' | 'expandedTable'>('table');
  const [threadSortBy, setThreadSortBy] = useState<'date_desc' | 'date_asc' | 'nomor_asc' | 'nomor_desc' | 'nama_asc' | 'status'>('date_desc');
  const [threadPage, setThreadPage] = useState<number>(1);
  const [threadPerPage, setThreadPerPage] = useState<number>(10);

  // Selected Thread for Detail View
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(() => {
    return berkasThreadList.length > 0 ? berkasThreadList[0].id : null;
  });

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<BerkasThread | null>(null);

  // Form Fields
  const [formNamaBerkas, setFormNamaBerkas] = useState('');
  const [formKlasifikasiBerkas, setFormKlasifikasiBerkas] = useState('');
  const [formKodeKlasifikasi, setFormKodeKlasifikasi] = useState('');
  const [formUnitKerja, setFormUnitKerja] = useState('');
  const [formLokasiFisik, setFormLokasiFisik] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup'>('Aktif');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formCustomNomor, setFormCustomNomor] = useState('');
  const [formSelectedMasukIds, setFormSelectedMasukIds] = useState<string[]>([]);
  const [formSelectedKeluarIds, setFormSelectedKeluarIds] = useState<string[]>([]);

  // Fullscreen state for form modal (default true as requested by user)
  const [isFormFullscreen, setIsFormFullscreen] = useState(true);

  // Tab state for selecting documents in form ('masuk' | 'keluar' | 'selected')
  const [formLinkTab, setFormLinkTab] = useState<'masuk' | 'keluar' | 'selected'>('masuk');
  const [formLinkSearchMasuk, setFormLinkSearchMasuk] = useState('');
  const [formLinkSearchKeluar, setFormLinkSearchKeluar] = useState('');
  const [formLinkFilterUnitMasuk, setFormLinkFilterUnitMasuk] = useState('ALL');
  const [formLinkFilterUnitKeluar, setFormLinkFilterUnitKeluar] = useState('ALL');
  const [formLinkPageMasuk, setFormLinkPageMasuk] = useState(1);
  const [formLinkPageKeluar, setFormLinkPageKeluar] = useState(1);
  const [formLinkPerPage, setFormLinkPerPage] = useState<number>(10);

  // Config modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configPrefix, setConfigPrefix] = useState(threadNumberConfig.prefix || 'TH');
  const [configFormat, setConfigFormat] = useState(threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]');
  const [configDigits, setConfigDigits] = useState(threadNumberConfig.counterDigits || 4);
  const [configCounter, setConfigCounter] = useState(threadNumberConfig.currentCounter || 1);
  const [configReset, setConfigReset] = useState(threadNumberConfig.resetPeriod || 'yearly');

  // Link naskah modal inside thread detail
  const [linkModalType, setLinkModalType] = useState<'none' | 'masuk' | 'keluar'>('none');
  const [linkSearchTerm, setLinkSearchTerm] = useState('');

  // New Note state in history
  const [newNoteInput, setNewNoteInput] = useState('');

  // Detail Sub-Tab
  const [detailTab, setDetailTab] = useState<'timeline' | 'history' | 'info'>('timeline');
  const [detailCorrespondenceViewMode, setDetailCorrespondenceViewMode] = useState<'table' | 'timeline'>('table');

  // Delete & Unlink confirmation modal states (in-app modal, safe from iframe window.confirm blocks)
  const [threadToDelete, setThreadToDelete] = useState<BerkasThread | null>(null);
  const [unlinkItemToConfirm, setUnlinkItemToConfirm] = useState<{
    threadId: string;
    type: 'masuk' | 'keluar';
    id: string;
    nomor: string;
  } | null>(null);

  // Preview next thread number
  const nextNomorPreview = useMemo(() => {
    return getNextThreadNumber(true);
  }, [threadNumberConfig, isFormOpen]);

  // Selected thread object
  const activeThread = useMemo(() => {
    return berkasThreadList.find((t) => t.id === selectedThreadId) || null;
  }, [berkasThreadList, selectedThreadId]);

  // Statistics
  const stats = useMemo(() => {
    const total = berkasThreadList.length;
    const proses = berkasThreadList.filter((t) => t.status === 'Proses' || t.status === 'Aktif').length;
    const selesai = berkasThreadList.filter((t) => t.status === 'Selesai').length;
    const totalLinkedMasuk = berkasThreadList.reduce((acc, t) => acc + (t.naskahMasukIds?.length || 0), 0);
    const totalLinkedKeluar = berkasThreadList.reduce((acc, t) => acc + (t.naskahKeluarIds?.length || 0), 0);
    return { total, proses, selesai, totalSurat: totalLinkedMasuk + totalLinkedKeluar };
  }, [berkasThreadList]);

  // Filtered threads
  const filteredThreads = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return berkasThreadList.filter((t) => {
      const matchSearch =
        !q ||
        t.nomorThread.toLowerCase().includes(q) ||
        t.namaBerkas.toLowerCase().includes(q) ||
        t.kodeKlasifikasi.toLowerCase().includes(q) ||
        (t.namaKlasifikasiArsip && t.namaKlasifikasiArsip.toLowerCase().includes(q)) ||
        t.klasifikasiBerkas.toLowerCase().includes(q) ||
        (t.keterangan && t.keterangan.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchKlas =
        klasifikasiFilter === 'ALL' ||
        t.klasifikasiBerkas === klasifikasiFilter ||
        t.kodeKlasifikasi === klasifikasiFilter;

      return matchSearch && matchStatus && matchKlas;
    });
  }, [berkasThreadList, searchTerm, statusFilter, klasifikasiFilter]);

  // Filtered and sorted threads
  const processedThreads = useMemo(() => {
    const list = [...filteredThreads];
    if (threadSortBy === 'date_desc') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (threadSortBy === 'date_asc') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (threadSortBy === 'nomor_asc') {
      list.sort((a, b) => a.nomorThread.localeCompare(b.nomorThread, undefined, { numeric: true }));
    } else if (threadSortBy === 'nomor_desc') {
      list.sort((a, b) => b.nomorThread.localeCompare(a.nomorThread, undefined, { numeric: true }));
    } else if (threadSortBy === 'nama_asc') {
      list.sort((a, b) => a.namaBerkas.localeCompare(b.namaBerkas));
    } else if (threadSortBy === 'status') {
      list.sort((a, b) => a.status.localeCompare(b.status));
    }
    return list;
  }, [filteredThreads, threadSortBy]);

  const paginatedThreads = useMemo(() => {
    if (threadPerPage === -1) return processedThreads;
    const start = (threadPage - 1) * threadPerPage;
    return processedThreads.slice(start, start + threadPerPage);
  }, [processedThreads, threadPage, threadPerPage]);

  const totalThreadPages = Math.ceil(processedThreads.length / (threadPerPage === -1 ? 1 : threadPerPage)) || 1;

  // Open Form for Create
  const handleOpenCreateForm = () => {
    setEditingThread(null);
    setFormNamaBerkas('');
    setFormKlasifikasiBerkas(klasifikasiSub.length > 0 ? klasifikasiSub[0].klasifikasiUtama : 'Umum & Kerjasama');
    setFormKodeKlasifikasi(klasifikasiArsipList.length > 0 ? klasifikasiArsipList[0].kodeKlasifikasi : 'KP.01.00');
    setFormUnitKerja(currentUser?.unitKerja || (unitKerjaList.length > 0 ? unitKerjaList[0] : 'Sekretariat Utama'));
    setFormLokasiFisik('');
    setFormStatus('Aktif');
    setFormKeterangan('');
    setFormCustomNomor('');
    setFormSelectedMasukIds([]);
    setFormSelectedKeluarIds([]);
    setIsFormFullscreen(true);
    setFormLinkTab('masuk');
    setFormLinkSearchMasuk('');
    setFormLinkSearchKeluar('');
    setFormLinkFilterUnitMasuk('ALL');
    setFormLinkFilterUnitKeluar('ALL');
    setFormLinkPageMasuk(1);
    setFormLinkPageKeluar(1);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditForm = (thread: BerkasThread) => {
    setEditingThread(thread);
    setFormNamaBerkas(thread.namaBerkas);
    setFormKlasifikasiBerkas(thread.klasifikasiBerkas);
    setFormKodeKlasifikasi(thread.kodeKlasifikasi);
    setFormUnitKerja(thread.unitKerja || '');
    setFormLokasiFisik(thread.lokasiFisik || '');
    setFormStatus(thread.status);
    setFormKeterangan(thread.keterangan || '');
    setFormCustomNomor(thread.nomorThread);
    setFormSelectedMasukIds([...thread.naskahMasukIds]);
    setFormSelectedKeluarIds([...thread.naskahKeluarIds]);
    setIsFormFullscreen(true);
    setFormLinkTab('masuk');
    setFormLinkSearchMasuk('');
    setFormLinkSearchKeluar('');
    setFormLinkFilterUnitMasuk('ALL');
    setFormLinkFilterUnitKeluar('ALL');
    setFormLinkPageMasuk(1);
    setFormLinkPageKeluar(1);
    setIsFormOpen(true);
  };

  // Filtered and paginated Naskah Masuk for form table selector
  const formFilteredMasuk = useMemo(() => {
    const q = formLinkSearchMasuk.toLowerCase().trim();
    return naskahMasukList.filter((m) => {
      const matchSearch =
        !q ||
        m.nomorNaskah.toLowerCase().includes(q) ||
        m.perihal.toLowerCase().includes(q) ||
        (m.pengirimNaskah && m.pengirimNaskah.toLowerCase().includes(q)) ||
        (m.instansiTerkait && m.instansiTerkait.toLowerCase().includes(q));

      const matchUnit =
        formLinkFilterUnitMasuk === 'ALL' || m.unitKerja === formLinkFilterUnitMasuk;

      return matchSearch && matchUnit;
    });
  }, [naskahMasukList, formLinkSearchMasuk, formLinkFilterUnitMasuk]);

  const formPaginatedMasuk = useMemo(() => {
    const start = (formLinkPageMasuk - 1) * formLinkPerPage;
    return formFilteredMasuk.slice(start, start + formLinkPerPage);
  }, [formFilteredMasuk, formLinkPageMasuk, formLinkPerPage]);

  const formTotalPagesMasuk = Math.ceil(formFilteredMasuk.length / formLinkPerPage) || 1;

  // Filtered and paginated Naskah Keluar for form table selector
  const formFilteredKeluar = useMemo(() => {
    const q = formLinkSearchKeluar.toLowerCase().trim();
    return naskahKeluarList.filter((k) => {
      const matchSearch =
        !q ||
        k.nomorNaskah.toLowerCase().includes(q) ||
        k.perihal.toLowerCase().includes(q) ||
        (k.tujuanNaskah && k.tujuanNaskah.toLowerCase().includes(q));

      const matchUnit =
        formLinkFilterUnitKeluar === 'ALL' || k.unitKerja === formLinkFilterUnitKeluar;

      return matchSearch && matchUnit;
    });
  }, [naskahKeluarList, formLinkSearchKeluar, formLinkFilterUnitKeluar]);

  const formPaginatedKeluar = useMemo(() => {
    const start = (formLinkPageKeluar - 1) * formLinkPerPage;
    return formFilteredKeluar.slice(start, start + formLinkPerPage);
  }, [formFilteredKeluar, formLinkPageKeluar, formLinkPerPage]);

  const formTotalPagesKeluar = Math.ceil(formFilteredKeluar.length / formLinkPerPage) || 1;

  const handleToggleSelectMasuk = (id: string) => {
    setFormSelectedMasukIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllDisplayedMasuk = () => {
    const displayedIds = formPaginatedMasuk.map((m) => m.id);
    const allSelected = displayedIds.length > 0 && displayedIds.every((id) => formSelectedMasukIds.includes(id));
    if (allSelected) {
      setFormSelectedMasukIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setFormSelectedMasukIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const handleToggleSelectKeluar = (id: string) => {
    setFormSelectedKeluarIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllDisplayedKeluar = () => {
    const displayedIds = formPaginatedKeluar.map((k) => k.id);
    const allSelected = displayedIds.length > 0 && displayedIds.every((id) => formSelectedKeluarIds.includes(id));
    if (allSelected) {
      setFormSelectedKeluarIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setFormSelectedKeluarIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const selectedMasukObjects = useMemo(() => {
    return naskahMasukList.filter((m) => formSelectedMasukIds.includes(m.id));
  }, [naskahMasukList, formSelectedMasukIds]);

  const selectedKeluarObjects = useMemo(() => {
    return naskahKeluarList.filter((k) => formSelectedKeluarIds.includes(k.id));
  }, [naskahKeluarList, formSelectedKeluarIds]);

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaBerkas.trim()) {
      showToast('Nama Berkas wajib diisi', 'error');
      return;
    }

    const selectedArsip = klasifikasiArsipList.find((k) => k.kodeKlasifikasi === formKodeKlasifikasi);
    const namaArsip = selectedArsip?.namaKlasifikasi;

    if (editingThread) {
      // Update
      updateBerkasThread(
        editingThread.id,
        {
          namaBerkas: formNamaBerkas.trim(),
          klasifikasiBerkas: formKlasifikasiBerkas,
          kodeKlasifikasi: formKodeKlasifikasi,
          namaKlasifikasiArsip: namaArsip,
          unitKerja: formUnitKerja,
          lokasiFisik: formLokasiFisik,
          status: formStatus,
          keterangan: formKeterangan,
          nomorThread: formCustomNomor.trim() || editingThread.nomorThread,
          naskahMasukIds: formSelectedMasukIds,
          naskahKeluarIds: formSelectedKeluarIds
        },
        'Memperbarui data dan metadata berkas thread'
      );
      setIsFormOpen(false);
    } else {
      // Create
      const newThread = createBerkasThread({
        namaBerkas: formNamaBerkas.trim(),
        klasifikasiBerkas: formKlasifikasiBerkas,
        kodeKlasifikasi: formKodeKlasifikasi,
        namaKlasifikasiArsip: namaArsip,
        unitKerja: formUnitKerja,
        lokasiFisik: formLokasiFisik,
        status: formStatus,
        keterangan: formKeterangan,
        customNomorThread: formCustomNomor.trim() || undefined,
        naskahMasukIds: formSelectedMasukIds,
        naskahKeluarIds: formSelectedKeluarIds
      });
      setSelectedThreadId(newThread.id);
      setIsFormOpen(false);
    }
  };

  // Handle Save Thread Number Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setThreadNumberConfig({
      prefix: configPrefix.trim() || 'TH',
      separator: '-',
      format: configFormat.trim() || '[PREFIX]-[YYYY]-[COUNTER]',
      counterDigits: Number(configDigits) || 4,
      currentCounter: Number(configCounter) || 1,
      resetPeriod: configReset as any,
      lastResetYear: new Date().getFullYear(),
      lastResetMonth: new Date().getMonth() + 1
    });
    setIsConfigOpen(false);
    showToast('Pengaturan Nomor Thread Otomatis berhasil disimpan!', 'success');
  };

  // Quick Status change from active thread header
  const handleQuickStatusChange = (newStatus: 'Aktif' | 'Proses' | 'Selesai' | 'Inaktif' | 'Ditutup') => {
    if (!activeThread) return;
    updateBerkasThread(activeThread.id, { status: newStatus });
  };

  // Add note to history
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newNoteInput.trim()) return;
    addThreadNote(activeThread.id, newNoteInput.trim());
    setNewNoteInput('');
  };

  // Letters chronological thread (combine linked masuk & keluar)
  const threadLetters = useMemo(() => {
    if (!activeThread) return [];

    const items: Array<{
      type: 'masuk' | 'keluar';
      date: string;
      rawDate: string;
      data: NaskahMasukItem | NaskahKeluarItem;
    }> = [];

    // Linked Masuk
    activeThread.naskahMasukIds.forEach((id) => {
      const found = naskahMasukList.find((m) => m.id === id);
      if (found) {
        items.push({
          type: 'masuk',
          date: found.tglNaskah || found.tglTerima || '1970-01-01',
          rawDate: found.tglTerima || found.tglNaskah,
          data: found
        });
      }
    });

    // Linked Keluar
    activeThread.naskahKeluarIds.forEach((id) => {
      const found = naskahKeluarList.find((k) => k.id === id);
      if (found) {
        items.push({
          type: 'keluar',
          date: found.tglNaskah || found.tglKirim || '1970-01-01',
          rawDate: found.tglKirim || found.tglNaskah,
          data: found
        });
      }
    });

    // Sort chronologically ascending
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeThread, naskahMasukList, naskahKeluarList]);

  // Unlinked Masuk for linking modal
  const availableMasukToLink = useMemo(() => {
    if (!activeThread) return [];
    const q = linkSearchTerm.toLowerCase().trim();
    return naskahMasukList
      .filter((m) => !activeThread.naskahMasukIds.includes(m.id))
      .filter((m) => {
        if (!q) return true;
        return (
          m.nomorNaskah.toLowerCase().includes(q) ||
          m.perihal.toLowerCase().includes(q) ||
          m.pengirimNaskah.toLowerCase().includes(q)
        );
      });
  }, [activeThread, naskahMasukList, linkSearchTerm]);

  // Unlinked Keluar for linking modal
  const availableKeluarToLink = useMemo(() => {
    if (!activeThread) return [];
    const q = linkSearchTerm.toLowerCase().trim();
    return naskahKeluarList
      .filter((k) => !activeThread.naskahKeluarIds.includes(k.id))
      .filter((k) => {
        if (!q) return true;
        return (
          k.nomorNaskah.toLowerCase().includes(q) ||
          k.perihal.toLowerCase().includes(q) ||
          k.tujuanNaskah.toLowerCase().includes(q)
        );
      });
  }, [activeThread, naskahKeluarList, linkSearchTerm]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pemberkasan (Thread Surat Terpadu)
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black rounded-2xl text-xs shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Buat Berkas Thread Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setConfigPrefix(threadNumberConfig.prefix || 'TH');
                setConfigFormat(threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]');
                setConfigDigits(threadNumberConfig.counterDigits || 4);
                setConfigCounter(threadNumberConfig.currentCounter || 1);
                setConfigReset(threadNumberConfig.resetPeriod || 'yearly');
                setIsConfigOpen(true);
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs shadow-sm transition-all border border-white/20 flex items-center gap-2"
              title="Pengaturan Nomor Thread Otomatis"
            >
              <Settings className="w-4 h-4 text-emerald-300" />
              <span>Format Nomor Otomatis</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/40">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200 block font-semibold">Total Berkas (Thread)</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.total} Berkas</span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-[11px] text-amber-200 block font-semibold">Sedang Proses / Aktif</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{stats.proses} Berkas</span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-300 block font-semibold">Berkas Selesai</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">{stats.selesai} Selesai</span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-[11px] text-teal-200 block font-semibold">Total Surat Terhubung</span>
            <span className="text-xl sm:text-2xl font-black text-teal-300">{stats.totalSurat} Surat</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Left (Thread List / Table), Right (Thread Case Detail Tracker) */}
      <div className={`grid grid-cols-1 ${threadViewMode === 'expandedTable' ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6 items-start`}>
        {/* LEFT COLUMN: LIST / TABLE OF THREADS & FILTER */}
        <div className={`${threadViewMode === 'expandedTable' ? 'lg:col-span-12' : 'lg:col-span-5 xl:col-span-5'} space-y-4`}>
          {/* Search, Filter & View Mode Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            {/* Top row: Search and View Mode Switcher */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setThreadPage(1);
                  }}
                  placeholder="Cari Nomor Thread, Nama Berkas, Kode Klasifikasi..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setThreadPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Switcher: Tabel (Sidebar) / Tabel Lebar / Kartu */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setThreadViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    threadViewMode === 'table'
                      ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Kompak (Sidebar)"
                >
                  <Table className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tabel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThreadViewMode('expandedTable')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    threadViewMode === 'expandedTable'
                      ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Lengkap (Layar Penuh)"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
                  <span className="hidden sm:inline">Tabel Lebar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThreadViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    threadViewMode === 'card'
                      ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu Berkas"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  <span>Kartu</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Filters, Sorting, and Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setThreadPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="Aktif">Status: Aktif</option>
                <option value="Proses">Status: Proses</option>
                <option value="Selesai">Status: Selesai</option>
                <option value="Inaktif">Status: Inaktif</option>
                <option value="Ditutup">Status: Ditutup</option>
              </select>

              <select
                value={klasifikasiFilter}
                onChange={(e) => {
                  setKlasifikasiFilter(e.target.value);
                  setThreadPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none truncate"
              >
                <option value="ALL">Semua Klasifikasi</option>
                {klasifikasiArsipList.map((ka) => (
                  <option key={ka.id} value={ka.kodeKlasifikasi}>
                    {ka.kodeKlasifikasi} - {ka.namaKlasifikasi}
                  </option>
                ))}
              </select>

              <select
                value={threadSortBy}
                onChange={(e) => {
                  setThreadSortBy(e.target.value as any);
                  setThreadPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="date_desc">Urutkan: Tanggal Terbaru</option>
                <option value="date_asc">Urutkan: Tanggal Terlama</option>
                <option value="nomor_asc">Urutkan: No. Thread (A-Z)</option>
                <option value="nomor_desc">Urutkan: No. Thread (Z-A)</option>
                <option value="nama_asc">Urutkan: Nama Berkas (A-Z)</option>
                <option value="status">Urutkan: Status Berkas</option>
              </select>
            </div>
          </div>

          {/* VIEW 1: TABEL KOMPAK (DEFAULT - MEMUDAHKAN MEMBACA BANYAK BERKAS) */}
          {threadViewMode === 'table' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[640px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-36">No. Thread & Status</th>
                      <th className="p-3">Nama Berkas (Thread)</th>
                      <th className="p-3 text-center w-24">Naskah</th>
                      <th className="p-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedThreads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600">Tidak ada berkas yang cocok</p>
                          <p className="text-[11px] text-slate-400 mt-1">Ubah kata kunci filter pencarian.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedThreads.map((thread, idx) => {
                        const isSelected = selectedThreadId === thread.id;
                        const statusColor =
                          thread.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : thread.status === 'Proses'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : thread.status === 'Aktif'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300';

                        return (
                          <tr
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/90 font-medium border-l-4 border-l-emerald-600 shadow-2xs'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                              {(threadPage - 1) * (threadPerPage === -1 ? 0 : threadPerPage) + idx + 1}
                            </td>

                            <td className="p-3">
                              <span className="font-mono font-black text-emerald-950 block text-[11px]">
                                {thread.nomorThread}
                              </span>
                              <span className={`inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {thread.status}
                              </span>
                            </td>

                            <td className="p-3">
                              <h4 className="font-bold text-slate-900 line-clamp-1 text-xs" title={thread.namaBerkas}>
                                {thread.namaBerkas}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
                                  {thread.kodeKlasifikasi}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                  {thread.klasifikasiBerkas}
                                </span>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-0.5"
                                  title={`${thread.naskahMasukIds.length} Naskah Masuk`}
                                >
                                  <Inbox className="w-2.5 h-2.5" />
                                  <span>{thread.naskahMasukIds.length}</span>
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold inline-flex items-center gap-0.5"
                                  title={`${thread.naskahKeluarIds.length} Naskah Keluar`}
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>{thread.naskahKeluarIds.length}</span>
                                </span>
                              </div>
                            </td>

                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedThreadId(thread.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-700 text-white'
                                      : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title="Lihat Detail Thread"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setThreadToDelete(thread)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Thread"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>
                    Menampilkan <strong className="text-slate-800">{paginatedThreads.length}</strong> dari <strong className="text-slate-800">{processedThreads.length}</strong> berkas
                  </span>
                  <span>•</span>
                  <label className="flex items-center gap-1">
                    <span>Per hal:</span>
                    <select
                      value={threadPerPage}
                      onChange={(e) => {
                        setThreadPerPage(Number(e.target.value));
                        setThreadPage(1);
                      }}
                      className="px-2 py-0.5 rounded border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={-1}>Semua</option>
                    </select>
                  </label>
                </div>

                {threadPerPage !== -1 && totalThreadPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={threadPage <= 1}
                      onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 inline" />
                    </button>
                    <span className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                      {threadPage} / {totalThreadPages}
                    </span>
                    <button
                      type="button"
                      disabled={threadPage >= totalThreadPages}
                      onClick={() => setThreadPage((p) => Math.min(totalThreadPages, p + 1))}
                      className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 inline" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: TABEL LEBAR (EXPANDED FULL-WIDTH MASTER TABLE) */}
          {threadViewMode === 'expandedTable' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
              <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-300" />
                  <h3 className="text-sm font-extrabold text-white">Tabel Master Seluruh Berkas Thread Arsip</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                    {processedThreads.length} Berkas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setThreadViewMode('table')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Tutup Mode Lebar</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[640px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-36">Nomor Thread</th>
                      <th className="p-3 w-28 text-center">Status</th>
                      <th className="p-3">Nama Berkas (Thread)</th>
                      <th className="p-3">Kode & Klasifikasi Arsip</th>
                      <th className="p-3">Unit Kerja Pengelola</th>
                      <th className="p-3 text-center">Surat Masuk</th>
                      <th className="p-3 text-center">Surat Keluar</th>
                      <th className="p-3 text-center">Tgl Dibuat</th>
                      <th className="p-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedThreads.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-slate-400">
                          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-600">Tidak ada data berkas thread</p>
                          <p className="text-xs text-slate-400 mt-1">Ubah kata kunci filter pencarian atau buat berkas thread baru.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedThreads.map((thread, idx) => {
                        const isSelected = selectedThreadId === thread.id;
                        const statusColor =
                          thread.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : thread.status === 'Proses'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : thread.status === 'Aktif'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300';

                        return (
                          <tr
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/90 font-medium border-l-4 border-l-emerald-600 shadow-2xs'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                              {(threadPage - 1) * (threadPerPage === -1 ? 0 : threadPerPage) + idx + 1}
                            </td>

                            <td className="p-3 font-mono font-black text-emerald-950 text-xs">
                              {thread.nomorThread}
                            </td>

                            <td className="p-3 text-center">
                              <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                                {thread.status}
                              </span>
                            </td>

                            <td className="p-3">
                              <h4 className="font-bold text-slate-900 text-xs line-clamp-2" title={thread.namaBerkas}>
                                {thread.namaBerkas}
                              </h4>
                              {thread.lokasiFisik && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Lokasi: {thread.lokasiFisik}
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold inline-block mr-1">
                                {thread.kodeKlasifikasi}
                              </span>
                              <span className="text-[11px] text-slate-600 font-medium">
                                {thread.klasifikasiBerkas}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="text-xs text-slate-700 font-semibold">
                                {thread.unitKerja || '-'}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-[11px] inline-flex items-center gap-1">
                                <Inbox className="w-3 h-3 text-emerald-700" />
                                <span>{thread.naskahMasukIds.length}</span>
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 font-extrabold text-[11px] inline-flex items-center gap-1">
                                <Send className="w-3 h-3 text-sky-700" />
                                <span>{thread.naskahKeluarIds.length}</span>
                              </span>
                            </td>

                            <td className="p-3 text-center text-slate-500 text-[11px]">
                              {new Date(thread.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>

                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedThreadId(thread.id);
                                    setThreadViewMode('table');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  title="Buka Tracker Thread Ini"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  <span>Buka</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setThreadToDelete(thread)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Thread"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Expanded Table Pagination Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>
                    Menampilkan <strong className="text-slate-900">{paginatedThreads.length}</strong> dari <strong className="text-slate-900">{processedThreads.length}</strong> berkas thread
                  </span>
                  <span>•</span>
                  <label className="flex items-center gap-1">
                    <span>Jumlah per halaman:</span>
                    <select
                      value={threadPerPage}
                      onChange={(e) => {
                        setThreadPerPage(Number(e.target.value));
                        setThreadPage(1);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={10}>10 data</option>
                      <option value={20}>20 data</option>
                      <option value={50}>50 data</option>
                      <option value={-1}>Tampilkan Semua</option>
                    </select>
                  </label>
                </div>

                {threadPerPage !== -1 && totalThreadPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={threadPage <= 1}
                      onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                      Halaman {threadPage} dari {totalThreadPages}
                    </span>
                    <button
                      type="button"
                      disabled={threadPage >= totalThreadPages}
                      onClick={() => setThreadPage((p) => Math.min(totalThreadPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: KARTU (FALLBACK CARD LIST VIEW) */}
          {threadViewMode === 'card' && (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {paginatedThreads.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Tidak ada berkas yang cocok</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ubah kata kunci filter atau klik tombol <strong>+ Buat Berkas Thread Baru</strong> di atas.
                  </p>
                </div>
              ) : (
                paginatedThreads.map((thread) => {
                  const isSelected = selectedThreadId === thread.id;
                  const statusColor =
                    thread.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : thread.status === 'Proses'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : thread.status === 'Aktif'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300';

                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-800 text-white shadow-2xs">
                            {thread.nomorThread}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {thread.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(thread.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2 mb-2">
                        {thread.namaBerkas}
                      </h4>

                      {/* Metadata tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                          {thread.kodeKlasifikasi}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium truncate max-w-[160px]">
                          {thread.klasifikasiBerkas}
                        </span>
                      </div>

                      {/* Footer letters counter & action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Inbox className="w-3 h-3" />
                            {thread.naskahMasukIds.length} Masuk
                          </span>
                          <span className="flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            <Send className="w-3 h-3" />
                            {thread.naskahKeluarIds.length} Keluar
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setThreadToDelete(thread);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs">
                            <span>Buka Thread</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL CASE THREAD TRACKER */}
        <div className={`${threadViewMode === 'expandedTable' ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-7'}`}>
          {activeThread ? (
            <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
              {/* Header Details */}
              <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black font-mono px-3 py-1 bg-emerald-500 text-emerald-950 rounded-xl shadow-xs">
                      {activeThread.nomorThread}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                        activeThread.status === 'Selesai'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : activeThread.status === 'Proses'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      Status: {activeThread.status}
                    </span>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(activeThread)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                      title="Edit Data Berkas"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Edit Berkas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThreadToDelete(activeThread)}
                      className="px-2.5 py-1.5 bg-rose-500/25 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/40 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="Hapus Berkas Thread Ini"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                {/* Berkas Title */}
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                    {activeThread.namaBerkas}
                  </h3>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-medium">Kode Klasifikasi</span>
                    <span className="font-bold text-emerald-300">{activeThread.kodeKlasifikasi}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-medium">Klasifikasi Berkas</span>
                    <span className="font-bold text-white truncate block" title={activeThread.klasifikasiBerkas}>
                      {activeThread.klasifikasiBerkas}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-medium">Unit Pengelola</span>
                    <span className="font-bold text-white truncate block">{activeThread.unitKerja || '-'}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-medium">Dibuat Oleh</span>
                    <span className="font-bold text-white truncate block">{activeThread.createdByName}</span>
                  </div>
                </div>

                {/* Quick Status Setter */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-slate-300 font-semibold mr-1">Ubah Status Cepat:</span>
                  {(['Aktif', 'Proses', 'Selesai', 'Ditutup'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleQuickStatusChange(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeThread.status === st
                          ? 'bg-emerald-500 text-emerald-950 font-black shadow-xs'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub Navigation Bar inside Detail */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab('timeline')}
                    className={`flex items-center gap-2 px-4 py-2.5 font-black text-xs border-b-2 transition-all ${
                      detailTab === 'timeline'
                        ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span>Thread Surat (Masuk & Keluar)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {threadLetters.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('history')}
                    className={`flex items-center gap-2 px-4 py-2.5 font-black text-xs border-b-2 transition-all ${
                      detailTab === 'history'
                        ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Riwayat Tracking & Log</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {activeThread.history.length}
                    </span>
                  </button>
                </div>

                {/* Add Letters Quick Shortcuts & View Switcher */}
                {detailTab === 'timeline' && (
                  <div className="flex flex-wrap items-center gap-2 pb-2">
                    {/* View Switcher: Tabel vs Timeline */}
                    <div className="flex items-center gap-0.5 bg-slate-200/90 p-0.5 rounded-xl border border-slate-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setDetailCorrespondenceViewMode('table')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          detailCorrespondenceViewMode === 'table'
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                        title="Tampilkan Dalam Bentuk Tabel Data"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Tabel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailCorrespondenceViewMode('timeline')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          detailCorrespondenceViewMode === 'timeline'
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                        title="Tampilkan Dalam Bentuk Timeline Alur"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLinkSearchTerm('');
                        setLinkModalType('masuk');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Inbox className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Tautkan Masuk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLinkSearchTerm('');
                        setLinkModalType('keluar');
                      }}
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-700" />
                      <span>+ Tautkan Keluar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: THREAD CORRESPONDENCE TIMELINE / TABLE (ALUR SURAT) */}
              {detailTab === 'timeline' && (
                <div className="p-6 space-y-6">
                  {threadLetters.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-700">Belum ada naskah di dalam thread ini</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Tautkan Naskah Masuk dan Naskah Keluar jawaban/tindak lanjut untuk melacak alur surat secara kronologis.
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setLinkModalType('masuk')}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Inbox className="w-4 h-4" />
                          <span>Tautkan Naskah Masuk</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkModalType('keluar')}
                          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Tautkan Naskah Keluar</span>
                        </button>
                      </div>
                    </div>
                  ) : detailCorrespondenceViewMode === 'table' ? (
                    /* VIEW MODE A: TABEL NASKAH MASUK & KELUAR TERPADU */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Table className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold text-slate-800">
                            Tabel Naskah Tertaut dalam Berkas ({threadLetters.length} Dokumen)
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Status Seluruh File Tertaut:{' '}
                          <strong className="text-emerald-700 font-bold">Archived</strong>
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="p-3 w-10 text-center">No</th>
                              <th className="p-3 w-28 text-center">Status Arsip</th>
                              <th className="p-3">No. Naskah & Tipe</th>
                              <th className="p-3">Tanggal Surat</th>
                              <th className="p-3">Perihal Naskah</th>
                              <th className="p-3">Asal / Tujuan & Instansi</th>
                              <th className="p-3 text-center">Status Surat</th>
                              <th className="p-3 text-center">Dokumen Link</th>
                              <th className="p-3 text-center w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {threadLetters.map((item, idx) => {
                              const isMasuk = item.type === 'masuk';
                              const dataMasuk = isMasuk ? (item.data as NaskahMasukItem) : null;
                              const dataKeluar = !isMasuk ? (item.data as NaskahKeluarItem) : null;

                              return (
                                <tr key={`${item.type}-${item.data.id}`} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                                    {idx + 1}
                                  </td>

                                  <td className="p-3 text-center whitespace-nowrap">
                                    <span
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shadow-2xs"
                                      title="Status Arsip: File dokumen telah tertaut dalam berkas thread ini"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      Archived
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    <span className="font-mono font-bold text-slate-900 block text-xs">
                                      {item.data.nomorNaskah}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${
                                        isMasuk
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                                      }`}
                                    >
                                      {isMasuk ? <Inbox className="w-3 h-3 text-emerald-600" /> : <Send className="w-3 h-3 text-sky-600" />}
                                      <span>{isMasuk ? 'Naskah Masuk' : 'Naskah Keluar'}</span>
                                    </span>
                                  </td>

                                  <td className="p-3 whitespace-nowrap text-slate-700">
                                    <div className="font-semibold text-xs">
                                      {item.rawDate
                                        ? new Date(item.rawDate).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })
                                        : '-'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {isMasuk ? 'Surat Diterima' : 'Surat Dikirim'}
                                    </div>
                                  </td>

                                  <td className="p-3 max-w-xs">
                                    <p className="font-bold text-slate-900 text-xs line-clamp-2" title={item.data.perihal}>
                                      {item.data.perihal}
                                    </p>
                                    <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                                      {item.data.jenisNaskah || '-'}
                                    </span>
                                  </td>

                                  <td className="p-3 max-w-xs">
                                    <div className="font-bold text-slate-800 text-xs truncate">
                                      {isMasuk ? dataMasuk?.pengirimNaskah : dataKeluar?.tujuanNaskah}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                      {item.data.instansiTerkait} {item.data.wilayahKerja ? `(${item.data.wilayahKerja})` : ''}
                                    </div>
                                  </td>

                                  <td className="p-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isMasuk
                                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                                      }`}
                                    >
                                      {isMasuk ? dataMasuk?.statusPenyelesaian : dataKeluar?.statusPengiriman}
                                    </span>
                                  </td>

                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      {item.data.fileLinkNaskahMasuk ? (
                                        <a
                                          href={item.data.fileLinkNaskahMasuk}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition-colors shadow-2xs"
                                          title={`Buka Dokumen: ${item.data.fileLinkNaskahMasuk}`}
                                        >
                                          <Paperclip className="w-2.5 h-2.5 text-emerald-600" />
                                          <span>File Surat</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                        </a>
                                      ) : null}

                                      {item.data.fileLinkNaskahDijawab ? (
                                        <a
                                          href={item.data.fileLinkNaskahDijawab}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold transition-colors shadow-2xs"
                                          title={`Buka File Dijawab/Balasan: ${item.data.fileLinkNaskahDijawab}`}
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
                                          <span>File Balasan</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-teal-600" />
                                        </a>
                                      ) : null}

                                      {!isMasuk && dataKeluar?.buktiKirim ? (
                                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          Kirim: {dataKeluar.buktiKirim}
                                        </span>
                                      ) : null}

                                      {!item.data.fileLinkNaskahMasuk && !item.data.fileLinkNaskahDijawab && (!dataKeluar || !dataKeluar.buktiKirim) && (
                                        <span className="text-slate-400 font-bold text-[10px]">-</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-3 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUnlinkItemToConfirm({
                                          threadId: activeThread.id,
                                          type: item.type,
                                          id: item.data.id,
                                          nomor: item.data.nomorNaskah || '-'
                                        });
                                      }}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                      title="Lepas tautan naskah dari thread ini"
                                    >
                                      <Unlink className="w-3 h-3" />
                                      <span>Lepas</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE B: TIMELINE ALUR KRONOLOGIS */
                    <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-600 before:via-teal-500 before:to-sky-500 space-y-6">
                      {threadLetters.map((item, idx) => {
                        const isMasuk = item.type === 'masuk';
                        const dataMasuk = isMasuk ? (item.data as NaskahMasukItem) : null;
                        const dataKeluar = !isMasuk ? (item.data as NaskahKeluarItem) : null;

                        return (
                          <div key={`${item.type}-${item.data.id}`} className="relative group">
                            {/* Circle Node on Timeline */}
                            <div
                              className={`absolute -left-[30px] top-4 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white ${
                                isMasuk ? 'bg-emerald-600' : 'bg-sky-600'
                              }`}
                            >
                              {isMasuk ? <Inbox className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                            </div>

                            {/* Letter Card */}
                            <div
                              className={`rounded-2xl p-5 border shadow-sm transition-all ${
                                isMasuk
                                  ? 'bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 border-emerald-200 hover:border-emerald-400'
                                  : 'bg-gradient-to-br from-sky-50/60 via-white to-blue-50/30 border-sky-200 hover:border-sky-400'
                              }`}
                            >
                              {/* Header Card */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                                      isMasuk ? 'bg-emerald-700 text-white' : 'bg-sky-700 text-white'
                                    }`}
                                  >
                                    Urutan #{idx + 1} • {isMasuk ? 'Naskah Masuk' : 'Naskah Keluar'}
                                  </span>

                                  <span className="font-mono text-xs font-bold text-slate-800">
                                    No. {item.data.nomorNaskah}
                                  </span>

                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shadow-2xs"
                                    title="Status Arsip: Archived (Tertaut dalam Thread)"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    Archived
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                      Tgl:{' '}
                                      {item.rawDate
                                        ? new Date(item.rawDate).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })
                                        : '-'}
                                    </span>
                                  </div>

                                  {/* Unlink button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUnlinkItemToConfirm({
                                        threadId: activeThread.id,
                                        type: item.type,
                                        id: item.data.id,
                                        nomor: item.data.nomorNaskah || '-'
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Lepas tautan dari thread ini"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Body Card */}
                              <div className="mt-3 space-y-2 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                    Perihal Surat
                                  </span>
                                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                                    {item.data.perihal}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      {isMasuk ? 'Pengirim Surat' : 'Tujuan Surat'}
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {isMasuk ? dataMasuk?.pengirimNaskah : dataKeluar?.tujuanNaskah}
                                    </span>
                                  </div>

                                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      Instansi / Wilayah
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {item.data.instansiTerkait} ({item.data.wilayahKerja})
                                    </span>
                                  </div>

                                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      {isMasuk ? 'Status Penyelesaian' : 'Status Pengiriman'}
                                    </span>
                                    <span
                                      className={`font-black ${
                                        isMasuk ? 'text-emerald-700' : 'text-sky-700'
                                      }`}
                                    >
                                      {isMasuk ? dataMasuk?.statusPenyelesaian : dataKeluar?.statusPengiriman}
                                    </span>
                                  </div>
                                </div>

                                {/* Link Attachments */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                  {item.data.fileLinkNaskahMasuk && (
                                    <a
                                      href={item.data.fileLinkNaskahMasuk}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                                    >
                                      <Paperclip className="w-3 h-3 text-emerald-600" />
                                      <span>File Dokumen Surat</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  {item.data.fileLinkNaskahDijawab && (
                                    <a
                                      href={item.data.fileLinkNaskahDijawab}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                      <span>File Balasan / Dijawab</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  {!isMasuk && dataKeluar?.buktiKirim && (
                                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                      Bukti Kirim: <strong className="text-slate-700">{dataKeluar.buktiKirim}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AUDIT TRAIL & LOG RIWAYAT THREAD */}
              {detailTab === 'history' && (
                <div className="p-6 space-y-6">
                  {/* Form Tambah Catatan */}
                  <form onSubmit={handleAddNote} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Tambah Catatan Progress / Riwayat Tindak Lanjut
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="Contoh: Tim telah verifikasi berkas dan disposisi ke pimpinan..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Catatan</span>
                      </button>
                    </div>
                  </form>

                  {/* History Timeline */}
                  <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-4">
                    {activeThread.history
                      .slice()
                      .reverse()
                      .map((h, hIdx) => {
                        const iconBg =
                          h.type === 'create'
                            ? 'bg-emerald-600'
                            : h.type === 'link_masuk'
                            ? 'bg-teal-600'
                            : h.type === 'link_keluar'
                            ? 'bg-sky-600'
                            : h.type === 'status_change'
                            ? 'bg-amber-600'
                            : 'bg-slate-600';

                        return (
                          <div key={h.id || hIdx} className="relative">
                            <div
                              className={`absolute -left-[27px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs ${iconBg}`}
                            >
                              <Clock className="w-3 h-3" />
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="font-bold text-slate-700">{h.actorName}</span>
                                <span>{new Date(h.timestamp).toLocaleString('id-ID')}</span>
                              </div>
                              <p className="text-slate-800 font-medium">{h.description}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800">Pilih Berkas Thread</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Pilih salah satu berkas thread di sebelah kiri untuk melihat kronologis alur surat terpadu dan riwayat lengkapnya.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL / DRAWER: FORM CREATE & EDIT BERKAS THREAD (FULL SCREEN) */}
      {isFormOpen && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center animate-fade-in ${
            isFormFullscreen ? 'p-0' : 'p-3 sm:p-5'
          }`}
        >
          <div
            className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              isFormFullscreen
                ? 'w-full h-full rounded-none max-w-none max-h-none border-0'
                : 'w-full max-w-6xl rounded-3xl my-auto max-h-[94vh] border border-emerald-200'
            }`}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs">
                  <FolderKanban className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                      {editingThread ? `Edit Berkas Thread #${editingThread.nomorThread}` : 'Buat Berkas Thread Baru'}
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-500/40 hidden sm:inline-block">
                      {isFormFullscreen ? 'Layar Penuh (Full Screen)' : 'Formulir Terpadu'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Formulir penggabungan dan integrasi naskah masuk & keluar yang saling berkaitan ke dalam satu berkas thread arsip.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFormFullscreen(!isFormFullscreen)}
                  className="p-2 rounded-xl hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isFormFullscreen ? 'Kecilkan Tampilan (Windowed)' : 'Tampilan Penuh (Full Screen)'}
                >
                  {isFormFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Tutup Formulir"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Nomor Thread: Otomatis */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Thread <span className="text-emerald-700 font-extrabold">(Otomatis Sesuai Pengaturan)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formCustomNomor || (editingThread ? editingThread.nomorThread : nextNomorPreview)}
                      onChange={(e) => setFormCustomNomor(e.target.value)}
                      placeholder="Nomor Otomatis..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 font-mono font-bold text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setConfigPrefix(threadNumberConfig.prefix || 'TH');
                        setConfigFormat(threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]');
                        setConfigDigits(threadNumberConfig.counterDigits || 4);
                        setConfigCounter(threadNumberConfig.currentCounter || 1);
                        setConfigReset(threadNumberConfig.resetPeriod || 'yearly');
                        setIsConfigOpen(true);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300"
                      title="Ubah Format Nomor Thread Otomatis"
                    >
                      <Settings className="w-4 h-4 text-emerald-700" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Format saat ini: <strong className="text-slate-600">{threadNumberConfig.format}</strong>
                  </span>
                </div>

                {/* 2. Nama Berkas: Textbox */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Berkas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNamaBerkas}
                    onChange={(e) => setFormNamaBerkas(e.target.value)}
                    placeholder="Contoh: Pemberkasan Kenaikan Pangkat ASN Periode Agustus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Nama / judul kumpulan surat yang dihimpun dalam thread ini.
                  </span>
                </div>

                {/* 3. Klasifikasi Berkas: Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Klasifikasi Berkas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formKlasifikasiBerkas}
                    onChange={(e) => setFormKlasifikasiBerkas(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs bg-white"
                    required
                  >
                    {klasifikasiSub.map((k) => (
                      <optgroup key={k.id} label={`Induk: ${k.klasifikasiUtama}`}>
                        <option value={k.klasifikasiUtama}>{k.klasifikasiUtama} (Utama)</option>
                        {k.subKlasifikasiList.map((sub) => (
                          <option key={`${k.id}-${sub}`} value={sub}>
                            ↳ {sub}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* 4. Kode Klasifikasi: (Kode Arsip) dari Master Data "Klasifikasi Arsip" */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Kode Klasifikasi <span className="text-emerald-700 font-extrabold">(Kode Arsip)</span> <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setActiveTab('masterData');
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                    >
                      Buka Master Data Klasifikasi Arsip
                    </button>
                  </div>
                  <select
                    value={formKodeKlasifikasi}
                    onChange={(e) => setFormKodeKlasifikasi(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs bg-white"
                    required
                  >
                    {klasifikasiArsipList.map((ka) => (
                      <option key={ka.id} value={ka.kodeKlasifikasi}>
                        {ka.kodeKlasifikasi} - {ka.namaKlasifikasi}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const sel = klasifikasiArsipList.find((k) => k.kodeKlasifikasi === formKodeKlasifikasi);
                    return sel ? (
                      <span className="text-[11px] text-emerald-800 font-medium mt-1 block">
                        Retensi Aktif: {sel.retensiAktif || 2} thn • Retensi Inaktif: {sel.retensiInaktif || 5} thn • Nasib: {sel.nasibAkhir || 'Permanen'}
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* 5. Unit Kerja & Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Kerja Pengelola
                  </label>
                  <select
                    value={formUnitKerja}
                    onChange={(e) => setFormUnitKerja(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs bg-white"
                  >
                    {unitKerjaList.map((u, idx) => (
                      <option key={`${u}-${idx}`} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Berkas
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs bg-white"
                  >
                    <option value="Aktif">Aktif (Baru dibuka / berjalan)</option>
                    <option value="Proses">Proses (Menunggu jawaban / disposisi)</option>
                    <option value="Selesai">Selesai (Sudah terjawab tuntas)</option>
                    <option value="Inaktif">Inaktif (Arsip statis / selesai lama)</option>
                    <option value="Ditutup">Ditutup</option>
                  </select>
                </div>
              </div>

              {/* Lokasi Fisik Arsip & Catatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Fisik Berkas <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formLokasiFisik}
                    onChange={(e) => setFormLokasiFisik(e.target.value)}
                    placeholder="Contoh: Boks Arsip 01 / Lemari B-2 / Map Gantung 05"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan / Ringkasan Berkas
                  </label>
                  <input
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Ringkasan singkat topik pembicaraan naskah..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Tautkan Surat Awal (PILIH MELALUI TABEL NASKAH MASUK & KELUAR) */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-emerald-950 flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-700" />
                      <span>Pilih & Tautkan Naskah ke Dalam Thread Melalui Tabel</span>
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih naskah masuk atau naskah keluar dari tabel database di bawah ini untuk ditautkan secara kronologis ke berkas thread ini.
                    </p>
                  </div>

                  {/* Ringkasan Jumlah Naskah Terpilih */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300">
                      Masuk: {formSelectedMasukIds.length}
                    </span>
                    <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg border border-sky-300">
                      Keluar: {formSelectedKeluarIds.length}
                    </span>
                    <span className="px-3.5 py-1 bg-slate-800 text-white text-xs font-extrabold rounded-lg shadow-xs">
                      Total: {formSelectedMasukIds.length + formSelectedKeluarIds.length} Naskah
                    </span>
                  </div>
                </div>

                {/* TAB SWITCHER: NASKAH MASUK / NASKAH KELUAR / TERPILIH */}
                <div className="flex border-b border-slate-200 gap-1 bg-slate-100/70 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormLinkTab('masuk')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formLinkTab === 'masuk'
                        ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-emerald-700" />
                    <span>Tabel Naskah Masuk</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formSelectedMasukIds.length > 0
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {formSelectedMasukIds.length > 0 ? `${formSelectedMasukIds.length} dipilih` : `${naskahMasukList.length}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormLinkTab('keluar')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formLinkTab === 'keluar'
                        ? 'bg-white text-sky-900 shadow-sm border border-sky-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Send className="w-4 h-4 text-sky-700" />
                    <span>Tabel Naskah Keluar</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formSelectedKeluarIds.length > 0
                          ? 'bg-sky-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {formSelectedKeluarIds.length > 0 ? `${formSelectedKeluarIds.length} dipilih` : `${naskahKeluarList.length}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormLinkTab('selected')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formLinkTab === 'selected'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <ListChecks className="w-4 h-4 text-teal-700" />
                    <span>Ringkasan Terpilih</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formSelectedMasukIds.length + formSelectedKeluarIds.length > 0
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {formSelectedMasukIds.length + formSelectedKeluarIds.length}
                    </span>
                  </button>
                </div>

                {/* CONTENT 1: TABEL NASKAH MASUK */}
                {formLinkTab === 'masuk' && (
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    {/* Filter & Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={formLinkSearchMasuk}
                            onChange={(e) => {
                              setFormLinkSearchMasuk(e.target.value);
                              setFormLinkPageMasuk(1);
                            }}
                            placeholder="Cari nomor naskah, perihal, pengirim, instansi..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>

                        {/* Filter Unit Kerja */}
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                          <select
                            value={formLinkFilterUnitMasuk}
                            onChange={(e) => {
                              setFormLinkFilterUnitMasuk(e.target.value);
                              setFormLinkPageMasuk(1);
                            }}
                            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="ALL">Semua Unit Kerja</option>
                            {unitKerjaList.map((u, i) => (
                              <option key={`${u}-${i}`} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Bulk Select Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllDisplayedMasuk}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Pilih / Batalkan Hal. Ini</span>
                        </button>
                        {formSelectedMasukIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormSelectedMasukIds([])}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                          >
                            Kosongkan ({formSelectedMasukIds.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  formPaginatedMasuk.length > 0 &&
                                  formPaginatedMasuk.every((m) => formSelectedMasukIds.includes(m.id))
                                }
                                onChange={handleSelectAllDisplayedMasuk}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </th>
                            <th className="p-3 w-12 text-center">No</th>
                            <th className="p-3">Nomor Naskah & Agenda</th>
                            <th className="p-3">Tanggal & Asal Surat</th>
                            <th className="p-3">Perihal Naskah</th>
                            <th className="p-3">Unit Pengelola</th>
                            <th className="p-3 text-center">Dokumen</th>
                            <th className="p-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {formPaginatedMasuk.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="font-bold text-slate-600">Tidak ada naskah masuk yang cocok</p>
                                <p className="text-[11px] text-slate-400">Silakan ubah kata kunci pencarian atau filter unit kerja.</p>
                              </td>
                            </tr>
                          ) : (
                            formPaginatedMasuk.map((m, idx) => {
                              const isChecked = formSelectedMasukIds.includes(m.id);
                              return (
                                <tr
                                  key={m.id}
                                  onClick={() => handleToggleSelectMasuk(m.id)}
                                  className={`transition-colors cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-50/90 hover:bg-emerald-100/90 font-medium'
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSelectMasuk(m.id)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                                    {(formLinkPageMasuk - 1) * formLinkPerPage + idx + 1}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono font-bold text-emerald-950 block text-[11px]">
                                      {m.nomorNaskah}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Agenda: <strong className="text-slate-600">{m.nomorAgenda || '-'}</strong>
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold text-slate-800 block text-[11px]">
                                      {m.tanggalNaskah ? new Date(m.tanggalNaskah).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                      {m.instansiTerkait ? `${m.instansiTerkait} - ` : ''}{m.pengirimNaskah}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <p className="font-medium text-slate-900 text-xs line-clamp-2 max-w-md">
                                      {m.perihal}
                                    </p>
                                    <span className="text-[10px] text-emerald-700 font-semibold">
                                      {m.jenisNaskah}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                      {m.unitKerja || 'Umum'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      {m.fileLinkNaskahMasuk ? (
                                        <a
                                          href={m.fileLinkNaskahMasuk}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] border border-emerald-300 transition-colors shadow-2xs hover:shadow-xs"
                                          title={`Buka Dokumen Naskah Masuk: ${m.fileLinkNaskahMasuk}`}
                                        >
                                          <Paperclip className="w-3 h-3 text-emerald-700" />
                                          <span>File Surat</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                        </a>
                                      ) : (m as any).fileUrl ? (
                                        <a
                                          href={(m as any).fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] border border-emerald-300 transition-colors shadow-2xs"
                                        >
                                          <Paperclip className="w-3 h-3 text-emerald-700" />
                                          <span>File Surat</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                        </a>
                                      ) : null}

                                      {m.fileLinkNaskahDijawab && (
                                        <a
                                          href={m.fileLinkNaskahDijawab}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[10px] border border-teal-200 transition-colors"
                                          title={`Buka File Balasan / Dijawab: ${m.fileLinkNaskahDijawab}`}
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
                                          <span>Balasan</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-teal-500" />
                                        </a>
                                      )}

                                      {!m.fileLinkNaskahMasuk && !m.fileLinkNaskahDijawab && !(m as any).fileUrl && (
                                        <span className="text-[11px] text-slate-400 italic">Tanpa file</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectMasuk(m.id)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-emerald-700 text-white shadow-xs'
                                          : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                                      }`}
                                    >
                                      {isChecked ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Terpilih</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Tautkan</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          Menampilkan{' '}
                          <strong className="text-slate-800">
                            {formFilteredMasuk.length > 0
                              ? (formLinkPageMasuk - 1) * formLinkPerPage + 1
                              : 0}{' '}
                            -{' '}
                            {Math.min(
                              formLinkPageMasuk * formLinkPerPage,
                              formFilteredMasuk.length
                            )}
                          </strong>{' '}
                          dari <strong className="text-slate-800">{formFilteredMasuk.length}</strong> naskah masuk
                        </span>
                        <span className="text-slate-300">•</span>
                        <label className="flex items-center gap-1 text-[11px]">
                          <span>Per hal:</span>
                          <select
                            value={formLinkPerPage}
                            onChange={(e) => {
                              setFormLinkPerPage(Number(e.target.value));
                              setFormLinkPageMasuk(1);
                              setFormLinkPageKeluar(1);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 text-xs font-bold"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={formLinkPageMasuk <= 1}
                          onClick={() => setFormLinkPageMasuk((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 inline" /> Prev
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                          Hal {formLinkPageMasuk} / {formTotalPagesMasuk}
                        </span>
                        <button
                          type="button"
                          disabled={formLinkPageMasuk >= formTotalPagesMasuk}
                          onClick={() => setFormLinkPageMasuk((p) => Math.min(formTotalPagesMasuk, p + 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                        >
                          Next <ChevronRight className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTENT 2: TABEL NASKAH KELUAR */}
                {formLinkTab === 'keluar' && (
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    {/* Filter & Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={formLinkSearchKeluar}
                            onChange={(e) => {
                              setFormLinkSearchKeluar(e.target.value);
                              setFormLinkPageKeluar(1);
                            }}
                            placeholder="Cari nomor naskah keluar, perihal, tujuan surat..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                          />
                        </div>

                        {/* Filter Unit Kerja */}
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                          <select
                            value={formLinkFilterUnitKeluar}
                            onChange={(e) => {
                              setFormLinkFilterUnitKeluar(e.target.value);
                              setFormLinkPageKeluar(1);
                            }}
                            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="ALL">Semua Unit Kerja</option>
                            {unitKerjaList.map((u, i) => (
                              <option key={`${u}-${i}`} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Bulk Select Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllDisplayedKeluar}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Pilih / Batalkan Hal. Ini</span>
                        </button>
                        {formSelectedKeluarIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormSelectedKeluarIds([])}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                          >
                            Kosongkan ({formSelectedKeluarIds.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  formPaginatedKeluar.length > 0 &&
                                  formPaginatedKeluar.every((k) => formSelectedKeluarIds.includes(k.id))
                                }
                                onChange={handleSelectAllDisplayedKeluar}
                                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </th>
                            <th className="p-3 w-12 text-center">No</th>
                            <th className="p-3">Nomor Naskah & Agenda</th>
                            <th className="p-3">Tanggal & Tujuan Surat</th>
                            <th className="p-3">Perihal Naskah</th>
                            <th className="p-3">Unit Pengelola</th>
                            <th className="p-3 text-center">Dokumen / Bukti</th>
                            <th className="p-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {formPaginatedKeluar.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                <Send className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="font-bold text-slate-600">Tidak ada naskah keluar yang cocok</p>
                                <p className="text-[11px] text-slate-400">Silakan ubah kata kunci pencarian atau filter unit kerja.</p>
                              </td>
                            </tr>
                          ) : (
                            formPaginatedKeluar.map((k, idx) => {
                              const isChecked = formSelectedKeluarIds.includes(k.id);
                              return (
                                <tr
                                  key={k.id}
                                  onClick={() => handleToggleSelectKeluar(k.id)}
                                  className={`transition-colors cursor-pointer ${
                                    isChecked
                                      ? 'bg-sky-50/90 hover:bg-sky-100/90 font-medium'
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSelectKeluar(k.id)}
                                      className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                                    {(formLinkPageKeluar - 1) * formLinkPerPage + idx + 1}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono font-bold text-sky-950 block text-[11px]">
                                      {k.nomorNaskah}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Agenda: <strong className="text-slate-600">{k.nomorAgenda || '-'}</strong>
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold text-slate-800 block text-[11px]">
                                      {k.tanggalNaskah ? new Date(k.tanggalNaskah).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                      Tujuan: <strong className="text-slate-700">{k.tujuanNaskah}</strong>
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <p className="font-medium text-slate-900 text-xs line-clamp-2 max-w-md">
                                      {k.perihal}
                                    </p>
                                    <span className="text-[10px] text-sky-700 font-semibold">
                                      {k.jenisNaskah}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                      {k.unitKerja || 'Umum'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      {k.fileLinkNaskahDijawab ? (
                                        <a
                                          href={k.fileLinkNaskahDijawab}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-[11px] border border-sky-300 transition-colors shadow-2xs hover:shadow-xs"
                                          title={`Buka Dokumen Naskah Keluar: ${k.fileLinkNaskahDijawab}`}
                                        >
                                          <Paperclip className="w-3 h-3 text-sky-700" />
                                          <span>File Surat</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                                        </a>
                                      ) : (k as any).fileUrl ? (
                                        <a
                                          href={(k as any).fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-[11px] border border-sky-300 transition-colors shadow-2xs"
                                        >
                                          <Paperclip className="w-3 h-3 text-sky-700" />
                                          <span>File Surat</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                                        </a>
                                      ) : null}

                                      {k.fileLinkNaskahMasuk && (
                                        <a
                                          href={k.fileLinkNaskahMasuk}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-[10px] border border-indigo-200 transition-colors"
                                          title={`Buka Naskah Terkait: ${k.fileLinkNaskahMasuk}`}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5 text-indigo-500" />
                                          <span>Terkait</span>
                                        </a>
                                      )}

                                      {k.buktiKirim && (
                                        k.buktiKirim.startsWith('http') || k.buktiKirim.startsWith('/') ? (
                                          <a
                                            href={k.buktiKirim}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-200"
                                            title={`Bukti Kirim: ${k.buktiKirim}`}
                                          >
                                            <FileText className="w-2.5 h-2.5 text-amber-600" />
                                            <span>Bukti</span>
                                          </a>
                                        ) : (
                                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono" title={k.buktiKirim}>
                                            Resi: {k.buktiKirim}
                                          </span>
                                        )
                                      )}

                                      {!k.fileLinkNaskahDijawab && !k.fileLinkNaskahMasuk && !k.buktiKirim && !(k as any).fileUrl && (
                                        <span className="text-[11px] text-slate-400 italic">Tanpa file</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectKeluar(k.id)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-sky-700 text-white shadow-xs'
                                          : 'bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700'
                                      }`}
                                    >
                                      {isChecked ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Terpilih</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Tautkan</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          Menampilkan{' '}
                          <strong className="text-slate-800">
                            {formFilteredKeluar.length > 0
                              ? (formLinkPageKeluar - 1) * formLinkPerPage + 1
                              : 0}{' '}
                            -{' '}
                            {Math.min(
                              formLinkPageKeluar * formLinkPerPage,
                              formFilteredKeluar.length
                            )}
                          </strong>{' '}
                          dari <strong className="text-slate-800">{formFilteredKeluar.length}</strong> naskah keluar
                        </span>
                        <span className="text-slate-300">•</span>
                        <label className="flex items-center gap-1 text-[11px]">
                          <span>Per hal:</span>
                          <select
                            value={formLinkPerPage}
                            onChange={(e) => {
                              setFormLinkPerPage(Number(e.target.value));
                              setFormLinkPageMasuk(1);
                              setFormLinkPageKeluar(1);
                            }}
                            className="px-2 py-1 rounded border border-slate-300 text-xs font-bold"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={formLinkPageKeluar <= 1}
                          onClick={() => setFormLinkPageKeluar((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 inline" /> Prev
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                          Hal {formLinkPageKeluar} / {formTotalPagesKeluar}
                        </span>
                        <button
                          type="button"
                          disabled={formLinkPageKeluar >= formTotalPagesKeluar}
                          onClick={() => setFormLinkPageKeluar((p) => Math.min(formTotalPagesKeluar, p + 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                        >
                          Next <ChevronRight className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTENT 3: TABEL RINGKASAN TERPILIH */}
                {formLinkTab === 'selected' && (
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          Daftar Naskah yang Telah Dipilih untuk Ditautkan ({selectedMasukObjects.length + selectedKeluarObjects.length} Naskah)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Surat-surat berikut akan dihubungkan secara otomatis ke dalam berkas thread saat disimpan.
                        </p>
                      </div>

                      {selectedMasukObjects.length + selectedKeluarObjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormSelectedMasukIds([]);
                            setFormSelectedKeluarIds([]);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Kosongkan Semua Pilihan
                        </button>
                      )}
                    </div>

                    {selectedMasukObjects.length + selectedKeluarObjects.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h5 className="font-bold text-slate-700 text-xs">Belum Ada Naskah yang Dipilih</h5>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          Buka tab "Tabel Naskah Masuk" atau "Tabel Naskah Keluar" di atas untuk memilih surat-surat yang ingin Anda satukan dalam berkas thread ini.
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => setFormLinkTab('masuk')}
                            className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900 cursor-pointer"
                          >
                            Buka Tabel Naskah Masuk
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormLinkTab('keluar')}
                            className="px-3.5 py-1.5 bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sky-900 cursor-pointer"
                          >
                            Buka Tabel Naskah Keluar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="p-3 w-10 text-center">No</th>
                              <th className="p-3">Jenis Naskah</th>
                              <th className="p-3">Nomor Naskah</th>
                              <th className="p-3">Tanggal Surat</th>
                              <th className="p-3">Asal / Tujuan</th>
                              <th className="p-3">Perihal</th>
                              <th className="p-3">Unit Pengelola</th>
                              <th className="p-3 text-center">Dokumen</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {/* Selected Masuk */}
                            {selectedMasukObjects.map((m, idx) => (
                              <tr key={`sel-m-${m.id}`} className="hover:bg-slate-50">
                                <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] inline-flex items-center gap-1">
                                    <Inbox className="w-3 h-3 text-emerald-700" />
                                    <span>Naskah Masuk</span>
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-900 text-[11px]">
                                  {m.nomorNaskah}
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  {m.tanggalNaskah ? new Date(m.tanggalNaskah).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td className="p-3 text-slate-700 text-[11px]">
                                  {m.instansiTerkait ? `${m.instansiTerkait} - ` : ''}{m.pengirimNaskah}
                                </td>
                                <td className="p-3 text-slate-800 font-medium text-xs max-w-xs truncate">
                                  {m.perihal}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                    {m.unitKerja || '-'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    {m.fileLinkNaskahMasuk ? (
                                      <a
                                        href={m.fileLinkNaskahMasuk}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] border border-emerald-300"
                                      >
                                        <Paperclip className="w-3 h-3 text-emerald-700" />
                                        <span>File</span>
                                        <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                      </a>
                                    ) : null}
                                    {m.fileLinkNaskahDijawab && (
                                      <a
                                        href={m.fileLinkNaskahDijawab}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[10px] border border-teal-200"
                                      >
                                        <span>Balasan</span>
                                      </a>
                                    )}
                                    {!m.fileLinkNaskahMasuk && !m.fileLinkNaskahDijawab && (
                                      <span className="text-[10px] text-slate-400">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectMasuk(m.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Lepas dari pilihan"
                                  >
                                    <Unlink className="w-3 h-3 text-rose-600" />
                                    <span>Lepas</span>
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {/* Selected Keluar */}
                            {selectedKeluarObjects.map((k, idx) => (
                              <tr key={`sel-k-${k.id}`} className="hover:bg-slate-50">
                                <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                                  {selectedMasukObjects.length + idx + 1}
                                </td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 font-extrabold text-[10px] inline-flex items-center gap-1">
                                    <Send className="w-3 h-3 text-sky-700" />
                                    <span>Naskah Keluar</span>
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-900 text-[11px]">
                                  {k.nomorNaskah}
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  {k.tanggalNaskah ? new Date(k.tanggalNaskah).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td className="p-3 text-slate-700 text-[11px]">
                                  Tujuan: {k.tujuanNaskah}
                                </td>
                                <td className="p-3 text-slate-800 font-medium text-xs max-w-xs truncate">
                                  {k.perihal}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                    {k.unitKerja || '-'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    {k.fileLinkNaskahDijawab ? (
                                      <a
                                        href={k.fileLinkNaskahDijawab}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-[10px] border border-sky-300"
                                      >
                                        <Paperclip className="w-3 h-3 text-sky-700" />
                                        <span>File</span>
                                        <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                                      </a>
                                    ) : null}
                                    {k.fileLinkNaskahMasuk && (
                                      <a
                                        href={k.fileLinkNaskahMasuk}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-[10px] border border-indigo-200"
                                      >
                                        <span>Terkait</span>
                                      </a>
                                    )}
                                    {!k.fileLinkNaskahDijawab && !k.fileLinkNaskahMasuk && (
                                      <span className="text-[10px] text-slate-400">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectKeluar(k.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Lepas dari pilihan"
                                  >
                                    <Unlink className="w-3 h-3 text-rose-600" />
                                    <span>Lepas</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons (Pinned Footer in Full Screen) */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
              {editingThread ? (
                <button
                  type="button"
                  onClick={() => {
                    setThreadToDelete(editingThread);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus Berkas (Thread)</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingThread ? 'Simpan Perubahan Berkas' : 'Simpan & Buat Berkas Thread'}</span>
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: PENGATURAN NOMOR THREAD OTOMATIS */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-extrabold text-white">
                  Pengaturan Format Nomor Thread Otomatis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prefix / Kode Awalan</label>
                <input
                  type="text"
                  value={configPrefix}
                  onChange={(e) => setConfigPrefix(e.target.value)}
                  placeholder="Contoh: TH atau BRK"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pola Format Nomor</label>
                <input
                  type="text"
                  value={configFormat}
                  onChange={(e) => setConfigFormat(e.target.value)}
                  placeholder="[PREFIX]-[YYYY]-[COUNTER]"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tag pengganti: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">[PREFIX]</code>,{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">[YYYY]</code> (tahun 4 digit),{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">[YY]</code>,{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">[MM]</code> (bulan 2 digit),{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">[COUNTER]</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Digit Urut</label>
                  <select
                    value={configDigits}
                    onChange={(e) => setConfigDigits(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                  >
                    <option value={3}>3 digit (001)</option>
                    <option value={4}>4 digit (0001)</option>
                    <option value={5}>5 digit (00001)</option>
                    <option value={6}>6 digit (000001)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Urut Saat Ini</label>
                  <input
                    type="number"
                    min={1}
                    value={configCounter}
                    onChange={(e) => setConfigCounter(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periode Reset Nomor</label>
                <select
                  value={configReset}
                  onChange={(e) => setConfigReset(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                >
                  <option value="yearly">Reset Setiap Tahun Baru (1 Januari)</option>
                  <option value="monthly">Reset Setiap Bulan Baru</option>
                  <option value="never">Tidak Pernah Reset (Lanjut Terus)</option>
                </select>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block font-bold uppercase tracking-wider">
                  Contoh Nomor yang Dihasilkan:
                </span>
                <span className="font-mono text-sm font-black text-emerald-950 mt-0.5 block">
                  {configFormat
                    .replace(/\[PREFIX\]/g, configPrefix)
                    .replace(/\[YYYY\]/g, String(new Date().getFullYear()))
                    .replace(/\[YY\]/g, String(new Date().getFullYear()).slice(-2))
                    .replace(/\[MM\]/g, String(new Date().getMonth() + 1).padStart(2, '0'))
                    .replace(/\[COUNTER\]/g, String(Number(configCounter) + 1).padStart(Number(configDigits) || 4, '0'))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black shadow flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: TAUTKAN NASKAH KE THREAD INI */}
      {linkModalType !== 'none' && activeThread && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-2xl overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {linkModalType === 'masuk' ? (
                  <Inbox className="w-5 h-5 text-emerald-300" />
                ) : (
                  <Send className="w-5 h-5 text-sky-300" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Tautkan {linkModalType === 'masuk' ? 'Naskah Masuk' : 'Naskah Keluar'} ke Berkas #{activeThread.nomorThread}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Pilih surat yang ingin dimasukkan ke dalam rantai thread ini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalType('none')}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={linkSearchTerm}
                  onChange={(e) => setLinkSearchTerm(e.target.value)}
                  placeholder={`Cari nomor naskah, perihal ${linkModalType}...`}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                {linkModalType === 'masuk' ? (
                  availableMasukToLink.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 font-medium">
                      Semua naskah masuk sudah ditautkan atau tidak ada yang sesuai pencarian.
                    </p>
                  ) : (
                    availableMasukToLink.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-slate-900 block truncate">
                            {m.nomorNaskah}
                          </span>
                          <span className="text-slate-600 block truncate text-[11px]">
                            {m.perihal}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Pengirim: {m.pengirimNaskah} ({m.tglNaskah})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            linkNaskahToThread(activeThread.id, 'masuk', m.id);
                            setLinkModalType('none');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shrink-0 shadow-2xs"
                        >
                          + Tautkan
                        </button>
                      </div>
                    ))
                  )
                ) : availableKeluarToLink.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 font-medium">
                    Semua naskah keluar sudah ditautkan atau tidak ada yang sesuai pencarian.
                  </p>
                ) : (
                  availableKeluarToLink.map((k) => (
                    <div
                      key={k.id}
                      className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-sky-300 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-900 block truncate">
                          {k.nomorNaskah}
                        </span>
                        <span className="text-slate-600 block truncate text-[11px]">
                          {k.perihal}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Tujuan: {k.tujuanNaskah} ({k.tglNaskah})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          linkNaskahToThread(activeThread.id, 'keluar', k.id);
                          setLinkModalType('none');
                        }}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-bold text-xs shrink-0 shadow-2xs"
                      >
                        + Tautkan
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setLinkModalType('none')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: KONFIRMASI HAPUS BERKAS THREAD */}
      {threadToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Berkas (Thread)?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus berkas <strong className="font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{threadToDelete.nomorThread}</strong>
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  "{threadToDelete.namaBerkas}"
                </p>
                <div className="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-3 mt-3 border border-amber-200 text-left space-y-1">
                  <span className="font-bold block flex items-center gap-1 text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Catatan Penting:
                  </span>
                  <span>
                    Surat masuk & keluar yang terhubung ke thread ini tidak akan hilang dari database naskah, hanya ikatan berkasnya saja yang dilepaskan.
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setThreadToDelete(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = threadToDelete.id;
                    deleteBerkasThread(idToDelete);
                    if (selectedThreadId === idToDelete) {
                      const remaining = berkasThreadList.filter((t) => t.id !== idToDelete);
                      setSelectedThreadId(remaining.length > 0 ? remaining[0].id : null);
                    }
                    if (isFormOpen && editingThread?.id === idToDelete) {
                      setIsFormOpen(false);
                      setEditingThread(null);
                    }
                    setThreadToDelete(null);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Berkas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: KONFIRMASI LEPAS TAUTAN NASKAH */}
      {unlinkItemToConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-100 w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Unlink className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Lepas Naskah dari Thread?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lepaskan naskah No. <strong className="font-mono text-slate-800">{unlinkItemToConfirm.nomor}</strong> dari berkas thread ini?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlinkItemToConfirm(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    unlinkNaskahFromThread(
                      unlinkItemToConfirm.threadId,
                      unlinkItemToConfirm.type,
                      unlinkItemToConfirm.id
                    );
                    setUnlinkItemToConfirm(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Ya, Lepas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
