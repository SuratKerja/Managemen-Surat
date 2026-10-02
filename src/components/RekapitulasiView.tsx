import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Table as TableIcon,
  Filter,
  Calendar,
  Download,
  Printer,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  Inbox,
  Send,
  Building2,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePicker } from './DatePicker';

export const RekapitulasiView: React.FC = () => {
  const {
    naskahMasukList,
    naskahKeluarList,
    klasifikasiSub,
    statusPenyelesaian,
    statusKirim,
    jenisNaskahMasuk,
    jenisNaskahKeluar,
    instansiWilayah,
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
    return isAdmin
      ? naskahMasukList
      : naskahMasukList.filter((item) => canAccessRecord(item));
  }, [isAdmin, naskahMasukList, canAccessRecord]);

  const accessibleKeluarList = useMemo(() => {
    return isAdmin
      ? naskahKeluarList
      : naskahKeluarList.filter((item) => canAccessRecord(item));
  }, [isAdmin, naskahKeluarList, canAccessRecord]);

  // Filter Baris Pertama: Filter Tanggal Awal Naskah & Tanggal Akhir Naskah (Berlaku Naskah Masuk & Keluar)
  const [tglNaskahAwal, setTglNaskahAwal] = useState<string>('');
  const [tglNaskahAkhir, setTglNaskahAkhir] = useState<string>('');

  // Filter Baris Kedua: Filter Tanggal Terima Awal & Tanggal Terima Akhir (Berlaku Untuk Naskah Masuk)
  const [tglTerimaAwal, setTglTerimaAwal] = useState<string>('');
  const [tglTerimaAkhir, setTglTerimaAkhir] = useState<string>('');

  // Filter Baris Ketiga: Filter Tanggal Kirim Awal & Tanggal Kirim Akhir (Berlaku Untuk Naskah Keluar)
  const [tglKirimAwal, setTglKirimAwal] = useState<string>('');
  const [tglKirimAkhir, setTglKirimAkhir] = useState<string>('');

  // Mode Pengelompokan Baris Tabel (Dinamis dari Master Data)
  const [groupingMode, setGroupingMode] = useState<'klasifikasi' | 'jenis' | 'instansi'>('klasifikasi');

  // Filter Unit Kerja untuk Admin
  const [filterUnitKerja, setFilterUnitKerja] = useState<string>('SEMUA');

  const handleResetFilters = () => {
    setTglNaskahAwal('');
    setTglNaskahAkhir('');
    setTglTerimaAwal('');
    setTglTerimaAkhir('');
    setTglKirimAwal('');
    setTglKirimAkhir('');
    setFilterUnitKerja('SEMUA');
    showToast('Semua filter telah direset', 'info');
  };

  // Filtered lists with useMemo
  const filteredMasuk = useMemo(() => {
    return accessibleMasukList.filter((item) => {
      // 1. Filter Tanggal Naskah
      if (tglNaskahAwal && (item.tglNaskah || '') < tglNaskahAwal) return false;
      if (tglNaskahAkhir && (item.tglNaskah || '') > tglNaskahAkhir) return false;

      // 2. Filter Tanggal Terima
      if (tglTerimaAwal && (item.tglTerima || '') < tglTerimaAwal) return false;
      if (tglTerimaAkhir && (item.tglTerima || '') > tglTerimaAkhir) return false;

      // 3. Filter Unit Kerja
      if (filterUnitKerja !== 'SEMUA') {
        const itemUnit = String(item.unitKerja || '').trim().toLowerCase();
        const target = filterUnitKerja.trim().toLowerCase();
        if (itemUnit !== target && !itemUnit.includes(target) && !target.includes(itemUnit)) return false;
      }

      return true;
    });
  }, [accessibleMasukList, tglNaskahAwal, tglNaskahAkhir, tglTerimaAwal, tglTerimaAkhir, filterUnitKerja]);

  const filteredKeluar = useMemo(() => {
    return accessibleKeluarList.filter((item) => {
      // 1. Filter Tanggal Naskah (Berlaku untuk Masuk & Keluar)
      if (tglNaskahAwal && (item.tglNaskah || '') < tglNaskahAwal) return false;
      if (tglNaskahAkhir && (item.tglNaskah || '') > tglNaskahAkhir) return false;

      // 2. Filter Tanggal Kirim (Berlaku untuk Naskah Keluar)
      if (tglKirimAwal && (item.tglKirim || '') < tglKirimAwal) return false;
      if (tglKirimAkhir && (item.tglKirim || '') > tglKirimAkhir) return false;

      // 3. Filter Unit Kerja
      if (filterUnitKerja !== 'SEMUA') {
        const itemUnit = String(item.unitKerja || '').trim().toLowerCase();
        const target = filterUnitKerja.trim().toLowerCase();
        if (itemUnit !== target && !itemUnit.includes(target) && !target.includes(itemUnit)) return false;
      }

      return true;
    });
  }, [accessibleKeluarList, tglNaskahAwal, tglNaskahAkhir, tglKirimAwal, tglKirimAkhir, filterUnitKerja]);

  // Dynamic Columns dari Master Data (Status Penyelesaian & Status Pengiriman)
  const allStatusMasuk = useMemo(() => {
    const list = Array.from(
      new Set([
        ...(statusPenyelesaian || []),
        ...filteredMasuk.map((m) => m.statusPenyelesaian).filter(Boolean)
      ])
    );
    return list.length > 0
      ? list
      : ['Selesai Tepat SLA', 'Selesai Melebihi SLA', 'Belum Selesai'];
  }, [statusPenyelesaian, filteredMasuk]);

  const allStatusKeluar = useMemo(() => {
    const list = Array.from(
      new Set([
        ...(statusKirim || []),
        ...filteredKeluar.map((k) => k.statusPengiriman).filter(Boolean)
      ])
    );
    return list.length > 0 ? list : ['Terkirim', 'Belum Terkirim'];
  }, [statusKirim, filteredKeluar]);

  // Dynamic Rows dari Master Data berdasarkan Grouping Mode
  const allRowKeys = useMemo(() => {
    if (groupingMode === 'jenis') {
      return Array.from(
        new Set([
          ...(jenisNaskahMasuk || []),
          ...(jenisNaskahKeluar || []),
          ...filteredMasuk.map((m) => m.jenisNaskah),
          ...filteredKeluar.map((k) => k.jenisNaskah)
        ])
      )
        .filter(Boolean)
        .sort();
    } else if (groupingMode === 'instansi') {
      return Array.from(
        new Set([
          ...(instansiWilayah || []).map((i) => i.namaInstansi),
          ...filteredMasuk.map((m) => m.instansiTerkait),
          ...filteredKeluar.map((k) => k.instansiTerkait)
        ])
      )
        .filter(Boolean)
        .sort();
    } else {
      return Array.from(
        new Set([
          ...(klasifikasiSub || []).map((k) => k.klasifikasiUtama),
          ...filteredMasuk.map((m) => m.klasifikasiUtama),
          ...filteredKeluar.map((k) => k.klasifikasiUtama)
        ])
      )
        .filter(Boolean)
        .sort();
    }
  }, [groupingMode, jenisNaskahMasuk, jenisNaskahKeluar, instansiWilayah, klasifikasiSub, filteredMasuk, filteredKeluar]);

  const groupingHeaderLabel =
    groupingMode === 'jenis'
      ? 'JENIS NASKAH'
      : groupingMode === 'instansi'
      ? 'INSTANSI / WILAYAH'
      : 'KLASIFIKASI UTAMA';

  // Helper classification function untuk SLA
  const isSelesaiTepat = (s: string) => {
    const val = (s || '').toLowerCase().trim();
    return (
      val === 'selesai tepat sla' ||
      val === 'selesai' ||
      val === 'selesai sesuai sla' ||
      (val.includes('selesai') && !val.includes('belum') && !val.includes('melebihi') && !val.includes('terlambat'))
    );
  };

  // Calculate dynamic table rows
  interface DynamicRowData {
    label: string;
    masukCounts: Record<string, number>;
    totalMasuk: number;
    keluarCounts: Record<string, number>;
    totalKeluar: number;
    totalKeseluruhan: number;
  }

  const {
    tableRows,
    subTotalMasukCounts,
    subTotalKeluarCounts,
    totalSuratMasuk,
    totalSuratKeluar,
    totalKeseluruhanSurat,
    persentaseMasukSesuaiSla
  } = useMemo(() => {
    const rowKeySet = new Set(allRowKeys);

    // Fast Single-Pass Aggregation for Masuk
    const masukAgg: Record<string, { total: number; byStatus: Record<string, number> }> = {};
    const unclassMasuk: { total: number; byStatus: Record<string, number> } = { total: 0, byStatus: {} };
    let totalMasukSlaMatch = 0;

    for (let i = 0; i < filteredMasuk.length; i++) {
      const m = filteredMasuk[i];
      const val =
        groupingMode === 'jenis'
          ? m.jenisNaskah || ''
          : groupingMode === 'instansi'
          ? m.instansiTerkait || ''
          : m.klasifikasiUtama || '';

      const status = m.statusPenyelesaian || 'Belum Selesai';
      if (isSelesaiTepat(status)) {
        totalMasukSlaMatch++;
      }

      if (val && rowKeySet.has(val)) {
        if (!masukAgg[val]) masukAgg[val] = { total: 0, byStatus: {} };
        masukAgg[val].total++;
        masukAgg[val].byStatus[status] = (masukAgg[val].byStatus[status] || 0) + 1;
      } else {
        unclassMasuk.total++;
        unclassMasuk.byStatus[status] = (unclassMasuk.byStatus[status] || 0) + 1;
      }
    }

    // Fast Single-Pass Aggregation for Keluar
    const keluarAgg: Record<string, { total: number; byStatus: Record<string, number> }> = {};
    const unclassKeluar: { total: number; byStatus: Record<string, number> } = { total: 0, byStatus: {} };

    for (let i = 0; i < filteredKeluar.length; i++) {
      const k = filteredKeluar[i];
      const val =
        groupingMode === 'jenis'
          ? k.jenisNaskah || ''
          : groupingMode === 'instansi'
          ? k.instansiTerkait || ''
          : k.klasifikasiUtama || '';

      const status = k.statusPengiriman || 'Belum Terkirim';

      if (val && rowKeySet.has(val)) {
        if (!keluarAgg[val]) keluarAgg[val] = { total: 0, byStatus: {} };
        keluarAgg[val].total++;
        keluarAgg[val].byStatus[status] = (keluarAgg[val].byStatus[status] || 0) + 1;
      } else {
        unclassKeluar.total++;
        unclassKeluar.byStatus[status] = (unclassKeluar.byStatus[status] || 0) + 1;
      }
    }

    const rows: DynamicRowData[] = allRowKeys.map((key) => {
      const mData = masukAgg[key] || { total: 0, byStatus: {} };
      const kData = keluarAgg[key] || { total: 0, byStatus: {} };

      const masukCounts: Record<string, number> = {};
      allStatusMasuk.forEach((st) => {
        masukCounts[st] = mData.byStatus[st] || 0;
      });

      const keluarCounts: Record<string, number> = {};
      allStatusKeluar.forEach((st) => {
        keluarCounts[st] = kData.byStatus[st] || 0;
      });

      return {
        label: key,
        masukCounts,
        totalMasuk: mData.total,
        keluarCounts,
        totalKeluar: kData.total,
        totalKeseluruhan: mData.total + kData.total
      };
    });

    if (unclassMasuk.total > 0 || unclassKeluar.total > 0) {
      const masukCounts: Record<string, number> = {};
      allStatusMasuk.forEach((st) => {
        masukCounts[st] = unclassMasuk.byStatus[st] || 0;
      });

      const keluarCounts: Record<string, number> = {};
      allStatusKeluar.forEach((st) => {
        keluarCounts[st] = unclassKeluar.byStatus[st] || 0;
      });

      rows.push({
        label: 'Lainnya / Belum Diklasifikasikan',
        masukCounts,
        totalMasuk: unclassMasuk.total,
        keluarCounts,
        totalKeluar: unclassKeluar.total,
        totalKeseluruhan: unclassMasuk.total + unclassKeluar.total
      });
    }

    // Subtotals
    const subTotalMasuk: Record<string, number> = {};
    allStatusMasuk.forEach((status) => {
      subTotalMasuk[status] = rows.reduce((acc, r) => acc + (r.masukCounts[status] || 0), 0);
    });

    const subTotalKeluar: Record<string, number> = {};
    allStatusKeluar.forEach((status) => {
      subTotalKeluar[status] = rows.reduce((acc, r) => acc + (r.keluarCounts[status] || 0), 0);
    });

    const totMasuk = rows.reduce((a, r) => a + r.totalMasuk, 0);
    const totKeluar = rows.reduce((a, r) => a + r.totalKeluar, 0);
    const totKeseluruhan = totMasuk + totKeluar;

    const persentase =
      totMasuk > 0
        ? ((totalMasukSlaMatch / totMasuk) * 100).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) + '%'
        : '0,00%';

    return {
      tableRows: rows,
      subTotalMasukCounts: subTotalMasuk,
      subTotalKeluarCounts: subTotalKeluar,
      totalSuratMasuk: totMasuk,
      totalSuratKeluar: totKeluar,
      totalKeseluruhanSurat: totKeseluruhan,
      persentaseMasukSesuaiSla: persentase
    };
  }, [allRowKeys, filteredMasuk, filteredKeluar, groupingMode, allStatusMasuk, allStatusKeluar]);

  // Export Excel Dinamis
  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Rekapitulasi Data
      const flatData: any[] = [];
      tableRows.forEach((row, idx) => {
        const rowObj: Record<string, any> = {
          'NO': idx + 1,
          [groupingHeaderLabel]: row.label
        };
        allStatusMasuk.forEach((status) => {
          rowObj[`[MASUK] ${status}`] = row.masukCounts[status] || 0;
        });
        rowObj['TOTAL NASKAH MASUK'] = row.totalMasuk;
        allStatusKeluar.forEach((status) => {
          rowObj[`[KELUAR] ${status}`] = row.keluarCounts[status] || 0;
        });
        rowObj['TOTAL NASKAH KELUAR'] = row.totalKeluar;
        rowObj['TOTAL KESELURUHAN'] = row.totalKeseluruhan;
        flatData.push(rowObj);
      });

      // Sub Total Row
      const subTotalObj: Record<string, any> = {
        'NO': 'SUB TOTAL',
        [groupingHeaderLabel]: ''
      };
      allStatusMasuk.forEach((status) => {
        subTotalObj[`[MASUK] ${status}`] = subTotalMasukCounts[status] || 0;
      });
      subTotalObj['TOTAL NASKAH MASUK'] = totalSuratMasuk;
      allStatusKeluar.forEach((status) => {
        subTotalObj[`[KELUAR] ${status}`] = subTotalKeluarCounts[status] || 0;
      });
      subTotalObj['TOTAL NASKAH KELUAR'] = totalSuratKeluar;
      subTotalObj['TOTAL KESELURUHAN'] = totalKeseluruhanSurat;
      flatData.push(subTotalObj);

      // Persentase SLA Row
      const persentaseObj: Record<string, any> = {
        'NO': 'PERSENTASE PENYELESAIAN SESUAI SLA',
        [groupingHeaderLabel]: '',
        'TOTAL NASKAH MASUK': persentaseMasukSesuaiSla
      };
      flatData.push(persentaseObj);

      const ws1 = XLSX.utils.json_to_sheet(flatData);
      XLSX.utils.book_append_sheet(wb, ws1, 'REKAPITULASI');

      // Sheet 2: Rincian Naskah Masuk dengan Kolom Klasifikasi
      const detailMasukData = filteredMasuk.map((item, idx) => ({
        'No': idx + 1,
        'Tanggal Terima': item.tglTerima || '-',
        'Tanggal Naskah': item.tglNaskah || '-',
        'Nomor Naskah': item.nomorNaskah,
        'Perihal': item.perihal,
        'Klasifikasi Utama': item.klasifikasiUtama || '-',
        'Sub Klasifikasi': item.subKlasifikasi || '-',
        'Jenis Naskah': item.jenisNaskah || '-',
        'Pengirim Naskah': item.pengirimNaskah || '-',
        'Instansi Terkait': item.instansiTerkait || '-',
        'Wilayah Kerja': item.wilayahKerja || '-',
        'Status Penyelesaian': item.statusPenyelesaian || '-',
        'SLA (Hari)': item.sla || 0,
        'Penginput': item.createdByName || '-'
      }));
      const ws2 = XLSX.utils.json_to_sheet(
        detailMasukData.length > 0 ? detailMasukData : [{ 'Pesan': 'Tidak ada data naskah masuk' }]
      );
      XLSX.utils.book_append_sheet(wb, ws2, 'RINCIAN NASKAH MASUK');

      // Sheet 3: Rincian Naskah Keluar dengan Kolom Klasifikasi
      const detailKeluarData = filteredKeluar.map((item, idx) => ({
        'No': idx + 1,
        'Tanggal Naskah': item.tglNaskah || '-',
        'Tanggal Kirim': item.tglKirim || '-',
        'Nomor Naskah': item.nomorNaskah,
        'Perihal': item.perihal,
        'Klasifikasi Utama': item.klasifikasiUtama || '-',
        'Sub Klasifikasi': item.subKlasifikasi || '-',
        'Jenis Naskah': item.jenisNaskah || '-',
        'Tujuan Naskah': item.tujuanNaskah || '-',
        'Instansi Terkait': item.instansiTerkait || '-',
        'Wilayah Kerja': item.wilayahKerja || '-',
        'Status Pengiriman': item.statusPengiriman || '-',
        'Catatan': item.catatan || '-',
        'Penginput': item.createdByName || '-'
      }));
      const ws3 = XLSX.utils.json_to_sheet(
        detailKeluarData.length > 0 ? detailKeluarData : [{ 'Pesan': 'Tidak ada data naskah keluar' }]
      );
      XLSX.utils.book_append_sheet(wb, ws3, 'RINCIAN NASKAH KELUAR');

      XLSX.writeFile(wb, `Rekapitulasi_Surat_${groupingMode}.xlsx`);
      showToast('Rekapitulasi Excel berhasil diunduh (termasuk kolom Klasifikasi & Rincian)!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh file Excel', 'error');
    }
  };

  // Export PDF Dinamis
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      const unitKerjaName = currentUser?.unitKerja
        ? currentUser.unitKerja.toUpperCase()
        : (isAdmin ? 'SEMUA UNIT KERJA' : 'SEKRETARIAT UTAMA');

      let dateRangeStr = 'SEMUA TANGGAL';
      if (tglNaskahAwal || tglNaskahAkhir) {
        dateRangeStr = `NASKAH: ${tglNaskahAwal || 'AWAL'} S.D. ${tglNaskahAkhir || 'SEKARANG'}`;
      } else if (tglTerimaAwal || tglTerimaAkhir) {
        dateRangeStr = `TERIMA: ${tglTerimaAwal || 'AWAL'} S.D. ${tglTerimaAkhir || 'SEKARANG'}`;
      } else if (tglKirimAwal || tglKirimAkhir) {
        dateRangeStr = `KIRIM: ${tglKirimAwal || 'AWAL'} S.D. ${tglKirimAkhir || 'SEKARANG'}`;
      }

      // Baris 1: LAPORAN REKAPITULASI NASKAH
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(6, 78, 59); // emerald-900
      doc.text(`REKAPITULASI NASKAH MASUK & KELUAR (${groupingHeaderLabel.toUpperCase()})`, 14, 13);

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

      const head = [
        [
          { content: 'NO', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: groupingHeaderLabel, rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: 'NASKAH MASUK', colSpan: allStatusMasuk.length + 1, styles: { halign: 'center', fillColor: [6, 95, 70] } },
          { content: 'NASKAH KELUAR', colSpan: allStatusKeluar.length + 1, styles: { halign: 'center', fillColor: [2, 132, 199] } },
          { content: 'TOTAL KESELURUHAN', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } }
        ],
        [
          { content: 'Status Penyelesaian', colSpan: allStatusMasuk.length, styles: { halign: 'center', fillColor: [16, 185, 129] } },
          { content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [16, 185, 129] } },
          { content: 'Status Pengiriman', colSpan: allStatusKeluar.length, styles: { halign: 'center', fillColor: [14, 165, 233] } },
          { content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [14, 165, 233] } }
        ],
        [
          ...allStatusMasuk,
          ...allStatusKeluar
        ]
      ];

      const body: any[] = tableRows.map((row, idx) => [
        idx + 1,
        row.label,
        ...allStatusMasuk.map((s) => row.masukCounts[s] || 0),
        row.totalMasuk,
        ...allStatusKeluar.map((s) => row.keluarCounts[s] || 0),
        row.totalKeluar,
        row.totalKeseluruhan
      ]);

      // Sub Total row
      body.push([
        { content: 'SUB TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
        ...allStatusMasuk.map((s) => ({ content: subTotalMasukCounts[s] || 0, styles: { fontStyle: 'bold', halign: 'center' } })),
        { content: totalSuratMasuk, styles: { fontStyle: 'bold', halign: 'center', fillColor: [187, 247, 208] } },
        ...allStatusKeluar.map((s) => ({ content: subTotalKeluarCounts[s] || 0, styles: { fontStyle: 'bold', halign: 'center' } })),
        { content: totalSuratKeluar, styles: { fontStyle: 'bold', halign: 'center', fillColor: [186, 230, 253] } },
        { content: totalKeseluruhanSurat, styles: { fontStyle: 'bold', halign: 'center', fillColor: [226, 232, 240] } }
      ]);

      // Persentase SLA row
      body.push([
        {
          content: 'PERSENTASE PENYELESAIAN SURAT MASUK SESUAI SLA',
          colSpan: 2,
          styles: { fontStyle: 'bold', halign: 'left', fillColor: [134, 239, 172] }
        },
        {
          content: persentaseMasukSesuaiSla,
          colSpan: allStatusMasuk.length + 1,
          styles: { fontStyle: 'bold', halign: 'center', fillColor: [134, 239, 172] }
        },
        { content: '-', colSpan: allStatusKeluar.length + 2, styles: { halign: 'center' } }
      ]);

      autoTable(doc, {
        startY: 28,
        head: head as any,
        body: body,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [15, 23, 42], lineColor: [100, 116, 139], lineWidth: 0.2 },
        headStyles: { textColor: [255, 255, 255] }
      });

      // Tambahan Tabel Rincian Klasifikasi jika grouping bukan Klasifikasi Utama
      if (groupingMode !== 'klasifikasi') {
        const klasifikasiRows = Array.from(
          new Set([
            ...(klasifikasiSub || []).map((k) => k.klasifikasiUtama),
            ...filteredMasuk.map((m) => m.klasifikasiUtama),
            ...filteredKeluar.map((k) => k.klasifikasiUtama)
          ])
        )
          .filter(Boolean)
          .sort();

        if (klasifikasiRows.length > 0) {
          const klasBody = klasifikasiRows.map((klas, i) => {
            const mCount = filteredMasuk.filter((m) => (m.klasifikasiUtama || '') === klas).length;
            const kCount = filteredKeluar.filter((k) => (k.klasifikasiUtama || '') === klas).length;
            return [i + 1, klas, mCount, kCount, mCount + kCount];
          });

          const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 120;
          if (finalY > 140) {
            doc.addPage();
            doc.setFontSize(11);
            doc.setTextColor(6, 78, 59);
            doc.text('RINGKASAN REKAPITULASI BERDASARKAN KLASIFIKASI UTAMA', 14, 15);
            autoTable(doc, {
              startY: 20,
              head: [['No', 'Klasifikasi Utama', 'Naskah Masuk', 'Naskah Keluar', 'Total']],
              body: klasBody,
              theme: 'grid',
              styles: { fontSize: 7.5, cellPadding: 1.5 },
              headStyles: { fillColor: [6, 95, 70] }
            });
          } else {
            doc.setFontSize(10);
            doc.setTextColor(6, 78, 59);
            doc.text('RINGKASAN REKAPITULASI BERDASARKAN KLASIFIKASI UTAMA', 14, finalY);
            autoTable(doc, {
              startY: finalY + 4,
              head: [['No', 'Klasifikasi Utama', 'Naskah Masuk', 'Naskah Keluar', 'Total']],
              body: klasBody,
              theme: 'grid',
              styles: { fontSize: 7.5, cellPadding: 1.5 },
              headStyles: { fillColor: [6, 95, 70] }
            });
          }
        }
      }

      doc.save(`Rekapitulasi_Surat_${groupingMode}.pdf`);
      showToast('Rekapitulasi PDF berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh file PDF', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner Rekapitulasi */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Rekapitulasi Naskah
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-900/50 px-4 py-3 rounded-2xl border border-emerald-500/30 text-center">
              <span className="block text-[10px] text-emerald-200 font-bold uppercase">
                Total Surat (Masuk + Keluar)
              </span>
              <span className="text-2xl font-black text-white">
                {totalSuratMasuk + totalSuratKeluar}
              </span>
            </div>

            <div className="bg-emerald-900/50 px-4 py-3 rounded-2xl border border-emerald-500/30 text-center">
              <span className="block text-[10px] text-emerald-200 font-bold uppercase">
                Penyelesaian Sesuai SLA
              </span>
              <span className="text-2xl font-black text-emerald-300">
                {persentaseMasukSesuaiSla}
              </span>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all border border-emerald-400/40 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tanggal Box */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            <span>Filter Tanggal Rekapitulasi Data</span>
          </h3>
          <button
            type="button"
            onClick={handleResetFilters}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Unit Kerja Scope / Filter Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase">
                  {isAdmin ? 'Cakupan Rekapitulasi Unit Kerja' : 'Unit Kerja'}
                </span>
                <span className="text-sm font-extrabold text-emerald-950">
                  {isAdmin ? (filterUnitKerja === 'SEMUA' ? 'Semua Unit Kerja (Agregat)' : filterUnitKerja) : (currentUser?.unitKerja || 'Unit Kerja Anda')}
                </span>
              </div>
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Pilih Unit:</span>
                <select
                  value={filterUnitKerja}
                  onChange={(e) => setFilterUnitKerja(e.target.value)}
                  className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-xl py-1.5 px-3 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                >
                  <option value="SEMUA">Semua Unit Kerja (Admin)</option>
                  {unitKerjaList.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Data Rekapitulasi Terisolasi Sesuai Unit Anda</span>
              </div>
            )}
          </div>

          {/* Baris Pertama: Filter Tanggal Awal Naskah & Tanggal Akhir Naskah (Berlaku Naskah Masuk & Keluar) */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>FILTER BERDASARKAN TANGGAL NASKAH</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Berlaku untuk Filter Naskah Masuk dan Naskah Keluar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Awal Naskah
                </label>
                <DatePicker
                  value={tglNaskahAwal}
                  onChange={(val) => setTglNaskahAwal(val)}
                  placeholder="Pilih tgl awal..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Akhir Naskah
                </label>
                <DatePicker
                  value={tglNaskahAkhir}
                  onChange={(val) => setTglNaskahAkhir(val)}
                  placeholder="Pilih tgl akhir..."
                />
              </div>
            </div>
          </div>

          {/* Baris Kedua: Filter Tanggal Terima Awal & Tanggal Terima Akhir (Berlaku Untuk Naskah Masuk) */}
          <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Inbox className="w-4 h-4 text-teal-700" />
                <span>FILTER BERDASARKAN TANGGAL TERIMA</span>
              </span>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-300">
                Berlaku Untuk Filter Naskah Masuk
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Terima Awal
                </label>
                <DatePicker
                  value={tglTerimaAwal}
                  onChange={(val) => setTglTerimaAwal(val)}
                  placeholder="Pilih tgl terima awal..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Terima Akhir
                </label>
                <DatePicker
                  value={tglTerimaAkhir}
                  onChange={(val) => setTglTerimaAkhir(val)}
                  placeholder="Pilih tgl terima akhir..."
                />
              </div>
            </div>
          </div>

          {/* Baris Ketiga: Filter Tanggal Kirim Awal & Tanggal Kirim Akhir (Berlaku Untuk Filter Naskah Keluar) */}
          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-4 h-4 text-sky-700" />
                <span>FILTER BERDASARKAN TANGGAL KIRIM</span>
              </span>
              <span className="text-[11px] font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-300">
                Berlaku Untuk Filter Naskah Keluar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Kirim Awal
                </label>
                <DatePicker
                  value={tglKirimAwal}
                  onChange={(val) => setTglKirimAwal(val)}
                  placeholder="Pilih tgl kirim awal..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Kirim Akhir
                </label>
                <DatePicker
                  value={tglKirimAkhir}
                  onChange={(val) => setTglKirimAkhir(val)}
                  placeholder="Pilih tgl kirim akhir..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector Dasar Pengelompokan Baris Tabel (Dinamis dari Master Data) */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-emerald-600" />
            <span>Tabel Rekapitulasi Dinamis</span>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Otomatis Mengikuti Master Data
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Kolom dan baris otomatis berubah secara dinamis sesuai dengan jenis pada Master Data (Klasifikasi, Jenis Naskah, Instansi, Status Penyelesaian & Pengiriman).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 px-2">Kelompokkan Baris:</span>
          <button
            type="button"
            onClick={() => setGroupingMode('klasifikasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              groupingMode === 'klasifikasi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Klasifikasi Utama
          </button>
          <button
            type="button"
            onClick={() => setGroupingMode('jenis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              groupingMode === 'jenis'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Jenis Naskah
          </button>
          <button
            type="button"
            onClick={() => setGroupingMode('instansi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              groupingMode === 'instansi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Instansi / Wilayah
          </button>
        </div>
      </div>

      {/* Tabel Rekapitulasi Dinamis */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[940px] table-auto border-collapse border border-slate-700 text-xs text-slate-900">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-slate-300 text-slate-900 font-black text-center">
                <th
                  rowSpan={3}
                  className="border border-slate-700 px-2 py-3 w-12 min-w-[48px] bg-slate-300 uppercase"
                >
                  NO
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-700 px-4 py-3 min-w-[240px] bg-slate-300 uppercase text-left font-black"
                >
                  {groupingHeaderLabel}
                </th>
                <th
                  colSpan={allStatusMasuk.length + 1}
                  className="border border-slate-700 px-3 py-2.5 bg-[#86efac] text-emerald-950 uppercase tracking-wider text-sm font-black"
                >
                  NASKAH MASUK
                </th>
                <th
                  colSpan={allStatusKeluar.length + 1}
                  className="border border-slate-700 px-3 py-2.5 bg-[#7dd3fc] text-sky-950 uppercase tracking-wider text-sm font-black"
                >
                  NASKAH KELUAR
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-700 px-3 py-3 min-w-[110px] bg-slate-300 uppercase text-center font-black"
                >
                  TOTAL KESELURUHAN
                </th>
              </tr>

              {/* Header Row 2 */}
              <tr className="font-extrabold text-center">
                <th
                  colSpan={allStatusMasuk.length}
                  className="border border-slate-700 px-3 py-2 bg-[#a7f3d0] text-emerald-950 font-black"
                >
                  Status Penyelesaian
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-700 px-3 py-2 bg-[#6ee7b7] text-emerald-950 font-black"
                >
                  Total Masuk
                </th>
                <th
                  colSpan={allStatusKeluar.length}
                  className="border border-slate-700 px-3 py-2 bg-[#bae6fd] text-sky-950 font-black"
                >
                  Status Pengiriman
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-700 px-3 py-2 bg-[#7dd3fc] text-sky-950 font-black"
                >
                  Total Keluar
                </th>
              </tr>

              {/* Header Row 3: Dynamic Status Columns */}
              <tr className="font-bold text-center text-[11px]">
                {allStatusMasuk.map((status) => (
                  <th
                    key={`th-masuk-${status}`}
                    className="border border-slate-700 px-2 py-2.5 min-w-[110px] bg-[#d1fae5] text-emerald-950 font-bold"
                  >
                    {status}
                  </th>
                ))}
                {allStatusKeluar.map((status) => (
                  <th
                    key={`th-keluar-${status}`}
                    className="border border-slate-700 px-2 py-2.5 min-w-[110px] bg-[#e0f2fe] text-sky-950 font-bold"
                  >
                    {status}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={allStatusMasuk.length + allStatusKeluar.length + 5}
                    className="border border-slate-700 py-10 text-center text-slate-500 font-medium"
                  >
                    Tidak ada data naskah yang ditemukan untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, idx) => (
                  <tr
                    key={`${row.label}-${idx}`}
                    className="hover:bg-amber-50/60 transition-colors bg-white"
                  >
                    <td className="border border-slate-700 py-3 px-2 text-center font-bold text-slate-800">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-700 py-3 px-4 font-semibold text-slate-900 break-words">
                      {row.label}
                    </td>
                    {allStatusMasuk.map((status) => (
                      <td
                        key={`cell-masuk-${row.label}-${status}`}
                        className="border border-slate-700 py-3 px-3 text-center font-extrabold text-emerald-900"
                      >
                        {row.masukCounts[status] || 0}
                      </td>
                    ))}
                    <td className="border border-slate-700 py-3 px-3 text-center font-black text-emerald-950 bg-emerald-50">
                      {row.totalMasuk}
                    </td>
                    {allStatusKeluar.map((status) => (
                      <td
                        key={`cell-keluar-${row.label}-${status}`}
                        className="border border-slate-700 py-3 px-3 text-center font-extrabold text-sky-900"
                      >
                        {row.keluarCounts[status] || 0}
                      </td>
                    ))}
                    <td className="border border-slate-700 py-3 px-3 text-center font-black text-sky-950 bg-sky-50">
                      {row.totalKeluar}
                    </td>
                    <td className="border border-slate-700 py-3 px-3 text-center font-black text-slate-900 bg-slate-100">
                      {row.totalKeseluruhan}
                    </td>
                  </tr>
                ))
              )}

              {/* Baris Sub Total */}
              <tr className="bg-slate-100 text-slate-900 font-black">
                <td
                  colSpan={2}
                  className="border border-slate-700 py-3.5 px-4 text-left uppercase text-xs tracking-wider bg-slate-200 text-slate-900 font-black"
                >
                  SUB TOTAL
                </td>
                {allStatusMasuk.map((status) => (
                  <td
                    key={`sub-masuk-${status}`}
                    className="border border-slate-700 py-3.5 px-3 text-center text-emerald-950 font-black text-sm bg-[#d1fae5]"
                  >
                    {subTotalMasukCounts[status] || 0}
                  </td>
                ))}
                <td className="border border-slate-700 py-3.5 px-3 text-center text-emerald-950 font-black text-sm bg-[#86efac]">
                  {totalSuratMasuk}
                </td>
                {allStatusKeluar.map((status) => (
                  <td
                    key={`sub-keluar-${status}`}
                    className="border border-slate-700 py-3.5 px-3 text-center text-sky-950 font-black text-sm bg-[#e0f2fe]"
                  >
                    {subTotalKeluarCounts[status] || 0}
                  </td>
                ))}
                <td className="border border-slate-700 py-3.5 px-3 text-center text-sky-950 font-black text-sm bg-[#7dd3fc]">
                  {totalSuratKeluar}
                </td>
                <td className="border border-slate-700 py-3.5 px-3 text-center text-slate-900 font-black text-sm bg-slate-300">
                  {totalKeseluruhanSurat}
                </td>
              </tr>

              {/* Baris Total Surat */}
              <tr className="font-extrabold">
                <td
                  colSpan={2}
                  className="border border-slate-700 py-3.5 px-4 text-left uppercase text-xs tracking-wider bg-[#86efac] text-emerald-950 font-black"
                >
                  TOTAL SURAT
                </td>
                <td
                  colSpan={allStatusMasuk.length + 1}
                  className="border border-slate-700 py-3.5 px-3 text-center bg-[#86efac] text-emerald-950 font-black text-sm"
                >
                  {totalSuratMasuk}
                </td>
                <td
                  colSpan={allStatusKeluar.length + 1}
                  className="border border-slate-700 py-3.5 px-3 text-center bg-[#7dd3fc] text-sky-950 font-black text-sm"
                >
                  {totalSuratKeluar}
                </td>
                <td className="border border-slate-700 py-3.5 px-3 text-center bg-slate-300 text-slate-900 font-black text-sm">
                  {totalKeseluruhanSurat}
                </td>
              </tr>

              {/* Baris Persentase Penyelesaian Surat Masuk Sesuai SLA */}
              <tr className="font-extrabold">
                <td
                  colSpan={2}
                  className="border border-slate-700 py-3.5 px-4 text-left uppercase text-xs tracking-wider bg-[#4ade80] text-emerald-950 font-black"
                >
                  PERSENTASE PENYELESAIAN SURAT MASUK SESUAI SLA
                </td>
                <td
                  colSpan={allStatusMasuk.length + 1}
                  className="border border-slate-700 py-3.5 px-3 text-center bg-[#4ade80] text-emerald-950 font-black text-sm"
                >
                  {persentaseMasukSesuaiSla}
                </td>
                <td
                  colSpan={allStatusKeluar.length + 2}
                  className="border border-slate-700 py-3.5 px-3 text-center bg-white text-slate-400 font-semibold text-xs"
                >
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
