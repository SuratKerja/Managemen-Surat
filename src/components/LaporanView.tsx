import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Inbox,
  Send,
  Printer,
  Table as TableIcon,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SearchableSelect } from './SearchableSelect';
import { DatePicker } from './DatePicker';

export const LaporanView: React.FC = () => {
  const {
    naskahMasukList,
    naskahKeluarList,
    jenisNaskahMasuk,
    jenisNaskahKeluar,
    instansiWilayah,
    klasifikasiSub,
    statusPenyelesaian,
    statusKirim,
    currentUser,
    unitKerjaList,
    setActiveTab,
    showToast,
    canAccessRecord
  } = useApp();

  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.jenisUser || '').toLowerCase() === 'pimpinan' ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  const accessibleMasukList = useMemo(() => {
    if (isAdmin) return naskahMasukList;
    return naskahMasukList.filter((item) => canAccessRecord(item));
  }, [isAdmin, naskahMasukList, canAccessRecord]);

  const accessibleKeluarList = useMemo(() => {
    if (isAdmin) return naskahKeluarList;
    return naskahKeluarList.filter((item) => canAccessRecord(item));
  }, [isAdmin, naskahKeluarList, canAccessRecord]);

  // Filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter Tanggal Terima Awal & Akhir (Berlaku untuk Naskah Masuk)
  const [tglTerimaAwal, setTglTerimaAwal] = useState<string>('');
  const [tglTerimaAkhir, setTglTerimaAkhir] = useState<string>('');

  // Filter Tanggal Kirim Awal & Akhir (Berlaku untuk Naskah Keluar)
  const [tglKirimAwal, setTglKirimAwal] = useState<string>('');
  const [tglKirimAkhir, setTglKirimAkhir] = useState<string>('');

  const [reportType, setReportType] = useState<'masuk' | 'keluar'>('masuk');
  const [filterStatusMasuk, setFilterStatusMasuk] = useState<string>('SEMUA');
  const [filterStatusKeluar, setFilterStatusKeluar] = useState<string>('SEMUA');

  // 5 Separate Filter states
  const [filterJenisNaskah, setFilterJenisNaskah] = useState<string>('SEMUA');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>('SEMUA');
  const [filterSubKlasifikasi, setFilterSubKlasifikasi] = useState<string>('SEMUA');
  const [filterInstansi, setFilterInstansi] = useState<string>('SEMUA');
  const [filterWilayah, setFilterWilayah] = useState<string>('SEMUA');
  const [filterUnitKerja, setFilterUnitKerja] = useState<string>('SEMUA');

  useEffect(() => {
    if (filterKlasifikasi !== 'SEMUA') {
      setFilterSubKlasifikasi('SEMUA');
    }
  }, [filterKlasifikasi]);

  // Option lists for 5 filters
  const jenisNaskahOptions =
    reportType === 'masuk' ? jenisNaskahMasuk : jenisNaskahKeluar;

  const klasifikasiOptions = Array.from(
    new Set(klasifikasiSub.map((k) => k.klasifikasiUtama))
  ).filter(Boolean);

  const selectedKlasifikasiObj = klasifikasiSub.filter(
    (k) =>
      filterKlasifikasi === 'SEMUA' ||
      k.klasifikasiUtama.toLowerCase() === filterKlasifikasi.toLowerCase()
  );
  const subKlasifikasiOptions = Array.from(
    new Set(selectedKlasifikasiObj.flatMap((k) => k.subKlasifikasiList || []))
  ).filter(Boolean);

  const instansiOptions = Array.from(
    new Set([
      ...instansiWilayah.map((i) => i.instansi),
      ...accessibleMasukList.map((i) => i.instansiTerkait),
      ...accessibleKeluarList.map((i) => i.instansiTerkait)
    ])
  ).filter(Boolean);

  const wilayahOptions = Array.from(
    new Set([
      ...instansiWilayah.map((i) => i.wilayahKerja),
      ...accessibleMasukList.map((i) => i.wilayahKerja),
      ...accessibleKeluarList.map((i) => i.wilayahKerja)
    ])
  ).filter(Boolean);

  // Status classifier helpers
  const isSelesaiTepat = (s?: string) => {
    const val = (s || '').toLowerCase().trim();
    return (
      val === 'selesai tepat sla' ||
      val === 'selesai' ||
      val === 'selesai sesuai sla' ||
      (val.includes('selesai') && !val.includes('belum') && !val.includes('melebihi') && !val.includes('terlambat'))
    );
  };

  const isSelesaiMelebihi = (s?: string) => {
    const val = (s || '').toLowerCase().trim();
    return val.includes('melebihi') || val.includes('terlambat');
  };

  const isBelumSelesai = (s?: string) => {
    const val = (s || '').toLowerCase().trim();
    return !val.includes('selesai') || val.includes('belum') || val === 'dalam proses';
  };

  const isTerkirim = (s?: string, tglKirim?: string) => {
    const val = (s || '').toLowerCase().trim();
    const isZeroDate = !tglKirim || tglKirim === '0' || tglKirim === '0000-00-00' || !String(tglKirim).trim();
    return !isZeroDate && ((val.includes('terkirim') && !val.includes('belum')) || val.includes('diterima') || val.includes('selesai'));
  };

  const isBelumTerkirim = (s?: string, tglKirim?: string) => {
    const val = (s || '').toLowerCase().trim();
    const isZeroDate = !tglKirim || tglKirim === '0' || tglKirim === '0000-00-00' || !String(tglKirim).trim();
    return val.includes('belum') || isZeroDate || !val || val.includes('gagal');
  };

  // Base Filtered lists without status filter (for summary cards)
  const baseFilteredMasuk = useMemo(() => {
    return accessibleMasukList.filter((item) => {
      if (startDate && (item.tglNaskah || '') < startDate) return false;
      if (endDate && (item.tglNaskah || '') > endDate) return false;
      if (tglTerimaAwal && (item.tglTerima || '') < tglTerimaAwal) return false;
      if (tglTerimaAkhir && (item.tglTerima || '') > tglTerimaAkhir) return false;
      if (filterJenisNaskah !== 'SEMUA' && String(item.jenisNaskah || '').toLowerCase() !== filterJenisNaskah.toLowerCase()) return false;
      if (filterKlasifikasi !== 'SEMUA' && String(item.klasifikasiUtama || '').toLowerCase() !== filterKlasifikasi.toLowerCase()) return false;
      if (filterSubKlasifikasi !== 'SEMUA' && String(item.subKlasifikasi || '').toLowerCase() !== filterSubKlasifikasi.toLowerCase()) return false;
      if (filterInstansi !== 'SEMUA' && String(item.instansiTerkait || '').toLowerCase() !== filterInstansi.toLowerCase()) return false;
      if (filterWilayah !== 'SEMUA' && String(item.wilayahKerja || '').toLowerCase() !== filterWilayah.toLowerCase()) return false;
      if (filterUnitKerja !== 'SEMUA') {
        const itemUnit = String(item.unitKerja || '').trim().toLowerCase();
        const target = filterUnitKerja.trim().toLowerCase();
        if (itemUnit !== target && !itemUnit.includes(target) && !target.includes(itemUnit)) return false;
      }
      return true;
    });
  }, [
    accessibleMasukList,
    startDate,
    endDate,
    tglTerimaAwal,
    tglTerimaAkhir,
    filterJenisNaskah,
    filterKlasifikasi,
    filterSubKlasifikasi,
    filterInstansi,
    filterWilayah,
    filterUnitKerja
  ]);

  const baseFilteredKeluar = useMemo(() => {
    return accessibleKeluarList.filter((item) => {
      if (startDate && (item.tglNaskah || '') < startDate) return false;
      if (endDate && (item.tglNaskah || '') > endDate) return false;
      if (tglKirimAwal && (item.tglKirim || '') < tglKirimAwal) return false;
      if (tglKirimAkhir && (item.tglKirim || '') > tglKirimAkhir) return false;
      if (filterJenisNaskah !== 'SEMUA' && String(item.jenisNaskah || '').toLowerCase() !== filterJenisNaskah.toLowerCase()) return false;
      if (filterKlasifikasi !== 'SEMUA' && String(item.klasifikasiUtama || '').toLowerCase() !== filterKlasifikasi.toLowerCase()) return false;
      if (filterSubKlasifikasi !== 'SEMUA' && String(item.subKlasifikasi || '').toLowerCase() !== filterSubKlasifikasi.toLowerCase()) return false;
      if (filterInstansi !== 'SEMUA' && String(item.instansiTerkait || '').toLowerCase() !== filterInstansi.toLowerCase()) return false;
      if (filterWilayah !== 'SEMUA' && String(item.wilayahKerja || '').toLowerCase() !== filterWilayah.toLowerCase()) return false;
      if (filterUnitKerja !== 'SEMUA') {
        const itemUnit = String(item.unitKerja || '').trim().toLowerCase();
        const target = filterUnitKerja.trim().toLowerCase();
        if (itemUnit !== target && !itemUnit.includes(target) && !target.includes(itemUnit)) return false;
      }
      return true;
    });
  }, [
    accessibleKeluarList,
    startDate,
    endDate,
    tglKirimAwal,
    tglKirimAkhir,
    filterJenisNaskah,
    filterKlasifikasi,
    filterSubKlasifikasi,
    filterInstansi,
    filterWilayah,
    filterUnitKerja
  ]);

  // Full Filtered lists including status filter
  const filteredMasuk = useMemo(() => {
    return baseFilteredMasuk.filter((item) => {
      if (filterStatusMasuk === 'SEMUA') return true;
      return String(item.statusPenyelesaian || '').toLowerCase() === filterStatusMasuk.toLowerCase();
    });
  }, [baseFilteredMasuk, filterStatusMasuk]);

  const filteredKeluar = useMemo(() => {
    return baseFilteredKeluar.filter((item) => {
      if (filterStatusKeluar === 'SEMUA') return true;
      return String(item.statusPengiriman || '').toLowerCase() === filterStatusKeluar.toLowerCase();
    });
  }, [baseFilteredKeluar, filterStatusKeluar]);

  const filteredList = reportType === 'masuk' ? filteredMasuk : filteredKeluar;

  // Exact Summary Counts for Active Filter Setting
  const countTotalMasuk = baseFilteredMasuk.length;
  const countMasukSelesaiTepat = baseFilteredMasuk.filter((m) => isSelesaiTepat(m.statusPenyelesaian)).length;
  const countMasukSelesaiMelebihi = baseFilteredMasuk.filter((m) => isSelesaiMelebihi(m.statusPenyelesaian)).length;
  const countMasukBelumSelesai = baseFilteredMasuk.filter((m) => isBelumSelesai(m.statusPenyelesaian)).length;

  const countTotalKeluar = baseFilteredKeluar.length;
  const countKeluarTerkirim = baseFilteredKeluar.filter((k) => isTerkirim(k.statusPengiriman, k.tglKirim)).length;
  const countKeluarBelumTerkirim = baseFilteredKeluar.filter((k) => isBelumTerkirim(k.statusPengiriman, k.tglKirim)).length;

  const totalAkumulasiArsip = countTotalMasuk + countTotalKeluar;

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTglTerimaAwal('');
    setTglTerimaAkhir('');
    setTglKirimAwal('');
    setTglKirimAkhir('');
    setFilterStatusMasuk('SEMUA');
    setFilterStatusKeluar('SEMUA');
    setFilterJenisNaskah('SEMUA');
    setFilterKlasifikasi('SEMUA');
    setFilterSubKlasifikasi('SEMUA');
    setFilterInstansi('SEMUA');
    setFilterWilayah('SEMUA');
    setFilterUnitKerja('SEMUA');
    showToast('Semua filter telah direset', 'info');
  };

  // --- Export Excel ---
  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const sheetName =
        reportType === 'masuk' ? 'LAPORAN NASKAH MASUK' : 'LAPORAN NASKAH KELUAR';

      const flatData: any[] = [];
      filteredList.forEach((item, idx) => {
        if (reportType === 'masuk') {
          flatData.push({
            'No': idx + 1,
            'Tgl Terima': item.tglTerima || '-',
            'Tgl Naskah': item.tglNaskah || '-',
            'No. Naskah': item.nomorNaskah,
            'Perihal': item.perihal,
            'Klasifikasi': item.klasifikasiUtama || '-',
            'Sub Klasifikasi': item.subKlasifikasi || '-',
            'Jenis Naskah': item.jenisNaskah || '-',
            'Pengirim': item.pengirimNaskah || '-',
            'Instansi': item.instansiTerkait || '-',
            'Wilayah Kerja': item.wilayahKerja || '-',
            'Status Penyelesaian': item.statusPenyelesaian,
            'SLA': item.sla || 0,
            'Penginput': item.createdByName || '-'
          });
        } else {
          flatData.push({
            'No': idx + 1,
            'Tgl Naskah': item.tglNaskah || '-',
            'Tgl Kirim': item.tglKirim || '-',
            'No. Naskah': item.nomorNaskah,
            'Perihal': item.perihal,
            'Klasifikasi': item.klasifikasiUtama || '-',
            'Sub Klasifikasi': item.subKlasifikasi || '-',
            'Jenis Naskah': item.jenisNaskah || '-',
            'Tujuan': item.tujuanNaskah || '-',
            'Instansi': item.instansiTerkait || '-',
            'Wilayah Kerja': item.wilayahKerja || '-',
            'Status Pengiriman': item.statusPengiriman,
            'Bukti Kirim': item.buktiKirim || '-',
            'Catatan': item.catatan || '-',
            'Penginput': item.createdByName || '-'
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(
        flatData.length > 0 ? flatData : [{ Pesan: 'Tidak ada data pada rentang tanggal tersebut' }]
      );
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const periodStr = startDate || endDate ? `${startDate || 'Awal'}_sd_${endDate || 'Sekarang'}` : 'Semua_Periode';
      XLSX.writeFile(
        wb,
        `Laporan_ManagementSurat_${reportType === 'masuk' ? 'Masuk' : 'Keluar'}_${periodStr}.xlsx`
      );
      showToast('Laporan Excel berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh file Excel', 'error');
    }
  };

  // --- Export PDF ---
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      const reportTitle = `LAPORAN NASKAH ${reportType === 'masuk' ? 'MASUK' : 'KELUAR'}`;
      const unitKerjaName = currentUser?.unitKerja
        ? currentUser.unitKerja.toUpperCase()
        : (isAdmin ? 'SEMUA UNIT KERJA' : 'SEKRETARIAT UTAMA');

      let dateRangeStr = 'SEMUA TANGGAL';
      if (startDate || endDate) {
        dateRangeStr = `${startDate || 'AWAL'} S.D. ${endDate || 'SEKARANG'}`;
      } else if (reportType === 'masuk' && (tglTerimaAwal || tglTerimaAkhir)) {
        dateRangeStr = `${tglTerimaAwal || 'AWAL'} S.D. ${tglTerimaAkhir || 'SEKARANG'}`;
      } else if (reportType === 'keluar' && (tglKirimAwal || tglKirimAkhir)) {
        dateRangeStr = `${tglKirimAwal || 'AWAL'} S.D. ${tglKirimAkhir || 'SEKARANG'}`;
      }

      // Baris 1: LAPORAN NASKAH MASUK / KELUAR
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(6, 78, 59); // emerald-900
      doc.text(reportTitle, 14, 13);

      // Baris 2: UNIT KERJA
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`UNIT KERJA: ${unitKerjaName}`, 14, 19);

      // Baris 3: RENTANG TANGGAL
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`RENTANG TANGGAL: ${dateRangeStr}`, 14, 25);

      const tableRows: any[] = [];
      filteredList.forEach((item, idx) => {
        if (reportType === 'masuk') {
          tableRows.push([
            idx + 1,
            item.tglNaskah || '-',
            item.tglTerima || '-',
            item.nomorNaskah,
            item.perihal,
            item.klasifikasiUtama || '-',
            item.subKlasifikasi || '-',
            item.jenisNaskah || '-',
            item.pengirimNaskah || '-',
            item.instansiTerkait || '-',
            item.statusPenyelesaian
          ]);
        } else {
          tableRows.push([
            idx + 1,
            item.tglNaskah || '-',
            item.tglKirim || '-',
            item.nomorNaskah,
            item.perihal,
            item.klasifikasiUtama || '-',
            item.subKlasifikasi || '-',
            item.jenisNaskah || '-',
            item.tujuanNaskah || '-',
            item.instansiTerkait || '-',
            item.statusPengiriman
          ]);
        }
      });

      const head =
        reportType === 'masuk'
          ? [
              [
                'No',
                'Tgl Naskah',
                'Tgl Terima',
                'Nomor Naskah',
                'Perihal',
                'Klasifikasi',
                'Sub Klasifikasi',
                'Jenis',
                'Pengirim',
                'Instansi',
                'Status'
              ]
            ]
          : [
              [
                'No',
                'Tgl Naskah',
                'Tgl Kirim',
                'Nomor Naskah',
                'Perihal',
                'Klasifikasi',
                'Sub Klasifikasi',
                'Jenis',
                'Tujuan',
                'Instansi',
                'Status'
              ]
            ];

      autoTable(doc, {
        startY: 34,
        head: head,
        body: tableRows,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [6, 95, 70] }, // emerald-800
        alternateRowStyles: { fillColor: [240, 253, 244] } // emerald-50
      });

      const periodStr = startDate || endDate ? `${startDate || 'Awal'}_sd_${endDate || 'Sekarang'}` : 'Semua_Periode';
      doc.save(
        `Laporan_ManagementSurat_${reportType === 'masuk' ? 'Masuk' : 'Keluar'}_${periodStr}.pdf`
      );
      showToast('Laporan PDF berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh file PDF', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Laporan Naskah Masuk & Keluar
            </h2>
          </div>

          {/* Export Excel and PDF buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadExcel}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all border border-emerald-400/40 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-emerald-950">
              Filter Rentang Tanggal, Status & Pengelompokan Data
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            {reportType === 'masuk' ? 'A. Laporan Naskah Masuk' : 'B. Laporan Naskah Keluar'}
          </span>
        </div>

        {/* Sumber Data & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pilih Sumber Laporan: A / B */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Sumber Data Laporan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportType('masuk')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  reportType === 'masuk'
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Naskah Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType('keluar')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  reportType === 'keluar'
                    ? 'bg-blue-700 text-white border-blue-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Naskah Keluar</span>
              </button>
            </div>
          </div>

          {/* Filter Status Penyelesaian / Kirim */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {reportType === 'masuk' ? 'Status Penyelesaian' : 'Status Kirim Surat'}
            </label>
            <SearchableSelect
              options={[
                { label: 'Semua Status', value: 'SEMUA' },
                ...(reportType === 'masuk' ? statusPenyelesaian : statusKirim).map((s) => ({ label: s, value: s }))
              ]}
              value={reportType === 'masuk' ? filterStatusMasuk : filterStatusKeluar}
              onChange={(val) =>
                reportType === 'masuk'
                  ? setFilterStatusMasuk(val)
                  : setFilterStatusKeluar(val)
              }
            />
          </div>
        </div>

        {/* Filter Tanggal (Posisi Tengah Permanen) */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          {/* Header Bar Tanggal */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                Filter Rentang Tanggal {reportType === 'masuk' ? '(Naskah Masuk)' : '(Naskah Keluar)'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {reportType === 'masuk' ? 'Menampilkan Tanggal Naskah & Tanggal Terima' : 'Menampilkan Tanggal Naskah & Tanggal Kirim'}
              </span>
            </div>
          </div>

          {/* Tanggal Grid (Berdampingan hemat tempat) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Tanggal Naskah */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tanggal Naskah</span>
                </span>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Awal</label>
                  <DatePicker
                    value={startDate}
                    onChange={(val) => setStartDate(val)}
                    placeholder="Pilih tgl awal..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Akhir</label>
                  <DatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    placeholder="Pilih tgl akhir..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Tanggal Terima (Masuk) */}
            {reportType === 'masuk' && (
              <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Inbox className="w-3.5 h-3.5 text-teal-700" />
                    <span>Tanggal Terima (Masuk)</span>
                  </span>
                  {(tglTerimaAwal || tglTerimaAkhir) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTglTerimaAwal('');
                        setTglTerimaAkhir('');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Terima Awal</label>
                    <DatePicker
                      value={tglTerimaAwal}
                      onChange={(val) => setTglTerimaAwal(val)}
                      placeholder="Pilih tgl terima awal..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Terima Akhir</label>
                    <DatePicker
                      value={tglTerimaAkhir}
                      onChange={(val) => setTglTerimaAkhir(val)}
                      placeholder="Pilih tgl terima akhir..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tanggal Kirim (Keluar) */}
            {reportType === 'keluar' && (
              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-700" />
                    <span>Tanggal Kirim (Keluar)</span>
                  </span>
                  {(tglKirimAwal || tglKirimAkhir) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTglKirimAwal('');
                        setTglKirimAkhir('');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Kirim Awal</label>
                    <DatePicker
                      value={tglKirimAwal}
                      onChange={(val) => setTglKirimAwal(val)}
                      placeholder="Pilih tgl kirim awal..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Kirim Akhir</label>
                    <DatePicker
                      value={tglKirimAkhir}
                      onChange={(val) => setTglKirimAkhir(val)}
                      placeholder="Pilih tgl kirim akhir..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Kriteria Master Data (6 Parameter) */}
        <div className="pt-3 border-t border-slate-100 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Berdasarkan Kategori Master Data</span>
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Filter Jenis Naskah */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Filter Jenis Naskah
              </label>
              <SearchableSelect
                options={[
                  { label: 'Semua Jenis Naskah', value: 'SEMUA' },
                  ...jenisNaskahOptions.map((s) => ({ label: s, value: s }))
                ]}
                value={filterJenisNaskah}
                onChange={(val) => setFilterJenisNaskah(val)}
              />
            </div>

            {/* 2. Filter Klasifikasi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Filter Klasifikasi
              </label>
              <SearchableSelect
                options={[
                  { label: 'Semua Klasifikasi', value: 'SEMUA' },
                  ...klasifikasiOptions.map((s) => ({ label: s, value: s }))
                ]}
                value={filterKlasifikasi}
                onChange={(val) => setFilterKlasifikasi(val)}
              />
            </div>

            {/* 3. Filter Sub Klasifikasi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. Filter Sub Klasifikasi
              </label>
              <SearchableSelect
                options={[
                  { label: 'Semua Sub Klasifikasi', value: 'SEMUA' },
                  ...subKlasifikasiOptions.map((s) => ({ label: s, value: s }))
                ]}
                value={filterSubKlasifikasi}
                onChange={(val) => setFilterSubKlasifikasi(val)}
              />
            </div>

            {/* 4. Filter Instansi Terkait */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. Filter Instansi Terkait
              </label>
              <SearchableSelect
                options={[
                  { label: 'Semua Instansi', value: 'SEMUA' },
                  ...instansiOptions.map((s) => ({ label: s, value: s }))
                ]}
                value={filterInstansi}
                onChange={(val) => setFilterInstansi(val)}
              />
            </div>

            {/* 5. Filter Wilayah Kerja */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                5. Filter Wilayah Kerja
              </label>
              <SearchableSelect
                options={[
                  { label: 'Semua Wilayah Kerja', value: 'SEMUA' },
                  ...wilayahOptions.map((s) => ({ label: s, value: s }))
                ]}
                value={filterWilayah}
                onChange={(val) => setFilterWilayah(val)}
              />
            </div>

            {/* 6. Filter Unit Kerja */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>6. Unit Kerja</span>
                {isAdmin ? (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.2 rounded-full">
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.2 rounded-full">
                    Unit Login
                  </span>
                )}
              </label>
              {isAdmin ? (
                <SearchableSelect
                  options={[
                    { label: 'Semua Unit Kerja (Admin)', value: 'SEMUA' },
                    ...unitKerjaList.map((u) => ({ label: u, value: u }))
                  ]}
                  value={filterUnitKerja}
                  onChange={(val) => setFilterUnitKerja(val)}
                />
              ) : (
                <div className="w-full py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50/70 text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">{currentUser?.unitKerja || 'Unit Kerja Anda'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan Data Laporan (Sinkron Penuh dengan Filter & Tabel) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Kartu Ringkasan Data {reportType === 'masuk' ? 'Naskah Masuk' : 'Naskah Keluar'}
            </h3>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              100% Sinkron Dengan Tabel
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Klik kartu status untuk memfilter daftar tabel secara instan
          </p>
        </div>

        {reportType === 'masuk' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Total Masuk Terfilter */}
            <button
              type="button"
              onClick={() => setFilterStatusMasuk('SEMUA')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusMasuk === 'SEMUA'
                  ? 'bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-lg ring-2 ring-emerald-500/50 border-emerald-600'
                  : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusMasuk === 'SEMUA' ? 'text-emerald-200' : 'text-slate-500'
                }`}>
                  Total Naskah Masuk
                </span>
                <Inbox className={`w-4 h-4 ${
                  filterStatusMasuk === 'SEMUA' ? 'text-emerald-300' : 'text-emerald-600'
                }`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black">{countTotalMasuk}</div>
              <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                filterStatusMasuk === 'SEMUA' ? 'text-emerald-300' : 'text-slate-400'
              }`}>
                {filterStatusMasuk === 'SEMUA' ? '✓ Sedang Ditampilkan' : 'Klik untuk tampilkan semua'}
              </div>
            </button>

            {/* Card 2: Selesai Sesuai SLA */}
            <button
              type="button"
              onClick={() => setFilterStatusMasuk('Selesai Tepat SLA')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusMasuk === 'Selesai Tepat SLA'
                  ? 'bg-gradient-to-br from-emerald-700 to-green-800 text-white shadow-lg ring-2 ring-emerald-400/50 border-emerald-500'
                  : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusMasuk === 'Selesai Tepat SLA' ? 'text-emerald-100' : 'text-emerald-700'
                }`}>
                  Selesai Tepat SLA
                </span>
                <CheckCircle2 className={`w-4 h-4 ${
                  filterStatusMasuk === 'Selesai Tepat SLA' ? 'text-emerald-200' : 'text-emerald-600'
                }`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${
                filterStatusMasuk === 'Selesai Tepat SLA' ? 'text-white' : 'text-emerald-700'
              }`}>{countMasukSelesaiTepat}</div>
              <div className={`text-[11px] font-semibold mt-1 ${
                filterStatusMasuk === 'Selesai Tepat SLA' ? 'text-emerald-200' : 'text-slate-400'
              }`}>
                {filterStatusMasuk === 'Selesai Tepat SLA' ? '✓ Filter Aktif' : 'Klik untuk memfilter'}
              </div>
            </button>

            {/* Card 3: Selesai Melebihi SLA */}
            <button
              type="button"
              onClick={() => setFilterStatusMasuk('Selesai Melebihi SLA')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusMasuk === 'Selesai Melebihi SLA'
                  ? 'bg-gradient-to-br from-amber-700 to-orange-800 text-white shadow-lg ring-2 ring-amber-400/50 border-amber-500'
                  : 'bg-white hover:bg-amber-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusMasuk === 'Selesai Melebihi SLA' ? 'text-amber-100' : 'text-amber-700'
                }`}>
                  Melebihi SLA
                </span>
                <Clock className={`w-4 h-4 ${
                  filterStatusMasuk === 'Selesai Melebihi SLA' ? 'text-amber-200' : 'text-amber-600'
                }`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${
                filterStatusMasuk === 'Selesai Melebihi SLA' ? 'text-white' : 'text-amber-700'
              }`}>{countMasukSelesaiMelebihi}</div>
              <div className={`text-[11px] font-semibold mt-1 ${
                filterStatusMasuk === 'Selesai Melebihi SLA' ? 'text-amber-200' : 'text-slate-400'
              }`}>
                {filterStatusMasuk === 'Selesai Melebihi SLA' ? '✓ Filter Aktif' : 'Klik untuk memfilter'}
              </div>
            </button>

            {/* Card 4: Dalam Proses / Belum Selesai */}
            <button
              type="button"
              onClick={() => setFilterStatusMasuk('Belum Selesai')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusMasuk === 'Belum Selesai'
                  ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-lg ring-2 ring-blue-400/50 border-blue-500'
                  : 'bg-white hover:bg-blue-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusMasuk === 'Belum Selesai' ? 'text-blue-100' : 'text-blue-700'
                }`}>
                  Dalam Proses
                </span>
                <AlertTriangle className={`w-4 h-4 ${
                  filterStatusMasuk === 'Belum Selesai' ? 'text-blue-200' : 'text-blue-600'
                }`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${
                filterStatusMasuk === 'Belum Selesai' ? 'text-white' : 'text-blue-700'
              }`}>{countMasukBelumSelesai}</div>
              <div className={`text-[11px] font-semibold mt-1 ${
                filterStatusMasuk === 'Belum Selesai' ? 'text-blue-200' : 'text-slate-400'
              }`}>
                {filterStatusMasuk === 'Belum Selesai' ? '✓ Filter Aktif' : 'Klik untuk memfilter'}
              </div>
            </button>

            {/* Card 5: Total Naskah Keseluruhan */}
            <div className="p-4 rounded-2xl border bg-slate-900 text-white shadow-md border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  Total Naskah
                </span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{totalAkumulasiArsip}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">
                Masuk: {countTotalMasuk} | Keluar: {countTotalKeluar}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Keluar Terfilter */}
            <button
              type="button"
              onClick={() => setFilterStatusKeluar('SEMUA')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusKeluar === 'SEMUA'
                  ? 'bg-gradient-to-br from-sky-800 to-blue-900 text-white shadow-lg ring-2 ring-sky-500/50 border-sky-600'
                  : 'bg-white hover:bg-sky-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusKeluar === 'SEMUA' ? 'text-sky-200' : 'text-slate-500'
                }`}>
                  Total Naskah Keluar
                </span>
                <Send className={`w-4 h-4 ${
                  filterStatusKeluar === 'SEMUA' ? 'text-sky-300' : 'text-sky-600'
                }`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black">{countTotalKeluar}</div>
              <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                filterStatusKeluar === 'SEMUA' ? 'text-sky-300' : 'text-slate-400'
              }`}>
                {filterStatusKeluar === 'SEMUA' ? '✓ Sedang Ditampilkan' : 'Klik untuk tampilkan semua'}
              </div>
            </button>

            {/* Card 2: Status Terkirim */}
            <button
              type="button"
              onClick={() => setFilterStatusKeluar('Terkirim')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusKeluar === 'Terkirim'
                  ? 'bg-gradient-to-br from-emerald-700 to-green-800 text-white shadow-lg ring-2 ring-emerald-400/50 border-emerald-500'
                  : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusKeluar === 'Terkirim' ? 'text-emerald-100' : 'text-emerald-700'
                }`}>
                  Status Terkirim
                </span>
                <CheckCircle2 className={`w-4 h-4 ${
                  filterStatusKeluar === 'Terkirim' ? 'text-emerald-200' : 'text-emerald-600'
                }`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${
                filterStatusKeluar === 'Terkirim' ? 'text-white' : 'text-emerald-700'
              }`}>{countKeluarTerkirim}</div>
              <div className={`text-[11px] font-semibold mt-1 ${
                filterStatusKeluar === 'Terkirim' ? 'text-emerald-200' : 'text-slate-400'
              }`}>
                {filterStatusKeluar === 'Terkirim' ? '✓ Filter Aktif' : 'Klik untuk memfilter'}
              </div>
            </button>

            {/* Card 3: Status Belum Terkirim */}
            <button
              type="button"
              onClick={() => setFilterStatusKeluar('Belum Terkirim')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                filterStatusKeluar === 'Belum Terkirim'
                  ? 'bg-gradient-to-br from-rose-700 to-red-800 text-white shadow-lg ring-2 ring-rose-400/50 border-rose-500'
                  : 'bg-white hover:bg-rose-50/50 text-slate-800 border-slate-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filterStatusKeluar === 'Belum Terkirim' ? 'text-rose-100' : 'text-rose-700'
                }`}>
                  Belum Terkirim
                </span>
                <AlertTriangle className={`w-4 h-4 ${
                  filterStatusKeluar === 'Belum Terkirim' ? 'text-rose-200' : 'text-rose-600'
                }`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${
                filterStatusKeluar === 'Belum Terkirim' ? 'text-white' : 'text-rose-700'
              }`}>{countKeluarBelumTerkirim}</div>
              <div className={`text-[11px] font-semibold mt-1 ${
                filterStatusKeluar === 'Belum Terkirim' ? 'text-rose-200' : 'text-slate-400'
              }`}>
                {filterStatusKeluar === 'Belum Terkirim' ? '✓ Filter Aktif' : 'Klik untuk memfilter'}
              </div>
            </button>

            {/* Card 4: Total Naskah Keseluruhan */}
            <div className="p-4 rounded-2xl border bg-slate-900 text-white shadow-md border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  Total Naskah
                </span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{totalAkumulasiArsip}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">
                Masuk: {countTotalMasuk} | Keluar: {countTotalKeluar}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Report Table View */}
      <div className="space-y-6">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-emerald-100 space-y-3">
            <p className="text-base font-bold text-slate-700">
              Tidak ada data {reportType === 'masuk' ? 'Naskah Masuk' : 'Naskah Keluar'} yang sesuai dengan filter.
            </p>
            <p className="text-xs text-slate-500">
              Silakan sesuaikan tanggal atau pilihan filter di atas, atau klik tombol di bawah untuk menampilkan seluruh data.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter & Tampilkan Semua</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <TableIcon className="w-5 h-5 text-emerald-300" />
                <h4 className="text-base font-extrabold">
                  Daftar Data Laporan <span className="text-emerald-300">({reportType === 'masuk' ? 'Naskah Masuk' : 'Naskah Keluar'})</span>
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-800 text-emerald-200 border border-emerald-700">
                  {isAdmin ? 'Semua Data (Admin)' : 'Data Inputan Anda'}
                </span>
                {(reportType === 'masuk' ? filterStatusMasuk : filterStatusKeluar) !== 'SEMUA' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                    Status: {reportType === 'masuk' ? filterStatusMasuk : filterStatusKeluar}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm border border-emerald-400">
                  {filteredList.length} Surat
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-900 text-xs uppercase font-extrabold">
                    <th className="py-3 px-4">No. Naskah</th>
                    <th className="py-3 px-4">Tanggal Naskah</th>
                    {reportType === 'masuk' && (
                      <th className="py-3 px-4">Tanggal Terima</th>
                    )}
                    <th className="py-3 px-4">Jenis & Perihal</th>
                    {reportType === 'masuk' ? (
                      <>
                        <th className="py-3 px-4">Pengirim</th>
                        <th className="py-3 px-4">Instansi & Wilayah</th>
                        <th className="py-3 px-4">Klasifikasi</th>
                        <th className="py-3 px-4">Status & SLA</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">Tujuan</th>
                        <th className="py-3 px-4">Instansi & Wilayah</th>
                        <th className="py-3 px-4">Klasifikasi</th>
                        <th className="py-3 px-4">Status Kirim</th>
                      </>
                    )}
                    <th className="py-3 px-4">Penginput</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredList.map((row, idx) => (
                    <tr key={`${row.id || 'lap'}-${idx}`} className="hover:bg-emerald-50/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.nomorNaskah}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {row.tglNaskah || '-'}
                      </td>
                      {reportType === 'masuk' && (
                        <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">
                          {row.tglTerima || '-'}
                        </td>
                      )}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-emerald-800">{row.jenisNaskah || '-'}</div>
                        <div className="font-medium text-slate-800">{row.perihal}</div>
                      </td>
                      {reportType === 'masuk' ? (
                        <>
                          <td className="py-3.5 px-4 text-slate-700">{row.pengirimNaskah}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold">{row.instansiTerkait}</div>
                            <div className="text-[11px] text-emerald-700">{row.wilayahKerja}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{row.klasifikasiUtama || '-'}</div>
                            <div className="text-[11px] text-slate-500">{row.subKlasifikasi || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              (row.statusPenyelesaian || '').toLowerCase().includes('belum')
                                ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                : (row.statusPenyelesaian || '').toLowerCase().includes('melebihi')
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {row.statusPenyelesaian}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">SLA: {row.sla} Hari</div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-4 text-slate-700">{row.tujuanNaskah}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold">{row.instansiTerkait}</div>
                            <div className="text-[11px] text-emerald-700">{row.wilayahKerja}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{row.klasifikasiUtama || '-'}</div>
                            <div className="text-[11px] text-slate-500">{row.subKlasifikasi || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                              {row.statusPengiriman}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Kirim: {row.tglKirim || '-'}
                            </div>
                            {row.buktiKirim && (
                              <div className="text-[10px] text-teal-700 font-semibold mt-0.5 truncate max-w-[120px]" title={row.buktiKirim}>
                                Bukti: {row.buktiKirim}
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-slate-500">{row.createdByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
