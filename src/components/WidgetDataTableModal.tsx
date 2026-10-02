import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  ExternalLink,
  ArrowUpRight,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Send,
  Archive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ActiveTab } from '../types';
import { useApp } from '../context/AppContext';

export interface WidgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  type: 'masuk' | 'keluar' | 'all';
  items: any[];
  actionTab: ActiveTab;
  onNavigateToTab: (tab: ActiveTab) => void;
  unitKerjaList?: string[];
}

export const WidgetDataTableModal: React.FC<WidgetDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  type,
  items,
  actionTab,
  onNavigateToTab,
  unitKerjaList = []
}) => {
  const { currentUser } = useApp();
  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.jenisUser || '').toLowerCase() === 'pimpinan' ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedJenis, setSelectedJenis] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Single Item Detail Modal
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  // Extract unique Jenis Naskah from items
  const uniqueJenisList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.jenisNaskah) set.add(item.jenisNaskah.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Extract unique Statuses from items
  const uniqueStatusList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const s = item.statusPenyelesaian || item.statusPengiriman;
      if (s) set.add(s.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Extract unique Unit Kerja from items + unitKerjaList
  const uniqueUnitList = useMemo(() => {
    const set = new Set<string>(unitKerjaList);
    items.forEach((item) => {
      if (item.unitKerja) set.add(item.unitKerja.trim());
    });
    return Array.from(set).sort();
  }, [items, unitKerjaList]);

  // Filtered Items based on search and dropdown filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Unit filter
      if (selectedUnit !== 'ALL') {
        const u = String(item.unitKerja || '').trim().toLowerCase();
        const target = selectedUnit.trim().toLowerCase();
        if (u !== target && !u.includes(target) && !target.includes(u)) return false;
      }

      // Jenis filter
      if (selectedJenis !== 'ALL') {
        const j = String(item.jenisNaskah || '').trim().toLowerCase();
        if (j !== selectedJenis.toLowerCase()) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const s = String(item.statusPenyelesaian || item.statusPengiriman || '').trim().toLowerCase();
        if (s !== selectedStatus.toLowerCase()) return false;
      }

      // Search query across ALL information fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchStr = [
          item.nomorNaskah,
          item.perihal,
          item.pengirimNaskah,
          item.tujuanNaskah,
          item.instansiTerkait,
          item.wilayahKerja,
          item.unitKerja,
          item.jenisNaskah,
          item.klasifikasiUtama,
          item.subKlasifikasi,
          item.statusPenyelesaian,
          item.statusPengiriman,
          item.catatan,
          item.buktiKirim,
          item.createdBy,
          item.createdByName,
          item.tglNaskah,
          item.tglTerima,
          item.tglKirim
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchStr.includes(q)) return false;
      }

      return true;
    });
  }, [items, selectedUnit, selectedJenis, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / (pageSize === 0 ? filteredItems.length || 1 : pageSize)));
  const paginatedItems = useMemo(() => {
    if (pageSize === 0) return filteredItems;
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to Excel with ALL fields
  const handleExportExcel = () => {
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Tabel_Seluruh_Informasi_${cleanTitle}_${timestamp}.xlsx`;

    const exportRows = filteredItems.map((item, idx) => {
      const isMasuk = type === 'masuk' || item._type === 'Masuk' || (!item.tujuanNaskah && item.pengirimNaskah);
      const isKeluar = type === 'keluar' || item._type === 'Keluar' || (!item.pengirimNaskah && item.tujuanNaskah);

      return {
        'No': idx + 1,
        'Tipe Naskah': isMasuk ? 'Naskah Masuk' : isKeluar ? 'Naskah Keluar' : (item._type || 'Arsip'),
        'Nomor Naskah': item.nomorNaskah || '',
        'Tanggal Naskah': item.tglNaskah || '',
        'Tanggal Terima': item.tglTerima || '-',
        'Tanggal Kirim': item.tglKirim || '-',
        'Perihal': item.perihal || '',
        'Jenis Naskah Dinas': item.jenisNaskah || '',
        'Unit Kerja': item.unitKerja || '',
        'Pengirim Naskah': item.pengirimNaskah || '-',
        'Tujuan Naskah': item.tujuanNaskah || '-',
        'Instansi Terkait': item.instansiTerkait || '',
        'Wilayah Kerja': item.wilayahKerja || '',
        'Klasifikasi Utama': item.klasifikasiUtama || '',
        'Sub Klasifikasi': item.subKlasifikasi || '',
        'Status Penyelesaian': item.statusPenyelesaian || '-',
        'Status Pengiriman': item.statusPengiriman || '-',
        'SLA (Hari)': item.sla || '-',
        'Bukti Kirim': item.buktiKirim || '-',
        'Catatan': item.catatan || '-',
        'Link File Naskah Masuk': item.fileLinkNaskahMasuk || '-',
        'Link File Naskah Dijawab': item.fileLinkNaskahDijawab || '-',
        'NIP Penginput': item.createdBy || '',
        'Nama Penginput': item.createdByName || '',
        'Waktu Registrasi': item.createdAt || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Seluruh Informasi');

    // Auto-fit column widths
    const maxProps = Object.keys(exportRows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14)
    }));
    worksheet['!cols'] = maxProps;

    XLSX.writeFile(workbook, fileName);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
        <div
          className={`bg-white rounded-3xl shadow-2xl border border-emerald-300/60 flex flex-col overflow-hidden transition-all duration-300 ${
            isFullscreen ? 'w-full h-full rounded-none m-0' : 'w-full max-w-[97vw] h-[92vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between gap-4 border-b border-emerald-800/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30 shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight truncate text-white">
                    {title}
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                    Tabel Seluruh Informasi
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 truncate mt-0.5">
                  {subtitle} &bull; Total <span className="font-extrabold text-white">{items.length} Data Surat</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all border border-emerald-400/30"
                title="Ekspor Seluruh Informasi ke File Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold rounded-xl transition-all border border-white/10"
                title="Cetak Tabel"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 transition-colors"
                title={isFullscreen ? 'Kecilkan Tampilan' : 'Tampilkan Layar Penuh'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white transition-colors border border-rose-400/30"
                title="Tutup Tabel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari seluruh informasi (nomor, perihal, instansi, status, pengirim, unit...)"
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Unit Kerja Filter - Hanya terlihat untuk role admin */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-[11px] font-bold text-slate-600">Unit:</span>
                  <select
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="ALL">Semua Unit Kerja</option>
                    {uniqueUnitList.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jenis Naskah Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-xs">
                <Tag className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[11px] font-bold text-slate-600">Jenis:</span>
                <select
                  value={selectedJenis}
                  onChange={(e) => {
                    setSelectedJenis(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="ALL">Semua Jenis</option>
                  {uniqueJenisList.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-slate-600">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="ALL">Semua Status</option>
                  {uniqueStatusList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset filter button if any active */}
              {(searchQuery || selectedUnit !== 'ALL' || selectedJenis !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUnit('ALL');
                    setSelectedJenis('ALL');
                    setSelectedStatus('ALL');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Navigation Shortcut to full menu */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToTab(actionTab);
              }}
              className="text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap ml-auto"
            >
              <span>Buka Modul Form / Laporan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TABLE CONTAINER - FULL HORIZONTAL & VERTICAL SCROLL */}
          <div className="flex-1 overflow-auto bg-slate-100/60 p-3 sm:p-4">
            {filteredItems.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200">
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl mb-3">
                  <Inbox className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800">
                  Tidak Ada Data Surat Yang Cocok
                </h4>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Kriteria pencarian atau filter Anda tidak menghasilkan data apapun. Coba sesuaikan kata kunci atau bersihkan filter di atas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUnit('ALL');
                    setSelectedJenis('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  Bersihkan Filter
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[1700px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white font-extrabold uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-sm">
                        <th className="py-3 px-3.5 text-center w-12 sticky left-0 z-20 bg-emerald-900">
                          No
                        </th>
                        <th className="py-3 px-4 min-w-[200px] sticky left-12 z-20 bg-emerald-900">
                          Nomor Naskah
                        </th>
                        <th className="py-3 px-3.5 min-w-[110px]">Tipe / Kategori</th>
                        <th className="py-3 px-3.5 min-w-[130px]">Tanggal Naskah</th>
                        <th className="py-3 px-3.5 min-w-[130px]">Tanggal Terima / Kirim</th>
                        <th className="py-3 px-4 min-w-[280px]">Perihal Naskah</th>
                        <th className="py-3 px-3.5 min-w-[160px]">Jenis Naskah Dinas</th>
                        <th className="py-3 px-3.5 min-w-[180px]">Unit Kerja</th>
                        <th className="py-3 px-3.5 min-w-[180px]">Pengirim / Tujuan</th>
                        <th className="py-3 px-3.5 min-w-[180px]">Instansi Terkait</th>
                        <th className="py-3 px-3.5 min-w-[140px]">Wilayah Kerja</th>
                        <th className="py-3 px-3.5 min-w-[220px]">Klasifikasi & Sub</th>
                        <th className="py-3 px-3.5 min-w-[140px]">Status</th>
                        <th className="py-3 px-3.5 min-w-[130px]">Bukti Kirim / SLA</th>
                        <th className="py-3 px-4 min-w-[200px]">Catatan</th>
                        <th className="py-3 px-3.5 min-w-[150px] text-center">Berkas Dokumen</th>
                        <th className="py-3 px-3.5 min-w-[170px]">Penginput (User)</th>
                        <th className="py-3 px-3.5 min-w-[140px]">Waktu Input</th>
                        <th className="py-3 px-3.5 text-center min-w-[100px] sticky right-0 z-20 bg-emerald-900">
                          Aksi Detail
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedItems.map((item: any, idx: number) => {
                        const globalIndex = pageSize === 0 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                        const isMasuk = type === 'masuk' || item._type === 'Masuk' || (!item.tujuanNaskah && item.pengirimNaskah);
                        const isKeluar = type === 'keluar' || item._type === 'Keluar' || (!item.pengirimNaskah && item.tujuanNaskah);

                        const statusText = item.statusPenyelesaian || item.statusPengiriman || 'Tercatat';
                        const isDone = String(statusText).toLowerCase().includes('selesai') || String(statusText).toLowerCase().includes('terkirim') || String(statusText).toLowerCase().includes('diterima');
                        const isPending = String(statusText).toLowerCase().includes('belum') || String(statusText).toLowerCase().includes('proses');

                        return (
                          <tr
                            key={`${item.id || 'row'}-${idx}`}
                            className="hover:bg-emerald-50/50 transition-colors group"
                          >
                            {/* No */}
                            <td className="py-3 px-3.5 text-center font-bold text-slate-400 sticky left-0 z-10 bg-white group-hover:bg-emerald-50/50">
                              {globalIndex}
                            </td>

                            {/* Nomor Naskah */}
                            <td className="py-3 px-4 sticky left-12 z-10 bg-white group-hover:bg-emerald-50/50 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-950 font-extrabold">{item.nomorNaskah || '-'}</span>
                                {item.nomorNaskah && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.nomorNaskah, `no-${item.id}-${idx}`)}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                                    title="Salin Nomor Naskah"
                                  >
                                    {copiedId === `no-${item.id}-${idx}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Tipe / Kategori */}
                            <td className="py-3 px-3.5">
                              {isMasuk ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Inbox className="w-3 h-3" />
                                  <span>Masuk</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-sky-100 text-sky-800 border border-sky-300">
                                  <Send className="w-3 h-3" />
                                  <span>Keluar</span>
                                </span>
                              )}
                            </td>

                            {/* Tanggal Naskah */}
                            <td className="py-3 px-3.5 text-slate-700 font-semibold">
                              {item.tglNaskah || '-'}
                            </td>

                            {/* Tanggal Terima / Kirim */}
                            <td className="py-3 px-3.5 text-slate-700">
                              {item.tglTerima ? (
                                <div>
                                  <span className="font-bold text-emerald-800">Terima:</span> {item.tglTerima}
                                </div>
                              ) : null}
                              {item.tglKirim && item.tglKirim !== '0' && item.tglKirim !== '0000-00-00' ? (
                                <div>
                                  <span className="font-bold text-sky-800">Kirim:</span> {item.tglKirim}
                                </div>
                              ) : null}
                              {!item.tglTerima && (!item.tglKirim || item.tglKirim === '0') && (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Perihal */}
                            <td className="py-3 px-4 max-w-sm truncate text-slate-800 font-semibold" title={item.perihal}>
                              {item.perihal || '-'}
                            </td>

                            {/* Jenis Naskah Dinas */}
                            <td className="py-3 px-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                                {item.jenisNaskah || 'Surat Dinas'}
                              </span>
                            </td>

                            {/* Unit Kerja */}
                            <td className="py-3 px-3.5 font-bold text-emerald-900">
                              {item.unitKerja || '-'}
                            </td>

                            {/* Pengirim / Tujuan */}
                            <td className="py-3 px-3.5 text-slate-700 font-medium">
                              {item.pengirimNaskah ? (
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block">Pengirim:</span>
                                  {item.pengirimNaskah}
                                </div>
                              ) : null}
                              {item.tujuanNaskah ? (
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block">Tujuan:</span>
                                  {item.tujuanNaskah}
                                </div>
                              ) : null}
                              {!item.pengirimNaskah && !item.tujuanNaskah && <span className="text-slate-400">-</span>}
                            </td>

                            {/* Instansi Terkait */}
                            <td className="py-3 px-3.5 text-slate-700 font-medium">
                              {item.instansiTerkait || '-'}
                            </td>

                            {/* Wilayah Kerja */}
                            <td className="py-3 px-3.5 text-slate-600">
                              {item.wilayahKerja || '-'}
                            </td>

                            {/* Klasifikasi & Sub */}
                            <td className="py-3 px-3.5 text-slate-700">
                              <div className="font-bold text-slate-800">{item.klasifikasiUtama || '-'}</div>
                              {item.subKlasifikasi && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {item.subKlasifikasi}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 border ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : isPending
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                <span>{statusText}</span>
                              </span>
                            </td>

                            {/* Bukti Kirim / SLA */}
                            <td className="py-3 px-3.5 text-slate-700">
                              {item.sla ? (
                                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  SLA: {item.sla} Hari
                                </span>
                              ) : null}
                              {item.buktiKirim ? (
                                <a
                                  href={item.buktiKirim}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Bukti Kirim</span>
                                </a>
                              ) : null}
                              {!item.sla && !item.buktiKirim && <span className="text-slate-400">-</span>}
                            </td>

                            {/* Catatan */}
                            <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={item.catatan}>
                              {item.catatan || '-'}
                            </td>

                            {/* Berkas Dokumen */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {item.fileLinkNaskahMasuk && (
                                  <a
                                    href={item.fileLinkNaskahMasuk}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200"
                                    title="Buka Dokumen Naskah Masuk / Referensi"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Naskah</span>
                                  </a>
                                )}
                                {item.fileLinkNaskahDijawab && (
                                  <a
                                    href={item.fileLinkNaskahDijawab}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200"
                                    title="Buka Dokumen Surat Dijawab / Terkirim"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Jawaban</span>
                                  </a>
                                )}
                                {!item.fileLinkNaskahMasuk && !item.fileLinkNaskahDijawab && (
                                  <span className="text-slate-300">-</span>
                                )}
                              </div>
                            </td>

                            {/* Penginput */}
                            <td className="py-3 px-3.5 text-slate-700">
                              <div className="font-bold text-slate-800">{item.createdByName || '-'}</div>
                              {item.createdBy && (
                                <div className="text-[10px] text-slate-400 font-medium">NIP: {item.createdBy}</div>
                              )}
                            </td>

                            {/* Waktu Registrasi */}
                            <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                              {item.createdAt || '-'}
                            </td>

                            {/* Aksi Detail */}
                            <td className="py-3 px-3.5 text-center sticky right-0 z-10 bg-white group-hover:bg-emerald-50/50">
                              <button
                                type="button"
                                onClick={() => setSelectedItemDetail(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shadow-xs transition-all"
                                title="Lihat Seluruh Informasi Detail Record Ini"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Pagination Bar */}
          <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <span>
                Menampilkan{' '}
                <strong className="text-emerald-900 font-black">
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                -{' '}
                <strong className="text-emerald-900 font-black">
                  {pageSize === 0 ? filteredItems.length : Math.min(currentPage * pageSize, filteredItems.length)}
                </strong>{' '}
                dari <strong className="text-slate-900 font-black">{filteredItems.length}</strong> Data
                {filteredItems.length !== items.length && ` (disaring dari total ${items.length})`}
              </span>

              {/* Page Size Selector */}
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-[11px] text-slate-500">Per baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-100 rounded-lg border border-slate-300 font-bold px-2 py-0.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>Semua</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && pageSize !== 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-slate-800 text-xs">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Close Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs transition-colors"
              >
                Tutup Tabel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP CARD FOR SINGLE ITEM COMPLETE FIELD INSPECTION */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-300 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    Detail Seluruh Informasi Surat
                  </h4>
                  <p className="text-xs text-emerald-200">
                    Nomor: <span className="font-bold text-white">{selectedItemDetail.nomorNaskah || '-'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nomor Naskah
                  </span>
                  <span className="text-sm font-extrabold text-emerald-950 block mt-0.5">
                    {selectedItemDetail.nomorNaskah || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jenis Naskah Dinas
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                    {selectedItemDetail.jenisNaskah || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Perihal Naskah
                  </span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {selectedItemDetail.perihal || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Unit Kerja Pengelola
                  </span>
                  <span className="text-xs font-bold text-emerald-900 block mt-0.5">
                    {selectedItemDetail.unitKerja || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status Dokumen
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.statusPenyelesaian || selectedItemDetail.statusPengiriman || '-'}
                  </span>
                </div>

                {selectedItemDetail.pengirimNaskah && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pengirim Naskah
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedItemDetail.pengirimNaskah}
                    </span>
                  </div>
                )}

                {selectedItemDetail.tujuanNaskah && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tujuan Naskah
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedItemDetail.tujuanNaskah}
                    </span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Instansi Terkait & Wilayah
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.instansiTerkait || '-'} ({selectedItemDetail.wilayahKerja || '-'})
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Klasifikasi & Sub Klasifikasi
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.klasifikasiUtama || '-'} &bull; {selectedItemDetail.subKlasifikasi || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tanggal Naskah
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.tglNaskah || '-'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tanggal Terima / Kirim
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    Terima: {selectedItemDetail.tglTerima || '-'} | Kirim: {selectedItemDetail.tglKirim || '-'}
                  </span>
                </div>

                {selectedItemDetail.sla && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target SLA
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedItemDetail.sla} Hari Kerja
                    </span>
                  </div>
                )}

                {selectedItemDetail.buktiKirim && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Bukti Pengiriman
                    </span>
                    <a
                      href={selectedItemDetail.buktiKirim}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>Buka Bukti Pengiriman</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {selectedItemDetail.catatan && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 md:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Catatan
                    </span>
                    <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {selectedItemDetail.catatan}
                    </p>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Operator / Penginput
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.createdByName || '-'} ({selectedItemDetail.createdBy || '-'})
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Waktu Registrasi Sistem
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {selectedItemDetail.createdAt || '-'}
                  </span>
                </div>
              </div>

              {/* Document Link previews */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="font-extrabold text-emerald-950 text-xs">Berkas Dokumen Terlampir</h5>
                  <p className="text-[11px] text-emerald-700">Tersimpan di Cloud Storage / Google Drive</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedItemDetail.fileLinkNaskahMasuk && (
                    <a
                      href={selectedItemDetail.fileLinkNaskahMasuk}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Berkas Dokumen</span>
                    </a>
                  )}
                  {selectedItemDetail.fileLinkNaskahDijawab && (
                    <a
                      href={selectedItemDetail.fileLinkNaskahDijawab}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Surat Jawaban</span>
                    </a>
                  )}
                  {!selectedItemDetail.fileLinkNaskahMasuk && !selectedItemDetail.fileLinkNaskahDijawab && (
                    <span className="text-xs text-slate-400 italic">Tidak ada tautan file terlampir</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
