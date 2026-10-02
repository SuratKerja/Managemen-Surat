import React, { useState, useMemo, useRef } from 'react';
import {
  Archive,
  Download,
  Printer,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  FolderOpen,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { BerkasThread, NaskahMasukItem, NaskahKeluarItem } from '../types';

export interface ArsipAktifRowItem {
  noItemArsip: number | string;
  uraianInformasiArsip: string;
  tanggal: string;
  jenisNaskah: string;
  nomorNaskah: string;
  perihal: string;
  instansi: string;
  type: 'masuk' | 'keluar' | 'berkas_only';
  rawNaskah?: NaskahMasukItem | NaskahKeluarItem;
}

export interface BerkasGroupItem {
  threadId: string;
  nomorThread: string;
  noBerkas: number; // Nomor urut berdasarkan kode arsip yang sama
  urutanGlobal: number;
  kodeKlasifikasi: string;
  namaKlasifikasiArsip?: string;
  uraianInformasiBerkas: string;
  kurunWaktu: string; // Tahun timestamp thread dibuat
  jumlahBerkas: number; // Jumlah naskah yang masuk dalam satu thread
  jumlahBerkasLabel: string;
  lokasiSimpan: string; // Lokasi fisik berkas
  status: string;
  unitKerja: string;
  createdAt: string;
  items: ArsipAktifRowItem[];
}

export const DaftarArsipAktifView: React.FC = () => {
  const {
    berkasThreadList,
    naskahMasukList,
    naskahKeluarList,
    klasifikasiArsipList,
    unitKerjaList,
    currentUser,
    setActiveTab,
    showToast
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // User role check
  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.jenisUser || '').toLowerCase() === 'pimpinan' ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKodeKlasifikasi, setFilterKodeKlasifikasi] = useState('ALL');
  const [filterKurunWaktu, setFilterKurunWaktu] = useState('ALL');
  const [filterUnitKerja, setFilterUnitKerja] = useState<string>(() => {
    return isAdmin ? 'ALL' : currentUser?.unitKerja || 'ALL';
  });
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Preview / Detail Modal State
  const [selectedThreadForPreview, setSelectedThreadForPreview] = useState<BerkasGroupItem | null>(null);

  // Show / Hide toggle state for Berkas Item Rows (mencegah daftar uraian item arsip terlalu panjang ke bawah)
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set());
  const [expandAllThreads, setExpandAllThreads] = useState(false);

  const toggleExpandThread = (threadId: string) => {
    setExpandedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const toggleExpandAllThreads = () => {
    if (expandAllThreads) {
      setExpandedThreadIds(new Set());
      setExpandAllThreads(false);
    } else {
      const allIds = new Set(processedBerkasGroups.map((g) => g.threadId));
      setExpandedThreadIds(allIds);
      setExpandAllThreads(true);
    }
  };

  // Available Years from threads
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    berkasThreadList.forEach((t) => {
      if (t.createdAt) {
        try {
          const yr = new Date(t.createdAt).getFullYear().toString();
          if (yr && !isNaN(Number(yr))) years.add(yr);
        } catch {
          // ignore
        }
      }
    });
    const arr = Array.from(years).sort((a, b) => b.localeCompare(a));
    if (arr.length === 0) {
      arr.push(new Date().getFullYear().toString());
    }
    return arr;
  }, [berkasThreadList]);

  // Available Kode Klasifikasi
  const availableKodeKlasifikasi = useMemo(() => {
    const kodes = new Set<string>();
    klasifikasiArsipList.forEach((k) => {
      if (k.kodeKlasifikasi) kodes.add(k.kodeKlasifikasi);
    });
    berkasThreadList.forEach((t) => {
      if (t.kodeKlasifikasi) kodes.add(t.kodeKlasifikasi);
    });
    return Array.from(kodes).sort();
  }, [klasifikasiArsipList, berkasThreadList]);

  // Fast O(1) lookup maps
  const masukMap = useMemo(() => {
    const map = new Map<string, NaskahMasukItem>();
    naskahMasukList.forEach((m) => map.set(m.id, m));
    return map;
  }, [naskahMasukList]);

  const keluarMap = useMemo(() => {
    const map = new Map<string, NaskahKeluarItem>();
    naskahKeluarList.forEach((k) => map.set(k.id, k));
    return map;
  }, [naskahKeluarList]);

  // Process and group threads into ANRI Daftar Arsip Aktif structure
  const processedBerkasGroups = useMemo(() => {
    // 1. Filter threads by Unit, Status, Kurun Waktu, Kode Klasifikasi, Search
    const filtered = berkasThreadList.filter((thread) => {
      // Unit Kerja filter
      if (!isAdmin && currentUser?.unitKerja) {
        if (thread.unitKerja && thread.unitKerja !== currentUser.unitKerja) return false;
      } else if (filterUnitKerja !== 'ALL') {
        if (thread.unitKerja !== filterUnitKerja) return false;
      }

      // Status Filter
      if (filterStatus !== 'ALL') {
        if (thread.status !== filterStatus) return false;
      }

      // Kode Klasifikasi Filter
      if (filterKodeKlasifikasi !== 'ALL') {
        if (thread.kodeKlasifikasi !== filterKodeKlasifikasi) return false;
      }

      // Kurun Waktu (Tahun) Filter
      if (filterKurunWaktu !== 'ALL') {
        const threadYear = thread.createdAt ? new Date(thread.createdAt).getFullYear().toString() : '';
        if (threadYear !== filterKurunWaktu) return false;
      }

      return true;
    });

    // 2. Sort primary by Kode Klasifikasi ascending, then createdAt ascending
    const sorted = [...filtered].sort((a, b) => {
      const kodeA = (a.kodeKlasifikasi || '').toUpperCase();
      const kodeB = (b.kodeKlasifikasi || '').toUpperCase();
      if (kodeA !== kodeB) return kodeA.localeCompare(kodeB);

      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateA.localeCompare(dateB);
    });

    // 3. Numbering NO BERKAS (Nomor Urut berdasarkan kode arsip yang sama)
    const counterPerKode: { [kode: string]: number } = {};
    const result: BerkasGroupItem[] = [];

    sorted.forEach((thread, globalIdx) => {
      const kode = thread.kodeKlasifikasi || 'LAINNYA';
      if (!counterPerKode[kode]) {
        counterPerKode[kode] = 1;
      } else {
        counterPerKode[kode] += 1;
      }
      const noBerkas = counterPerKode[kode];

      // Extract Year
      let kurunWaktu = '-';
      if (thread.createdAt) {
        try {
          const yr = new Date(thread.createdAt).getFullYear().toString();
          if (yr && !isNaN(Number(yr))) kurunWaktu = yr;
        } catch {
          kurunWaktu = thread.createdAt.slice(0, 4);
        }
      }

      // Collect all linked naskah items
      const naskahItems: ArsipAktifRowItem[] = [];

      // Linked Naskah Masuk
      (thread.naskahMasukIds || []).forEach((id) => {
        const found = masukMap.get(id);
        if (found) {
          naskahItems.push({
            noItemArsip: 0, // will be numbered chronologically below
            uraianInformasiArsip: `${found.perihal || 'Naskah Masuk'} dengan nomor surat ${found.nomorNaskah || '-'}`,
            tanggal: found.tglNaskah || found.tglTerima || '-',
            jenisNaskah: found.jenisNaskah || 'Masuk',
            nomorNaskah: found.nomorNaskah || '-',
            perihal: found.perihal || '-',
            instansi: found.instansiTerkait || found.pengirimNaskah || '-',
            type: 'masuk',
            rawNaskah: found
          });
        }
      });

      // Linked Naskah Keluar
      (thread.naskahKeluarIds || []).forEach((id) => {
        const found = keluarMap.get(id);
        if (found) {
          naskahItems.push({
            noItemArsip: 0,
            uraianInformasiArsip: `${found.perihal || 'Naskah Keluar'} dengan nomor surat ${found.nomorNaskah || '-'}`,
            tanggal: found.tglNaskah || found.tglKirim || '-',
            jenisNaskah: found.jenisNaskah || 'Keluar',
            nomorNaskah: found.nomorNaskah || '-',
            perihal: found.perihal || '-',
            instansi: found.instansiTerkait || found.tujuanNaskah || '-',
            type: 'keluar',
            rawNaskah: found
          });
        }
      });

      // Sort naskah items by tanggal
      naskahItems.sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

      // Assign Nomor Item Arsip (1, 2, 3...)
      naskahItems.forEach((item, itemIdx) => {
        item.noItemArsip = itemIdx + 1;
      });

      // If no naskah linked yet, provide 1 default entry
      if (naskahItems.length === 0) {
        naskahItems.push({
          noItemArsip: 1,
          uraianInformasiArsip: `${thread.namaBerkas}${thread.keterangan ? ` - ${thread.keterangan}` : ''} dengan nomor surat (Dalam Proses Pemberkasan)`,
          tanggal: thread.createdAt ? thread.createdAt.slice(0, 10) : '-',
          jenisNaskah: 'Berkas',
          nomorNaskah: thread.nomorThread || '-',
          perihal: thread.namaBerkas,
          instansi: thread.unitKerja || '-',
          type: 'berkas_only'
        });
      }

      const totalNaskahCount = (thread.naskahMasukIds?.length || 0) + (thread.naskahKeluarIds?.length || 0);

      const groupItem: BerkasGroupItem = {
        threadId: thread.id,
        nomorThread: thread.nomorThread,
        noBerkas,
        urutanGlobal: globalIdx + 1,
        kodeKlasifikasi: thread.kodeKlasifikasi || '-',
        namaKlasifikasiArsip: thread.namaKlasifikasiArsip || '',
        uraianInformasiBerkas: thread.namaBerkas,
        kurunWaktu,
        jumlahBerkas: totalNaskahCount,
        jumlahBerkasLabel: `${totalNaskahCount} Naskah`,
        lokasiSimpan: thread.lokasiFisik || 'Boks Arsip Aktif',
        status: thread.status,
        unitKerja: thread.unitKerja || 'Semua Unit',
        createdAt: thread.createdAt,
        items: naskahItems
      };

      // Search matching: test against thread or items
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchThread =
          groupItem.uraianInformasiBerkas.toLowerCase().includes(q) ||
          groupItem.kodeKlasifikasi.toLowerCase().includes(q) ||
          groupItem.lokasiSimpan.toLowerCase().includes(q) ||
          groupItem.nomorThread.toLowerCase().includes(q) ||
          groupItem.unitKerja.toLowerCase().includes(q);

        const matchItem = groupItem.items.some(
          (it) =>
            it.uraianInformasiArsip.toLowerCase().includes(q) ||
            it.nomorNaskah.toLowerCase().includes(q) ||
            it.perihal.toLowerCase().includes(q) ||
            it.tanggal.includes(q)
        );

        if (matchThread || matchItem) {
          result.push(groupItem);
        }
      } else {
        result.push(groupItem);
      }
    });

    return result;
  }, [
    berkasThreadList,
    masukMap,
    keluarMap,
    isAdmin,
    currentUser,
    filterUnitKerja,
    filterStatus,
    filterKodeKlasifikasi,
    filterKurunWaktu,
    searchQuery
  ]);

  // Overall statistics
  const totalBerkasCount = processedBerkasGroups.length;
  const totalItemNaskahCount = useMemo(() => {
    return processedBerkasGroups.reduce((acc, curr) => acc + (curr.jumlahBerkas || curr.items.length), 0);
  }, [processedBerkasGroups]);

  const uniqueKodeCount = useMemo(() => {
    const s = new Set(processedBerkasGroups.map((b) => b.kodeKlasifikasi));
    return s.size;
  }, [processedBerkasGroups]);

  // Active Unit Kerja Name display
  const activeUnitKerjaDisplay = useMemo(() => {
    if (!isAdmin) {
      return (currentUser?.unitKerja || 'SEKRETARIAT UTAMA').toUpperCase();
    }
    if (filterUnitKerja === 'ALL') {
      return 'SEMUA UNIT KERJA';
    }
    return filterUnitKerja.toUpperCase();
  }, [isAdmin, currentUser, filterUnitKerja]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterKodeKlasifikasi('ALL');
    setFilterKurunWaktu('ALL');
    setFilterStatus('ALL');
    if (isAdmin) {
      setFilterUnitKerja('ALL');
    }
    showToast('Filter telah direset ke pengaturan awal', 'info');
  };

  // =========================================================================
  // EXPORT EXCEL (.xlsx)
  // =========================================================================
  const handleDownloadExcel = () => {
    try {
      if (processedBerkasGroups.length === 0) {
        showToast('Tidak ada data arsip untuk diunduh', 'error');
        return;
      }

      const rowsAOA: any[][] = [];

      // 1. Header Metadata Laporan
      rowsAOA.push(['DAFTAR ARSIP AKTIF']);
      rowsAOA.push([`UNIT PENGOLAH / UNIT KERJA: ${activeUnitKerjaDisplay}`]);
      rowsAOA.push([
        `KURUN WAKTU: ${filterKurunWaktu === 'ALL' ? 'SEMUA TAHUN' : `TAHUN ${filterKurunWaktu}`} | KODE KLASIFIKASI: ${filterKodeKlasifikasi === 'ALL' ? 'SEMUA KODE' : filterKodeKlasifikasi}`
      ]);
      rowsAOA.push([`TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`]);
      rowsAOA.push([]); // empty line

      // 2. Table Headers (Sesuai 9 Kolom Permintaan Pengguna)
      rowsAOA.push([
        'NO BERKAS',
        'KODE KLASIFIKASI',
        'URAIAN INFORMASI BERKAS',
        'KURUN WAKTU',
        'JUMLAH BERKAS',
        'NOMOR ITEM ARSIP',
        'URAIAN INFORMASI ARSIP',
        'TANGGAL',
        'KET. LOKASI SIMPAN'
      ]);

      // 3. Populate Data Rows
      processedBerkasGroups.forEach((group) => {
        group.items.forEach((item, idx) => {
          rowsAOA.push([
            idx === 0 ? group.noBerkas : '',
            idx === 0 ? group.kodeKlasifikasi : '',
            idx === 0 ? group.uraianInformasiBerkas : '',
            idx === 0 ? group.kurunWaktu : '',
            idx === 0 ? `${group.jumlahBerkas} Naskah` : '',
            item.noItemArsip,
            item.uraianInformasiArsip,
            item.tanggal,
            idx === 0 ? group.lokasiSimpan : ''
          ]);
        });
      });

      // 4. Create Workbook and Sheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rowsAOA);

      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // NO BERKAS
        { wch: 18 }, // KODE KLASIFIKASI
        { wch: 38 }, // URAIAN INFORMASI BERKAS
        { wch: 14 }, // KURUN WAKTU
        { wch: 16 }, // JUMLAH BERKAS
        { wch: 18 }, // NOMOR ITEM ARSIP
        { wch: 60 }, // URAIAN INFORMASI ARSIP
        { wch: 16 }, // TANGGAL
        { wch: 25 }  // KET. LOKASI SIMPAN
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Daftar Arsip Aktif');

      const fileDateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `DAFTAR_ARSIP_AKTIF_${activeUnitKerjaDisplay.replace(/\s+/g, '_')}_${fileDateStr}.xlsx`);
      showToast('File Excel Daftar Arsip Aktif berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Error export Excel:', err);
      showToast('Gagal membuat file Excel', 'error');
    }
  };

  // =========================================================================
  // EXPORT PDF (UKURAN FOLIO LANDSCAPE: 215mm x 330mm)
  // =========================================================================
  const handleDownloadPDF = () => {
    try {
      if (processedBerkasGroups.length === 0) {
        showToast('Tidak ada data arsip untuk diunduh', 'error');
        return;
      }

      // Folio / F4 paper in landscape:
      // Width: 330 mm, Height: 215 mm
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [215, 330]
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      // 1. Header Judul Laporan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(6, 78, 59); // Emerald-900
      doc.text('DAFTAR ARSIP AKTIF', pageWidth / 2, 14, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(
        `UNIT PENGOLAH / UNIT KERJA: ${activeUnitKerjaDisplay}`,
        pageWidth / 2,
        20,
        { align: 'center' }
      );

      const periodDesc =
        filterKurunWaktu === 'ALL'
          ? 'SEMUA KURUN WAKTU / TAHUN'
          : `KURUN WAKTU: TAHUN ${filterKurunWaktu}`;
      const kodeDesc =
        filterKodeKlasifikasi === 'ALL'
          ? 'SEMUA KODE KLASIFIKASI'
          : `KODE: ${filterKodeKlasifikasi}`;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        `${periodDesc}  |  ${kodeDesc}  |  Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        pageWidth / 2,
        25,
        { align: 'center' }
      );

      // Garis pemisah kop
      doc.setDrawColor(16, 185, 129); // Emerald-500
      doc.setLineWidth(0.6);
      doc.line(margin, 28, pageWidth - margin, 28);

      // 2. Prepare autotable body with native rowSpan
      const tableBody: any[] = [];

      processedBerkasGroups.forEach((group) => {
        const rowSpan = group.items.length;

        group.items.forEach((item, idx) => {
          if (idx === 0) {
            tableBody.push([
              { content: String(group.noBerkas), rowSpan, styles: { halign: 'center', fontStyle: 'bold' } },
              { content: String(group.kodeKlasifikasi || '-'), rowSpan, styles: { halign: 'center', fontStyle: 'bold' } },
              { content: String(group.uraianInformasiBerkas || '-'), rowSpan, styles: { fontStyle: 'bold' } },
              { content: String(group.kurunWaktu || '-'), rowSpan, styles: { halign: 'center' } },
              { content: `${group.jumlahBerkas} Naskah`, rowSpan, styles: { halign: 'center' } },
              { content: String(item.noItemArsip), styles: { halign: 'center' } },
              { content: String(item.uraianInformasiArsip || '-') },
              { content: String(item.tanggal || '-'), styles: { halign: 'center' } },
              { content: String(group.lokasiSimpan || '-'), rowSpan, styles: { fontStyle: 'normal' } }
            ]);
          } else {
            tableBody.push([
              { content: String(item.noItemArsip), styles: { halign: 'center' } },
              { content: String(item.uraianInformasiArsip || '-') },
              { content: String(item.tanggal || '-'), styles: { halign: 'center' } }
            ]);
          }
        });
      });

      // 3. Render Table on Folio Landscape using autoTable function
      autoTable(doc, {
        startY: 31,
        margin: { left: margin, right: margin, bottom: 14 },
        head: [
          [
            'NO BERKAS',
            'KODE KLASIFIKASI',
            'URAIAN INFORMASI BERKAS',
            'KURUN WAKTU',
            'JUMLAH BERKAS',
            'NOMOR ITEM ARSIP',
            'URAIAN INFORMASI ARSIP',
            'TANGGAL',
            'KET. LOKASI SIMPAN'
          ]
        ],
        body: tableBody,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          cellPadding: 2,
          valign: 'top',
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [6, 78, 59], // emerald-900
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' }, // NO BERKAS
          1: { cellWidth: 26, halign: 'center' }, // KODE KLASIFIKASI
          2: { cellWidth: 50 },                   // URAIAN INFORMASI BERKAS
          3: { cellWidth: 20, halign: 'center' }, // KURUN WAKTU
          4: { cellWidth: 22, halign: 'center' }, // JUMLAH BERKAS
          5: { cellWidth: 18, halign: 'center' }, // NOMOR ITEM ARSIP
          6: { cellWidth: 96 },                   // URAIAN INFORMASI ARSIP
          7: { cellWidth: 26, halign: 'center' }, // TANGGAL
          8: { cellWidth: 32 }                    // KET. LOKASI SIMPAN
        },
        didDrawPage: (data: any) => {
          // Footer Page Number
          const totalPages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : data.pageNumber;
          const pageStr = `Halaman ${data.pageNumber} dari ${totalPages}`;
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(pageStr, pageWidth - margin, pageHeight - 6, { align: 'right' });
          doc.text(
            'Format: Kertas Folio (F4) Landscape - Arsip Aktif Management Surat',
            margin,
            pageHeight - 6
          );
        }
      });

      const fileDateStr = new Date().toISOString().slice(0, 10);
      const safeUnit = activeUnitKerjaDisplay.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`DAFTAR_ARSIP_AKTIF_${safeUnit}_${fileDateStr}.pdf`);
      showToast('File PDF Daftar Arsip Aktif (Folio Landscape) berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Error export PDF:', err);
      showToast('Gagal membuat file PDF', 'error');
    }
  };

  // =========================================================================
  // PRINT PREVIEW LANGSUNG
  // =========================================================================
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              DAFTAR ARSIP AKTIF
            </h2>
          </div>

          {/* Action Buttons: Download Excel & PDF Folio Landscape */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadExcel}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-emerald-200"
              title="Download Data Format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Download Excel</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all border border-emerald-400/40 flex items-center gap-2 cursor-pointer"
              title="Download Dokumen PDF Ukuran Kertas Folio Landscape"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF (Folio Landscape)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Bar Inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/50">
          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-600/30">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              Total Berkas Aktif
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
              {totalBerkasCount} <span className="text-xs font-semibold text-emerald-300">Berkas</span>
            </span>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-600/30">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              Total Item Naskah
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5 block">
              {totalItemNaskahCount} <span className="text-xs font-semibold text-emerald-200">Naskah</span>
            </span>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-600/30">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              Kode Klasifikasi
            </span>
            <span className="text-xl sm:text-2xl font-black text-teal-300 mt-0.5 block">
              {uniqueKodeCount} <span className="text-xs font-semibold text-emerald-200">Kategori</span>
            </span>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-600/30">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              Unit Kerja Pengolah
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1 block truncate" title={activeUnitKerjaDisplay}>
              {activeUnitKerjaDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 space-y-4">
        {/* Header Filter Card */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>Filter & Pencarian Daftar Arsip Aktif</span>
          </h3>
        </div>

        {/* Persis di Bawah Header: Baris Status Berkas & Tombol Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Status Berkas:</span>
            {['ALL', 'Aktif', 'Proses', 'Selesai'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          {(searchQuery || filterKodeKlasifikasi !== 'ALL' || filterKurunWaktu !== 'ALL' || filterStatus !== 'ALL' || (isAdmin && filterUnitKerja !== 'ALL')) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pencarian Arsip
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berkas, perihal, nomor surat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 text-xs font-semibold focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Filter Kurun Waktu (Tahun) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kurun Waktu (Tahun)</span>
            </label>
            <select
              value={filterKurunWaktu}
              onChange={(e) => setFilterKurunWaktu(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kurun Waktu (Tahun)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kode Klasifikasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Kode Klasifikasi Arsip</span>
            </label>
            <select
              value={filterKodeKlasifikasi}
              onChange={(e) => setFilterKodeKlasifikasi(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kode Klasifikasi</option>
              {availableKodeKlasifikasi.map((kode) => (
                <option key={kode} value={kode}>
                  {kode}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Unit Kerja (Admin Only dropdown, user locked) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unit Pengolah / Kerja</span>
            </label>

            {isAdmin ? (
              <select
                value={filterUnitKerja}
                onChange={(e) => setFilterUnitKerja(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Unit Kerja</option>
                {unitKerjaList.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full py-2 px-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 truncate">
                {currentUser?.unitKerja || 'Unit Kerja Anda'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table: DAFTAR ARSIP AKTIF */}
      <div
        ref={printAreaRef}
        className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden print:border-none print:shadow-none"
      >
        {/* Table Title Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-5 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-xl border border-emerald-400/30">
              <Archive className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">
                DAFTAR ARSIP AKTIF
              </h3>
              <p className="text-xs text-emerald-200">
                Unit Pengolah: <span className="font-bold text-white">{activeUnitKerjaDisplay}</span> • Total {totalBerkasCount} Berkas Terdaftar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleExpandAllThreads}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer border border-emerald-200"
              title="Buka atau ringkas seluruh daftar uraian item arsip"
            >
              {expandAllThreads ? (
                <>
                  <ChevronUp className="w-4 h-4 text-emerald-700" />
                  <span>Hide All (Ringkas 1 Baris Per Berkas)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-emerald-700" />
                  <span>Show All (Buka Semua Item Arsip)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider border-b-2 border-emerald-600">
                <th className="py-3 px-3 border border-slate-200 text-center w-14">
                  NO BERKAS
                </th>
                <th className="py-3 px-3 border border-slate-200 text-center w-28">
                  KODE KLASIFIKASI
                </th>
                <th className="py-3 px-4 border border-slate-200 min-w-[200px]">
                  URAIAN INFORMASI BERKAS
                </th>
                <th className="py-3 px-3 border border-slate-200 text-center w-20">
                  KURUN WAKTU
                </th>
                <th className="py-3 px-3 border border-slate-200 text-center w-24">
                  JUMLAH BERKAS
                </th>
                <th className="py-3 px-3 border border-slate-200 text-center w-20">
                  NOMOR ITEM ARSIP
                </th>
                <th className="py-3 px-4 border border-slate-200 min-w-[320px]">
                  URAIAN INFORMASI ARSIP
                </th>
                <th className="py-3 px-3 border border-slate-200 text-center w-28">
                  TANGGAL
                </th>
                <th className="py-3 px-4 border border-slate-200 w-36">
                  KET. LOKASI SIMPAN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedBerkasGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">
                      Tidak ada data berkas arsip aktif yang sesuai filter.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Silakan sesuaikan filter pencarian atau buat berkas thread baru pada menu Pemberkasan.
                    </p>
                  </td>
                </tr>
              ) : (
                processedBerkasGroups.map((group) => {
                  const isExpanded = expandAllThreads || expandedThreadIds.has(group.threadId);
                  const hasMultipleItems = group.items.length > 1;
                  // Saat tidak di-expand, hanya tampilkan item pertama agar daftar tidak memanjang ke bawah
                  const visibleItems = isExpanded || !hasMultipleItems ? group.items : group.items.slice(0, 1);
                  const rowSpan = visibleItems.length;

                  return visibleItems.map((item, itemIdx) => {
                    const isFirstItem = itemIdx === 0;
                    const isLastVisibleItem = itemIdx === visibleItems.length - 1;

                    return (
                      <tr
                        key={`${group.threadId}-${itemIdx}`}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          isFirstItem ? 'border-t-2 border-emerald-200' : ''
                        }`}
                      >
                        {/* 1. NO BERKAS (Nomor Urut berdasarkan kode arsip yang sama) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-3 border border-slate-200 text-center font-black text-emerald-950 bg-slate-50/70 align-top"
                          >
                            <span className="inline-block px-2 py-0.5 bg-emerald-100/80 text-emerald-900 rounded font-black text-xs">
                              {group.noBerkas}
                            </span>
                          </td>
                        )}

                        {/* 2. KODE KLASIFIKASI (kode arsip) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-3 border border-slate-200 text-center font-extrabold text-slate-800 bg-slate-50/40 align-top whitespace-nowrap"
                          >
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold block">
                              {group.kodeKlasifikasi}
                            </span>
                            {group.namaKlasifikasiArsip && (
                              <span className="text-[10px] text-slate-500 block mt-1 font-normal leading-tight max-w-[140px] mx-auto truncate" title={group.namaKlasifikasiArsip}>
                                {group.namaKlasifikasiArsip}
                              </span>
                            )}
                          </td>
                        )}

                        {/* 3. URAIAN INFORMASI BERKAS (nama berkas) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-4 border border-slate-200 font-bold text-slate-900 align-top leading-relaxed"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span>{group.uraianInformasiBerkas}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedThreadForPreview(group)}
                                className="text-emerald-700 hover:text-emerald-900 p-1 rounded hover:bg-emerald-100 transition-colors shrink-0"
                                title="Lihat Rincian Berkas Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                              ID: {group.nomorThread} • Unit: {group.unitKerja}
                            </span>
                          </td>
                        )}

                        {/* 4. KURUN WAKTU (Tahun timestamp thread dibuat) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-3 border border-slate-200 text-center font-bold text-slate-700 align-top bg-slate-50/40"
                          >
                            {group.kurunWaktu}
                          </td>
                        )}

                        {/* 5. JUMLAH BERKAS (jumlah naskah yang masuk dalam satu thread) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-3 border border-slate-200 text-center font-extrabold text-emerald-800 align-top bg-slate-50/40 whitespace-nowrap"
                          >
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold inline-block">
                              {group.jumlahBerkas} Naskah
                            </span>
                          </td>
                        )}

                        {/* 6. NOMOR ITEM ARSIP (Nomor urut dari masing-masing naskah) */}
                        <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-700 bg-white">
                          {item.noItemArsip}
                        </td>

                        {/* 7. URAIAN INFORMASI ARSIP (Perihal ditambah kalimat "dengan nomor surat (Nomor Naskah)") */}
                        <td className="py-2.5 px-4 border border-slate-200 text-slate-800 leading-relaxed bg-white">
                          <span className="font-medium">{item.uraianInformasiArsip}</span>
                          {item.type !== 'berkas_only' && (
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                item.type === 'masuk'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}>
                                {item.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                              </span>
                              <span>• Instansi: <strong className="text-slate-700">{item.instansi}</strong></span>
                            </div>
                          )}

                          {/* Tombol Show / Hide Daftar Item Arsip agar tidak memanjang ke bawah */}
                          {hasMultipleItems && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              {!isExpanded && isFirstItem && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandThread(group.threadId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                  title="Tampilkan seluruh daftar item arsip yang ada di bawah berkas ini"
                                >
                                  <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Show (+{group.items.length - 1} item arsip lainnya)</span>
                                </button>
                              )}

                              {isExpanded && isLastVisibleItem && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandThread(group.threadId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                  title="Sembunyikan dan ringkas kembali daftar item arsip"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Hide (Sembunyikan daftar item arsip)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 8. TANGGAL (Tanggal dari masing-masing naskah) */}
                        <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-600 font-semibold whitespace-nowrap bg-white">
                          {item.tanggal}
                        </td>

                        {/* 9. KET. LOKASI SIMPAN (lokasi fisik berkas) */}
                        {isFirstItem && (
                          <td
                            rowSpan={rowSpan}
                            className="py-3 px-4 border border-slate-200 font-semibold text-slate-700 align-top bg-slate-50/30"
                          >
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{group.lokasiSimpan}</span>
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Status: {group.status}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan <strong className="text-emerald-900">{totalBerkasCount}</strong> Berkas Arsip Aktif
            </span>
            <span>•</span>
            <span>
              Akumulasi <strong className="text-emerald-900">{totalItemNaskahCount}</strong> Item Naskah Dinas Terkait
            </span>
          </div>
        </div>
      </div>

      {/* Detail / Quick Preview Modal for a Berkas */}
      {selectedThreadForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Rincian Berkas Arsip Aktif
                </span>
                <h4 className="text-base font-extrabold mt-0.5">
                  {selectedThreadForPreview.uraianInformasiBerkas}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedThreadForPreview(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block">No Berkas</span>
                  <span className="text-base font-black text-emerald-900 block mt-0.5">
                    {selectedThreadForPreview.noBerkas}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Kode Klasifikasi</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">
                    {selectedThreadForPreview.kodeKlasifikasi}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Kurun Waktu</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">
                    {selectedThreadForPreview.kurunWaktu}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Lokasi Simpan Fisik</span>
                  <span className="font-extrabold text-amber-900 block mt-0.5">
                    {selectedThreadForPreview.lokasiSimpan}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-extrabold text-sm text-slate-800 mb-2">
                  Daftar Item Naskah Dalam Berkas Ini ({selectedThreadForPreview.items.length} Item)
                </h5>
                <div className="space-y-2">
                  {selectedThreadForPreview.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shrink-0 text-xs">
                        {it.noItemArsip}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{it.uraianInformasiArsip}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>Tanggal: <strong className="text-slate-700">{it.tanggal}</strong></span>
                          <span>•</span>
                          <span>Jenis: <strong className="text-slate-700">{it.jenisNaskah}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedThreadForPreview(null);
                  setActiveTab('pemberkasan');
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Buka di Menu Pemberkasan Thread</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedThreadForPreview(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
