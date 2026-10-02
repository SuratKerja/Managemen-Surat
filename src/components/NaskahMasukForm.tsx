import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, calculateStatusFromSLA } from '../context/AppContext';
import { NaskahMasukItem } from '../types';
import * as XLSX from 'xlsx';
import {
  Inbox,
  PlusCircle,
  Save,
  Trash2,
  Search,
  RefreshCw,
  Edit,
  ExternalLink,
  Calendar,
  FileText,
  Building2,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Database
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { DatePicker } from './DatePicker';

const formatDateDDMMYYYY = (dateStr?: string | null): string => {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return trimmed;
};

const parseDateToTimestamp = (dateStr?: string | null): number => {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return 0;
  const s = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/');
    const t = new Date(`${yyyy}-${mm}-${dd}`).getTime();
    if (!isNaN(t)) return t;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const t = new Date(s.split('T')[0]).getTime();
    if (!isNaN(t)) return t;
  }
  const t = new Date(s).getTime();
  return isNaN(t) ? 0 : t;
};

export const NaskahMasukForm: React.FC = () => {
  const {
    naskahMasukList,
    setNaskahMasukList,
    saveNaskahMasukDirectly,
    jenisNaskahMasuk,
    instansiWilayah,
    klasifikasiSub,
    statusPenyelesaian,
    unitKerjaList,
    canAccessRecord,
    currentUser,
    showToast,
    searchNaskahMasukByNomor,
    syncWithGoogleSheets,
    googleSheetConfig,
    berkasThreadList,
    linkNaskahToThread,
    setActiveTab,
    slaConfig
  } = useApp();

  // Form fields state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentSelectedThreadId, setCurrentSelectedThreadId] = useState<string | null>(null);
  const [tglTerima, setTglTerima] = useState<string>('');
  const [nomorNaskah, setNomorNaskah] = useState<string>('');
  const [tglNaskah, setTglNaskah] = useState<string>('');
  const [perihal, setPerihal] = useState<string>('');
  const [jenisNaskah, setJenisNaskah] = useState<string>('');
  const [pengirimNaskah, setPengirimNaskah] = useState<string>('');
  const [unitKerja, setUnitKerja] = useState<string>(currentUser?.unitKerja || 'Sekretariat Utama');

  // Keep unitKerja synchronized with currentUser
  useEffect(() => {
    if (currentUser?.unitKerja) {
      setUnitKerja(currentUser.unitKerja);
    }
  }, [currentUser?.unitKerja]);
  const [instansiTerkait, setInstansiTerkait] = useState<string>('');
  const [wilayahKerja, setWilayahKerja] = useState<string>('');
  const [klasifikasiUtama, setKlasifikasiUtama] = useState<string>('');
  const [subKlasifikasi, setSubKlasifikasi] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sla, setSla] = useState<number | ''>('');
  const [fileLinkMasuk, setFileLinkMasuk] = useState<string>('');
  const [fileLinkDijawab, setFileLinkDijawab] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Search input, Date Terima Filter & Table visibility state (Default tersembunyi saat buka form)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTglTerimaAwal, setFilterTglTerimaAwal] = useState<string>('');
  const [filterTglTerimaAkhir, setFilterTglTerimaAkhir] = useState<string>('');
  const [isTableVisible, setIsTableVisible] = useState<boolean>(false);

  // Hidden file input ref & Import Excel state & Duplicate modal
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isImportSaving, setIsImportSaving] = useState<boolean>(false);
  const [isDuplicateConfirmModalOpen, setIsDuplicateConfirmModalOpen] = useState<boolean>(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    data: Partial<NaskahMasukItem>;
    validationStatus: 'valid' | 'warning' | 'duplicate' | 'error';
    validationNotes: string[];
    isDuplicate: boolean;
    hasWarning: boolean;
    hasError: boolean;
  }[]>([]);
  const [importFilterTab, setImportFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'DUPLICATE' | 'ERROR'>('ALL');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);

  // Helper check if record was created by the current user
  const isCreatedBySameUser = (item: { createdBy?: string; createdByName?: string }) => {
    const itemCreatedBy = String(item.createdBy || '').trim().toLowerCase();
    const itemCreatedByName = String(item.createdByName || '').trim().toLowerCase();
    const userNip = String(currentUser?.nip || '').trim().toLowerCase();
    const userId = String(currentUser?.id || '').trim().toLowerCase();
    const userName = String(currentUser?.nama || '').trim().toLowerCase();

    return (
      (Boolean(userNip) && itemCreatedBy === userNip) ||
      (Boolean(userId) && itemCreatedBy === userId) ||
      (Boolean(userName) && itemCreatedByName === userName)
    );
  };

  // Helper date parsing for Excel import
const getStatusMasukBadgeClass = (statusStr?: string) => {
  const s = (statusStr || '').toLowerCase().trim();
  if (s === 'belum selesai' || s.includes('belum')) {
    return 'bg-slate-200 text-slate-700 border border-slate-300';
  }
  if (s === 'selesai melebihi sla' || s.includes('melebihi') || s.includes('terlambat')) {
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  }
  if (s === 'selesai tepat sla' || s === 'selesai' || s.includes('selesai')) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  }
  if (s === 'dalam proses' || s === 'proses') {
    return 'bg-amber-100 text-amber-800 border border-amber-300';
  }
  if (s === 'ditunda' || s.includes('tunda') || s.includes('verifikasi') || s.includes('disposisi')) {
    return 'bg-sky-100 text-sky-800 border border-sky-300';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-300';
};
  const parseAndFormatDate = (val: any): string => {
    if (!val) return '';
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        const yyyy = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const dd = String(val.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [d, m, y] = str.split('-');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
      const dateObj = new Date((Number(str) - 25569) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  // Trigger file dialog
  const handleOpenFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload & parse Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          showToast('File Excel kosong atau tidak memiliki data!', 'error');
          return;
        }

        const parsedItems = rawData
          .map((row) => {
            const getVal = (possibleKeys: string[]) => {
              for (const k of Object.keys(row)) {
                const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                for (const pk of possibleKeys) {
                  if (normalizedKey === pk.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                    return String(row[k] ?? '').trim();
                  }
                }
              }
              return '';
            };

            const rawNomor = getVal(['nomornaskah', 'nomorsurat', 'nonaskah', 'nosurat', 'nomor', 'no', 'noagenda', 'nomoragenda', 'agenda']);
            const rawPerihal = getVal(['perihal', 'hal', 'subjek', 'subject', 'ringkasan', 'isiringkas', 'isi', 'tentang']);
            const rawTglTerima = getVal(['tanggalterima', 'tglterima', 'tglterimanasuk', 'terima', 'diterimatanggal']);
            const rawTglNaskah = getVal(['tanggalnaskah', 'tglnaskah', 'tglsurat', 'tanggalsurat', 'naskah', 'tanggal', 'tgl']);

            let formattedTglTerima = parseAndFormatDate(rawTglTerima);
            let formattedTglNaskah = parseAndFormatDate(rawTglNaskah);

            const validationNotes: string[] = [];
            let isDuplicate = false;
            let hasWarning = false;
            let hasError = false;

            // 1. Validasi Nomor Naskah & Duplikasi Database (Khusus jika diinput oleh User yang Sama)
            const finalNomor = rawNomor || '';
            if (!finalNomor || finalNomor === '-') {
              hasError = true;
              validationNotes.push('❌ Nomor Naskah Kosong (Diperlukan oleh struktur DB)');
            } else {
              const isExistInDbSameUser = naskahMasukList.some(
                (item) =>
                  String(item.nomorNaskah || '').trim().toLowerCase() === finalNomor.trim().toLowerCase() &&
                  isCreatedBySameUser(item)
              );
              if (isExistInDbSameUser) {
                isDuplicate = true;
                validationNotes.push('🟠 Duplikat: Nomor Naskah ini pernah Anda masukkan sebelumnya');
              }
            }

            // 2. Validasi Perihal
            const finalPerihal = rawPerihal || '';
            if (!finalPerihal || finalPerihal === '-') {
              hasError = true;
              validationNotes.push('❌ Perihal Kosong (Wajib diisi)');
            }

            // 3. Validasi Tanggal (Tipe DATE)
            if (!formattedTglTerima) {
              formattedTglTerima = new Date().toISOString().slice(0, 10);
              hasWarning = true;
              validationNotes.push('🟡 Tgl Terima diisi default Hari Ini (YYYY-MM-DD)');
            } else {
              validationNotes.push('🟢 Tgl Terima sesuai tipe DATE DB');
            }

            if (!formattedTglNaskah) {
              formattedTglNaskah = formattedTglTerima;
              hasWarning = true;
              validationNotes.push('🟡 Tgl Naskah disesuaikan dengan Tgl Terima');
            }

            // 4. Validasi Pengirim & Instansi
            const pengirim = getVal(['pengirimnaskah', 'pengirim', 'daripengirim', 'dari', 'asalsurat', 'asalnaskah', 'asal']);
            let instansi = getVal(['instansiterkait', 'instansi', 'kantor', 'organisasi']);
            let wilayah = getVal(['wilayahkerja', 'wilayah', 'lokasi']);

            if (!instansi && pengirim) {
              const found = instansiWilayah.find(
                (iw) => iw.instansi.toLowerCase() === pengirim.toLowerCase()
              );
              if (found) {
                instansi = found.instansi;
                wilayah = found.wilayahKerja;
              }
            }

            // 5. Validasi Unit Kerja vs Master Data
            const rawUnit = getVal(['unitkerja', 'unit', 'bidang', 'bagian', 'satuanorganisasi', 'unitpengelola']);
            const effectiveUnit = rawUnit || currentUser?.unitKerja || 'Sekretariat Utama';
            if (rawUnit && unitKerjaList && !unitKerjaList.includes(rawUnit)) {
              hasWarning = true;
              validationNotes.push(`🟡 Unit Kerja '${rawUnit}' tidak terdaftar di Master Data`);
            } else {
              validationNotes.push(`🟢 Unit Kerja '${effectiveUnit}' sesuai struktur DB`);
            }

            // 6. Validasi Jenis Naskah vs Master Data
            const rawJenis = getVal(['jenisnaskah', 'jenissurat', 'jenis', 'sifat']);
            const effectiveJenis = rawJenis || 'Surat Biasa';
            if (rawJenis && jenisNaskahMasuk && !jenisNaskahMasuk.includes(rawJenis)) {
              hasWarning = true;
              validationNotes.push(`🟡 Jenis Naskah '${rawJenis}' opsi kustom/non-master`);
            }

            const rawStatus = getVal(['statuspenyelesaian', 'status', 'keterangan']) || 'Dalam Proses';
            const rawSla = getVal(['sla', 'slahari', 'sla(hari)', 'jangkawaktu']);
            const isBelum = rawStatus.toLowerCase().includes('belum');
            const defaultSla = isBelum ? 0 : 3;
            const computedSla = rawSla !== '' && !isNaN(Number(rawSla)) ? Number(rawSla) : defaultSla;

            let validationStatus: 'valid' | 'warning' | 'duplicate' | 'error' = 'valid';
            if (hasError) {
              validationStatus = 'error';
            } else if (isDuplicate) {
              validationStatus = 'duplicate';
            } else if (hasWarning) {
              validationStatus = 'warning';
            }

            return {
              data: {
                tglTerima: formattedTglTerima,
                nomorNaskah: finalNomor,
                tglNaskah: formattedTglNaskah,
                perihal: finalPerihal,
                jenisNaskah: effectiveJenis,
                pengirimNaskah: pengirim || instansi || '-',
                unitKerja: effectiveUnit,
                instansiTerkait: instansi || pengirim || '-',
                wilayahKerja: wilayah || '-',
                klasifikasiUtama: getVal(['klasifikasiutama', 'klasifikasi', 'kodeklasifikasi', 'kode']) || '-',
                subKlasifikasi: getVal(['subklasifikasi', 'sub_klasifikasi', 'subklas', 'sub']) || '-',
                statusPenyelesaian: rawStatus,
                sla: computedSla,
                fileLinkNaskahMasuk: getVal(['linknaskahmasuk', 'filelinknaskahmasuk', 'linknaskah', 'linkmasuk', 'linkfile', 'filelink', 'lampiran', 'file']),
                fileLinkNaskahDijawab: getVal(['linknaskahdijawab', 'filelinknaskahdijawab', 'linkdijawab', 'linkjawab'])
              },
              validationStatus,
              validationNotes,
              isDuplicate,
              hasWarning,
              hasError
            };
          })
          .filter((row) => row.data.nomorNaskah || row.data.perihal);

        if (parsedItems.length === 0) {
          showToast('Tidak ada data valid yang dapat diimpor (minimal memiliki Nomor Naskah / Perihal)', 'error');
          return;
        }

        setImportPreviewData(parsedItems);
        setImportFilterTab('ALL');
        setIsImportModalOpen(true);
      } catch (err) {
        console.error(err);
        showToast('Gagal membaca file Excel. Pastikan format file .xlsx / .xls valid', 'error');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // Handle Status change with automatic SLA default (0 for Belum Selesai)
  const handleStatusChange = (val: string) => {
    setStatus(val);
    if (val.toLowerCase().includes('belum')) {
      setSla(0);
    } else if (sla === 0 || sla === '') {
      setSla(3);
    }
  };

  // Confirm Import Batch Data
  const handleConfirmImport = async () => {
    if (!importPreviewData || importPreviewData.length === 0 || isImportSaving) return;

    // Standardize & Filter candidate items
    const candidates = importPreviewData.filter((row) => !row.hasError);
    const finalRowsToImport = candidates.filter((row) => (skipDuplicates ? !row.isDuplicate : true));

    if (finalRowsToImport.length === 0) {
      showToast('Tidak ada data baru yang dapat diimpor (seluruh data duplikat / error)', 'error');
      return;
    }

    setIsImportSaving(true);
    try {
      const now = Date.now();
      const newItems: NaskahMasukItem[] = finalRowsToImport.map((rowObj, idx) => {
        const item = rowObj.data;
        const itemStatus = item.statusPenyelesaian || 'Dalam Proses';
        const isBelum = itemStatus.toLowerCase().includes('belum');
        const defaultSla = isBelum ? 0 : 3;

        return {
          id: `nm-imp-${now}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
          tglTerima: item.tglTerima || new Date().toISOString().slice(0, 10),
          nomorNaskah: item.nomorNaskah || `IMP-${idx + 1}`,
          tglNaskah: item.tglNaskah || item.tglTerima || new Date().toISOString().slice(0, 10),
          perihal: item.perihal || '-',
          jenisNaskah: item.jenisNaskah || 'Surat Biasa',
          pengirimNaskah: item.pengirimNaskah || '-',
          unitKerja: (!isAdmin ? currentUser?.unitKerja : item.unitKerja) || currentUser?.unitKerja || 'Bagian Umum',
          instansiTerkait: item.instansiTerkait || '-',
          wilayahKerja: item.wilayahKerja || '-',
          klasifikasiUtama: item.klasifikasiUtama || '-',
          subKlasifikasi: item.subKlasifikasi || '-',
          statusPenyelesaian: itemStatus,
          sla: typeof item.sla === 'number' ? item.sla : defaultSla,
          fileLinkNaskahMasuk: item.fileLinkNaskahMasuk || '',
          fileLinkNaskahDijawab: item.fileLinkNaskahDijawab || '',
          createdBy: currentUser?.nip || '198901012010011001',
          createdByName: currentUser?.nama || 'Riswan Anas',
          createdAt: new Date().toISOString()
        };
      });

      const updatedList = [...newItems, ...naskahMasukList];
      const count = newItems.length;

      // Tutup modal secara langsung agar pengguna tidak tertahan
      setIsImportModalOpen(false);
      setImportPreviewData([]);

      // Simpan langsung ke Penyimpanan Lokal & sinkronisasi Google Sheet
      const isSaved = await saveNaskahMasukDirectly(updatedList);

      const hasWebhook = Boolean(googleSheetConfig?.webhookUrl && String(googleSheetConfig.webhookUrl).trim().length > 0);
      if (hasWebhook) {
        showToast(`Sukses! ${count} data Naskah Masuk berhasil diimpor & tersimpan permanen di Google Sheet.`, 'success');
      } else if (isSaved) {
        showToast(`Sukses! ${count} data Naskah Masuk berhasil diimpor dan tersimpan di database lokal.`, 'success');
      }
    } catch (err) {
      console.error('Error in handleConfirmImport:', err);
      showToast('Gagal memproses import data. Silakan coba kembali.', 'error');
    } finally {
      setIsImportSaving(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Tanggal Terima',
      'Nomor Naskah',
      'Tanggal Naskah',
      'Perihal',
      'Jenis Naskah',
      'Pengirim Naskah',
      'Unit Kerja',
      'Instansi Terkait',
      'Wilayah Kerja',
      'Klasifikasi Utama',
      'Sub Klasifikasi',
      'Status Penyelesaian',
      'SLA (Hari)',
      'Link Naskah Masuk',
      'Link Naskah Dijawab'
    ];

    const sampleData = [
      {
        'Tanggal Terima': '2026-08-01',
        'Nomor Naskah': '001/KM/VIII/2026',
        'Tanggal Naskah': '2026-07-30',
        'Perihal': 'Permohonan Kerjasama Dan Fasilitasi',
        'Jenis Naskah': 'Surat Biasa',
        'Pengirim Naskah': 'Kementerian Agama RI',
        'Unit Kerja': 'Bagian Umum',
        'Instansi Terkait': 'Kementerian Agama RI',
        'Wilayah Kerja': 'Pusat / Jakarta',
        'Klasifikasi Utama': 'Umum & Kerjasama',
        'Sub Klasifikasi': 'Nota Kesepahaman',
        'Status Penyelesaian': 'Selesai',
        'SLA (Hari)': 3,
        'Link Naskah Masuk': 'https://drive.google.com/file/d/sample1',
        'Link Naskah Dijawab': 'https://drive.google.com/file/d/sample2'
      },
      {
        'Tanggal Terima': '2026-08-03',
        'Nomor Naskah': '002/UN/VIII/2026',
        'Tanggal Naskah': '2026-08-02',
        'Perihal': 'Undangan Rapat Koordinasi Pembahasan Program',
        'Jenis Naskah': 'Surat Undangan',
        'Pengirim Naskah': 'Dinas Pendidikan Jawa Barat',
        'Unit Kerja': 'Bagian Kepegawaian',
        'Instansi Terkait': 'Dinas Pendidikan',
        'Wilayah Kerja': 'Provinsi Jawa Barat',
        'Klasifikasi Utama': 'Pendidikan & Pelatihan',
        'Sub Klasifikasi': 'Undangan Diklat',
        'Status Penyelesaian': 'Proses',
        'SLA (Hari)': 5,
        'Link Naskah Masuk': '',
        'Link Naskah Dijawab': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 5, 18) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Naskah Masuk');
    XLSX.writeFile(wb, 'Template_Import_Naskah_Masuk.xlsx');
    showToast('Template Excel berhasil diunduh', 'info');
  };

  const isAdmin =
    currentUser?.jenisUser === 'Admin' ||
    String(currentUser?.jenisUser || '').toLowerCase().includes('admin') ||
    String(currentUser?.jenisUser || '').toLowerCase() === 'pimpinan' ||
    String(currentUser?.nama || '').toLowerCase().includes('admin');

  // Filter Unit Kerja untuk Admin
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Filter based on role & unit kerja match
  const baseList = useMemo(() => {
    if (isAdmin) {
      if (selectedUnitFilter !== 'ALL') {
        const target = selectedUnitFilter.trim().toLowerCase();
        return naskahMasukList.filter((item) => {
          const u = String(item.unitKerja || '').trim().toLowerCase();
          return u === target || u.includes(target) || target.includes(u);
        });
      }
      return naskahMasukList;
    }
    return naskahMasukList.filter((item) => canAccessRecord(item));
  }, [isAdmin, selectedUnitFilter, naskahMasukList, canAccessRecord]);

  const filteredList = baseList.filter((item) => {
    // Filter Berdasarkan Tanggal Terima
    if (filterTglTerimaAwal && (item.tglTerima || '') < filterTglTerimaAwal) return false;
    if (filterTglTerimaAkhir && (item.tglTerima || '') > filterTglTerimaAkhir) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const searchTerms = q.split(/\s+/).filter(Boolean);
    const thread = (berkasThreadList || []).find((t) => (t.naskahMasukIds || []).includes(item.id));
    const threadStatusStr = thread ? `archived tertaut ${thread.nomorThread} ${thread.namaBerkas || ''}` : 'active belum tertaut';
    const itemString = [
      item.nomorNaskah,
      item.tglTerima,
      item.tglNaskah,
      item.perihal,
      item.jenisNaskah,
      item.pengirimNaskah,
      item.unitKerja,
      item.instansiTerkait,
      item.wilayahKerja,
      item.klasifikasiUtama,
      item.subKlasifikasi,
      item.statusPenyelesaian,
      String(item.sla || ''),
      item.createdByName,
      item.createdBy,
      item.fileLinkNaskahMasuk,
      item.fileLinkNaskahDijawab,
      threadStatusStr
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchTerms.every((term) => itemString.includes(term));
  });

  // Sort by date descending (Tanggal Terkini/Terbaru di atas)
  const sortedList = [...filteredList].sort((a, b) => {
    const timeA =
      parseDateToTimestamp(a.tglTerima) ||
      parseDateToTimestamp(a.tglNaskah) ||
      parseDateToTimestamp(a.createdAt);
    const timeB =
      parseDateToTimestamp(b.tglTerima) ||
      parseDateToTimestamp(b.tglNaskah) ||
      parseDateToTimestamp(b.createdAt);
    return timeB - timeA;
  });

  // Pagination state with itemsPerPage options (10, 20, 30, 40, 50, ALL)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'ALL'>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTglTerimaAwal, filterTglTerimaAkhir, itemsPerPage]);

  const effectiveLimit = itemsPerPage === 'ALL' ? (sortedList.length || 1) : itemsPerPage;
  const totalPages = itemsPerPage === 'ALL' ? 1 : Math.ceil(sortedList.length / effectiveLimit) || 1;
  const paginatedList = itemsPerPage === 'ALL'
    ? sortedList
    : sortedList.slice((currentPage - 1) * effectiveLimit, currentPage * effectiveLimit);

  // Automatically update Wilayah Kerja when Instansi Terkait changes
  useEffect(() => {
    const foundInst = instansiWilayah.find(
      (item) => item.instansi.toLowerCase() === instansiTerkait.toLowerCase()
    );
    if (foundInst) {
      setWilayahKerja(foundInst.wilayahKerja);
    } else {
      setWilayahKerja('');
    }
  }, [instansiTerkait, instansiWilayah]);

  // Automatically adjust Sub Klasifikasi list when Klasifikasi Utama changes
  const activeSubList =
    (klasifikasiSub || []).find(
      (k) =>
        String(k?.klasifikasiUtama || '').toLowerCase() ===
        String(klasifikasiUtama || '').toLowerCase()
    )?.subKlasifikasiList || [];

  useEffect(() => {
    if (!activeSubList.includes(subKlasifikasi)) {
      setSubKlasifikasi('');
    }
  }, [klasifikasiUtama, activeSubList, subKlasifikasi]);

  // SLA change handler with auto-calculated Status Penyelesaian
  const handleSlaChange = (val: string | number) => {
    const numVal = val === '' ? 0 : typeof val === 'number' ? val : parseInt(val, 10) || 0;
    setSla(val === '' ? '' : numVal);
    const autoStatus = calculateStatusFromSLA(numVal, slaConfig);
    setStatus(autoStatus);
  };

  // Reset form to "Tambah Baru"
  const handleResetForm = () => {
    setSelectedId(null);
    setCurrentSelectedThreadId(null);
    setTglTerima('');
    setNomorNaskah('');
    setTglNaskah('');
    setPerihal('');
    setJenisNaskah('');
    setPengirimNaskah('');
    setUnitKerja(currentUser?.unitKerja || 'Bagian Umum');
    setInstansiTerkait('');
    setWilayahKerja('');
    setKlasifikasiUtama('');
    setSubKlasifikasi('');
    setSla(0);
    setStatus(calculateStatusFromSLA(0, slaConfig));
    setFileLinkMasuk('');
    setFileLinkDijawab('');
    setFieldErrors({});
  };

  // Populate form for Editing
  const handleEditItem = (item: NaskahMasukItem) => {
    setSelectedId(item.id);
    setTglTerima(item.tglTerima || new Date().toISOString().slice(0, 10));
    setNomorNaskah(item.nomorNaskah || '');
    setTglNaskah(item.tglNaskah || item.tglTerima || new Date().toISOString().slice(0, 10));
    setPerihal(item.perihal || '');
    setJenisNaskah(item.jenisNaskah || 'Surat Biasa');
    setPengirimNaskah(item.pengirimNaskah || '');
    setUnitKerja(item.unitKerja || currentUser?.unitKerja || 'Bagian Umum');
    setInstansiTerkait(item.instansiTerkait || '');
    setWilayahKerja(item.wilayahKerja || '');
    setKlasifikasiUtama(item.klasifikasiUtama || '');
    setSubKlasifikasi(item.subKlasifikasi || '');
    const numSla = typeof item.sla === 'number' ? item.sla : parseInt(String(item.sla || 0), 10) || 0;
    setSla(numSla);
    setStatus(item.statusPenyelesaian || calculateStatusFromSLA(numSla, slaConfig));
    setFileLinkMasuk(item.fileLinkNaskahMasuk || '');
    setFileLinkDijawab(item.fileLinkNaskahDijawab || '');
    const foundThread = (berkasThreadList || []).find((t) => (t.naskahMasukIds || []).includes(item.id));
    setCurrentSelectedThreadId(foundThread ? foundThread.id : null);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save / Add Data
  const handleSave = async (e?: React.FormEvent, forceSave: boolean = false) => {
    if (e) e.preventDefault();

    // Validasi Lengkap Field Wajib
    const errors: Record<string, string> = {};
    const missingNames: string[] = [];

    if (!String(tglTerima || '').trim()) {
      errors.tglTerima = 'Tanggal Terima Naskah wajib diisi!';
      missingNames.push('Tanggal Terima');
    }
    if (!String(nomorNaskah || '').trim()) {
      errors.nomorNaskah = 'Nomor Naskah Masuk wajib diisi!';
      missingNames.push('Nomor Naskah');
    }
    if (!String(tglNaskah || '').trim()) {
      errors.tglNaskah = 'Tanggal Naskah wajib diisi!';
      missingNames.push('Tanggal Naskah');
    }
    if (!String(perihal || '').trim()) {
      errors.perihal = 'Perihal Naskah wajib diisi!';
      missingNames.push('Perihal');
    }
    if (!String(jenisNaskah || '').trim()) {
      errors.jenisNaskah = 'Jenis Naskah wajib dipilih!';
      missingNames.push('Jenis Naskah');
    }
    if (!String(pengirimNaskah || '').trim()) {
      errors.pengirimNaskah = 'Pengirim Naskah wajib diisi!';
      missingNames.push('Pengirim Naskah');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast(`⚠️ Mohon lengkapi field wajib: ${missingNames.join(', ')}`, 'error');

      const firstErrorKey = Object.keys(errors)[0];
      const targetElement = document.getElementById(`field-${firstErrorKey}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
      } else {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
      return;
    }

    setFieldErrors({});

    const targetNomor = String(nomorNaskah || '').trim().toLowerCase();

    // Jika belum forceSave, cek apakah Nomor Naskah sama pernah diinput oleh USER YANG SAMA
    if (!forceSave) {
      const isExistSameUser = naskahMasukList.some((item) => {
        if (selectedId && item.id === selectedId) return false;
        const sameNomor = String(item.nomorNaskah || '').trim().toLowerCase() === targetNomor;
        return sameNomor && isCreatedBySameUser(item);
      });

      if (isExistSameUser) {
        setIsDuplicateConfirmModalOpen(true);
        return;
      }
    }

    if (selectedId) {
      // Update existing
      const updatedList = naskahMasukList.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              tglTerima: tglTerima || '',
              nomorNaskah: String(nomorNaskah || '').trim(),
              tglNaskah: tglNaskah || '',
              perihal: String(perihal || '').trim(),
              jenisNaskah: jenisNaskah || '',
              pengirimNaskah: String(pengirimNaskah || '').trim(),
              unitKerja: String((isAdmin ? unitKerja : (item.unitKerja || currentUser?.unitKerja)) || currentUser?.unitKerja || 'Bagian Umum').trim(),
              instansiTerkait: instansiTerkait || '',
              wilayahKerja: wilayahKerja || '',
              klasifikasiUtama: klasifikasiUtama || '',
              subKlasifikasi: subKlasifikasi || '',
              statusPenyelesaian: status || '',
              sla: Number(sla) || 0,
              fileLinkNaskahMasuk: String(fileLinkMasuk || '').trim(),
              fileLinkNaskahDijawab: String(fileLinkDijawab || '').trim(),
              createdAt: item.createdAt || new Date().toISOString()
            }
          : item
      );
      setNaskahMasukList(updatedList);
      if (currentSelectedThreadId) {
        linkNaskahToThread(currentSelectedThreadId, 'masuk', selectedId);
      }
      showToast('Data Sudah Tersimpan', 'success');
      handleResetForm();
      await syncWithGoogleSheets({ naskahMasuk: updatedList });
    } else {
      // Create new
      const newItem: NaskahMasukItem = {
        id: 'nm-' + Date.now(),
        tglTerima: tglTerima || '',
        nomorNaskah: String(nomorNaskah || '').trim(),
        tglNaskah: tglNaskah || '',
        perihal: String(perihal || '').trim(),
        jenisNaskah: jenisNaskah || '',
        pengirimNaskah: String(pengirimNaskah || '').trim(),
        unitKerja: String((isAdmin ? unitKerja : currentUser?.unitKerja) || currentUser?.unitKerja || 'Bagian Umum').trim(),
        instansiTerkait: instansiTerkait || '',
        wilayahKerja: wilayahKerja || '',
        klasifikasiUtama: klasifikasiUtama || '',
        subKlasifikasi: subKlasifikasi || '',
        statusPenyelesaian: status || '',
        sla: Number(sla) || 0,
        fileLinkNaskahMasuk: String(fileLinkMasuk || '').trim(),
        fileLinkNaskahDijawab: String(fileLinkDijawab || '').trim(),
        createdBy: currentUser?.nip || '198901012010011001',
        createdByName: currentUser?.nama || 'Riswan Anas',
        createdAt: new Date().toISOString()
      };
      const updatedList = [newItem, ...naskahMasukList];
      setNaskahMasukList(updatedList);
      if (currentSelectedThreadId) {
        linkNaskahToThread(currentSelectedThreadId, 'masuk', newItem.id);
      }
      showToast('Data Sudah Tersimpan', 'success');
      handleResetForm();
      await syncWithGoogleSheets({ naskahMasuk: updatedList });
    }
  };

  // Delete Data
  const handleDelete = async (id: string) => {
    const updatedList = naskahMasukList.filter((item) => item.id !== id);
    setNaskahMasukList(updatedList);
    if (selectedId === id) {
      handleResetForm();
    }
    showToast('Data berhasil dihapus dari database', 'info');
    await syncWithGoogleSheets({ naskahMasuk: updatedList });
  };

  // Search handler with Toast messages
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Masukkan kata kunci pencarian', 'info');
      return;
    }
    if (filteredList.length > 0) {
      showToast(`Data Ditemukan (${filteredList.length} data)`, 'success');
    } else {
      showToast('Maaf, Data Yang Anda Cari Tidak Ada', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Formulir Naskah Masuk
            </h2>
          </div>

          {/* Action Buttons: Import Excel & Template */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-300/30 text-emerald-100 hover:text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="Unduh contoh template format Excel"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Unduh Template</span>
            </button>
            <button
              type="button"
              onClick={handleOpenFileInput}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-xs font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-900" />
              <span>Import Data Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Input */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 relative">
        {selectedId && (
          <div className="bg-amber-500/10 border-b border-amber-300/60 rounded-t-3xl px-6 sm:px-8 py-3.5 flex items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-900 font-extrabold text-[11px]">
                MODE EDIT
              </span>
              <span>Sedang mengedit data ID: <strong className="font-mono">{selectedId}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
            >
              Batal Edit / Tambah Baru
            </button>
          </div>
        )}

        {/* Focused Validation Error Alert Banner */}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-2xl flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-black text-xs uppercase tracking-wider text-rose-900">
                ⚠️ PERHATIAN: Ditemukan {Object.keys(fieldErrors).length} Field Wajib yang Belum Diisi
              </h4>
              <p className="text-xs font-semibold text-rose-800">
                Mohon lengkapi field berikut sebelum menyimpan data:
              </p>
              <ul className="list-disc list-inside text-xs font-bold text-rose-700 space-y-0.5 pt-1">
                {Object.values(fieldErrors).map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Tgl Terima */}
            <div id="field-tglTerima">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Tanggal Terima <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.tglTerima && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERATIAN: {fieldErrors.tglTerima}</span>
                </div>
              )}
              <DatePicker
                id="tgl-terima-masuk"
                value={tglTerima || ''}
                onChange={(val) => {
                  setTglTerima(val);
                  if (fieldErrors.tglTerima) setFieldErrors((prev) => ({ ...prev, tglTerima: '' }));
                }}
                placeholder="Pilih Tanggal Terima..."
                required
                className={fieldErrors.tglTerima ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50' : ''}
              />
            </div>

            {/* 2. Nomor Naskah */}
            <div id="field-nomorNaskah">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Nomor Naskah <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.nomorNaskah && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERHATIAN: {fieldErrors.nomorNaskah}</span>
                </div>
              )}
              <div className="relative">
                <FileText className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={nomorNaskah || ''}
                  onChange={(e) => {
                    setNomorNaskah(e.target.value);
                    if (fieldErrors.nomorNaskah) setFieldErrors((prev) => ({ ...prev, nomorNaskah: '' }));
                  }}
                  placeholder="Nomor surat resmi..."
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    fieldErrors.nomorNaskah
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-300'
                      : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* 3. Tgl Naskah */}
            <div id="field-tglNaskah">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. Tanggal Naskah <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.tglNaskah && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERHATIAN: {fieldErrors.tglNaskah}</span>
                </div>
              )}
              <DatePicker
                id="tgl-naskah-masuk"
                value={tglNaskah || ''}
                onChange={(val) => {
                  setTglNaskah(val);
                  if (fieldErrors.tglNaskah) setFieldErrors((prev) => ({ ...prev, tglNaskah: '' }));
                }}
                placeholder="Pilih Tanggal Naskah..."
                required
                className={fieldErrors.tglNaskah ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50' : ''}
              />
            </div>

            {/* 4. Perihal (Full Width in row) */}
            <div id="field-perihal" className="col-span-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. Perihal Naskah <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.perihal && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERHATIAN: {fieldErrors.perihal}</span>
                </div>
              )}
              <input
                type="text"
                value={perihal || ''}
                onChange={(e) => {
                  setPerihal(e.target.value);
                  if (fieldErrors.perihal) setFieldErrors((prev) => ({ ...prev, perihal: '' }));
                }}
                placeholder="Isi ringkas perihal naskah surat masuk..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  fieldErrors.perihal
                    ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-300'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                }`}
                required
              />
            </div>

            {/* 5. Jenis Naskah (Dropdown) */}
            <div id="field-jenisNaskah">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                5. Jenis Naskah <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.jenisNaskah && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERHATIAN: {fieldErrors.jenisNaskah}</span>
                </div>
              )}
              <SearchableSelect
                options={jenisNaskahMasuk}
                value={jenisNaskah || ''}
                onChange={(val) => {
                  setJenisNaskah(val);
                  if (fieldErrors.jenisNaskah) setFieldErrors((prev) => ({ ...prev, jenisNaskah: '' }));
                }}
                emptyLabel="-- Pilih Jenis Naskah --"
              />
            </div>

            {/* 6. Pengirim Naskah */}
            <div id="field-pengirimNaskah">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                6. Pengirim Naskah <span className="text-rose-500">*</span>
              </label>
              {fieldErrors.pengirimNaskah && (
                <div className="mb-2 p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center gap-2 text-rose-950 text-xs font-bold shadow-sm animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ PERHATIAN: {fieldErrors.pengirimNaskah}</span>
                </div>
              )}
              <input
                type="text"
                value={pengirimNaskah || ''}
                onChange={(e) => {
                  setPengirimNaskah(e.target.value);
                  if (fieldErrors.pengirimNaskah) setFieldErrors((prev) => ({ ...prev, pengirimNaskah: '' }));
                }}
                placeholder="Nama pengirim / instansi pengirim..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  fieldErrors.pengirimNaskah
                    ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-300'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                }`}
                required
              />
            </div>

            {/* Unit Kerja */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center justify-between">
                <span>Unit Kerja</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  {isAdmin ? 'Pilih Unit Kerja (Admin)' : 'Otomatis Sesuai Akun Login'}
                </span>
              </label>
              {isAdmin ? (
                <div className="relative">
                  <Building2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 z-10 pointer-events-none" />
                  <select
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-emerald-950 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {unitKerjaList.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <Building2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={currentUser?.unitKerja || 'Sekretariat Utama'}
                    readOnly
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 text-sm font-bold shadow-inner cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* 7. Instansi Terkait (dropdown) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                7. Instansi Terkait
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 z-10 pointer-events-none" />
                <SearchableSelect
                  options={instansiWilayah.map((item) => item.instansi)}
                  value={instansiTerkait || ''}
                  onChange={(val) => setInstansiTerkait(val)}
                  emptyLabel="-- Pilih Instansi --"
                  className="pl-9"
                />
              </div>
            </div>

            {/* 8. Wilayah Kerja (otomatis muncul ketika instansi terkait dipilih) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center justify-between">
                <span>8. Wilayah Kerja</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Otomatis Instansi
                </span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={wilayahKerja || ''}
                  readOnly
                  placeholder="Wilayah kerja otomatis..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 text-emerald-900 text-sm font-bold shadow-inner"
                />
              </div>
            </div>

            {/* 9. Klasifikasi Utama (dropdown) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                9. Klasifikasi Utama
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 z-10 pointer-events-none" />
                <SearchableSelect
                  options={klasifikasiSub.map((item) => item.klasifikasiUtama)}
                  value={klasifikasiUtama || ''}
                  onChange={(val) => setKlasifikasiUtama(val)}
                  emptyLabel="-- Pilih Klasifikasi --"
                  className="pl-9"
                />
              </div>
            </div>

            {/* 10. Sub klasifikasi (pilihan disesuaikan dengan klasifikasi) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                10. Sub Klasifikasi
              </label>
              <SearchableSelect
                options={activeSubList}
                value={subKlasifikasi || ''}
                onChange={(val) => setSubKlasifikasi(val)}
                emptyLabel="-- Pilih Sub Klasifikasi --"
              />
            </div>

            {/* 11. SLA (Hari Kerja) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>11. SLA (Hari Kerja)</span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {sla === '' || Number(sla) === 0 ? '0 Hari (Belum Selesai)' : `${sla} Hari Kerja`}
                </span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={sla === '' ? '' : sla}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    handleSlaChange(rawVal);
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* 12. Status Penyelesaian */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                12. Status Penyelesaian
              </label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 z-10 pointer-events-none" />
                <div
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center justify-between shadow-inner ${
                    (status || calculateStatusFromSLA(sla, slaConfig)) === slaConfig.labelBelumSelesai ||
                    (status || '').toLowerCase().includes('belum')
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : (status || calculateStatusFromSLA(sla, slaConfig)) === slaConfig.labelTepatSla ||
                        (status || '').toLowerCase().includes('tepat')
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  <span>{status || calculateStatusFromSLA(sla, slaConfig)}</span>
                </div>
              </div>
            </div>

            {/* Row 6: 13. File Link Naskah Masuk & 14. File Link Naskah Dijawab */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 13. File link naskah masuk */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  13. File Link Naskah Masuk (Google Drive / Cloud URL)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={fileLinkMasuk || ''}
                    onChange={(e) => setFileLinkMasuk(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* 14. File link naskah yang dijawab */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  14. File Link Naskah yang Dijawab (Opsional)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={fileLinkDijawab || ''}
                    onChange={(e) => setFileLinkDijawab(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Tombol Tambah, Simpan, Hapus, Cari, Update Data with Icon & matching colors */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tombol Tambah Baru */}
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 border border-teal-600"
                title="Kosongkan form untuk tambah baru"
              >
                <PlusCircle className="w-4 h-4 text-teal-200" />
                <span>Tambah Baru</span>
              </button>

              {/* Tombol Simpan / Update Data */}
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 border border-emerald-500"
              >
                <Save className="w-4 h-4 text-emerald-200" />
                <span>{selectedId ? 'Update Data' : 'Simpan Data'}</span>
              </button>

              {/* Tombol Hapus */}
              {selectedId && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedId)}
                  className="px-5 py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 border border-rose-600"
                >
                  <Trash2 className="w-4 h-4 text-rose-200" />
                  <span>Hapus Data</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Database aktif: <span className="font-bold text-emerald-800">GoogleSheet - NASKAH MASUK</span>
            </div>
          </div>
        </form>
      </div>

      {/* Table Daftar Naskah Masuk */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        <div className="p-6 bg-emerald-50/60 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-extrabold text-emerald-950">
                Daftar Database Naskah Masuk ({filteredList.length} Record)
              </h3>
              {isAdmin && (
                <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-xl px-2.5 py-1 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-[11px] font-bold text-slate-600">Filter Unit:</span>
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="text-xs font-bold text-emerald-900 bg-transparent border-none focus:ring-0 cursor-pointer py-0 pr-6 pl-1"
                  >
                    <option value="ALL">Semua Unit Kerja (Admin)</option>
                    {unitKerjaList.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isAdmin && selectedUnitFilter !== 'ALL'
                ? `Menampilkan arsip khusus Unit Kerja: ${selectedUnitFilter}. Klik tombol Edit untuk mengubah data.`
                : 'Klik tombol Edit untuk mengubah/update data di form atas.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsTableVisible(!isTableVisible)}
              className="text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-300 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {isTableVisible ? (
                <>
                  <EyeOff className="w-4 h-4 text-emerald-700" />
                  <span>Sembunyikan Tabel</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Tampilkan Tabel ({filteredList.length} Data)</span>
                </>
              )}
            </button>
            <button
              onClick={() => syncWithGoogleSheets()}
              className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync Google Sheet</span>
            </button>
          </div>
        </div>

        {/* Form Pencarian & Table Content */}
        {isTableVisible && (
          <>
            {/* Filter Berdasarkan Tanggal Terima & Pencarian Kata Kunci */}
            <div className="p-4 bg-slate-50 border-b border-emerald-100 space-y-3">
              {/* Filter Tanggal Terima Card */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Inbox className="w-3.5 h-3.5 text-teal-700" />
                    <span>FILTER BERDASARKAN TANGGAL TERIMA</span>
                  </span>
                  {(filterTglTerimaAwal || filterTglTerimaAkhir) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterTglTerimaAwal('');
                        setFilterTglTerimaAkhir('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Tanggal Terima</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tanggal Terima Awal
                    </label>
                    <DatePicker
                      value={filterTglTerimaAwal}
                      onChange={(val) => setFilterTglTerimaAwal(val)}
                      placeholder="Pilih tgl terima awal..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tanggal Terima Akhir
                    </label>
                    <DatePicker
                      value={filterTglTerimaAkhir}
                      onChange={(val) => setFilterTglTerimaAkhir(val)}
                      placeholder="Pilih tgl terima akhir..."
                    />
                  </div>
                </div>
              </div>

              {/* Pencarian Seluruh Kata Kunci */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kata kunci di semua kolom (Nomor, Tanggal, Perihal, Jenis, Pengirim, Instansi, Wilayah, Status, SLA)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl text-slate-800 bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold placeholder:text-slate-400 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      title="Bersihkan Pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Cari Data</span>
                </button>
              </form>
              {(searchQuery || filterTglTerimaAwal || filterTglTerimaAkhir) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    {(filterTglTerimaAwal || filterTglTerimaAkhir) && (
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-md border border-teal-200">
                        Tanggal Terima: {filterTglTerimaAwal || 'Awal'} s/d {filterTglTerimaAkhir || 'Sekarang'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                    Hasil Filter: {filteredList.length} record ditemukan
                  </span>
                </div>
              )}
            </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">No. Naskah</th>
                <th className="py-3.5 px-4 min-w-[140px]">Tanggal</th>
                <th className="py-3.5 px-4 min-w-[280px] w-80">Perihal</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4 min-w-[220px]">Instansi & Wilayah</th>
                <th className="py-3.5 px-4">Klasifikasi</th>
                <th className="py-3.5 px-4">Status & SLA</th>
                <th className="py-3.5 px-4 min-w-[160px]">Link Surat</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
                <th className="py-3.5 px-4 min-w-[140px]">Penginput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada data di Database Naskah Masuk.
                  </td>
                </tr>
              ) : (
                paginatedList.map((row, idx) => (
                  <tr key={`${row.id || 'nm'}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-4 px-4 font-extrabold text-emerald-900 whitespace-nowrap">
                      <div>{row.nomorNaskah}</div>
                      {(() => {
                        const thread = (berkasThreadList || []).find((t) => (t.naskahMasukIds || []).includes(row.id));
                        if (thread) {
                          return (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shadow-2xs"
                                title={`Status Arsip: Archived (Tertaut dalam Thread: [${thread.nomorThread}] ${thread.namaBerkas})`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Archived
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveTab('pemberkasan')}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold border border-emerald-200 transition-colors cursor-pointer"
                                title={`Buka Berkas Thread: [${thread.nomorThread}] ${thread.namaBerkas}`}
                              >
                                {thread.nomorThread}
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-1">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold shadow-2xs"
                              title="Status Arsip: Active (Belum tertaut dalam berkas thread manapun)"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Active
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      <div className="text-emerald-900 font-bold">
                        Terima: {formatDateDDMMYYYY(row.tglTerima)}
                      </div>
                      <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                        Naskah: {formatDateDDMMYYYY(row.tglNaskah)}
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[280px] w-80 break-words">
                      <div className="font-bold text-slate-800 leading-snug">{row.perihal}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Pengirim: {row.pengirimNaskah || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{row.jenisNaskah}</td>
                    <td className="py-4 px-4 min-w-[220px]">
                      <div className="font-bold text-slate-800">{row.instansiTerkait}</div>
                      {row.wilayahKerja && (
                        <div className="text-[11px] text-emerald-700 font-bold text-left mt-1">
                          {row.wilayahKerja}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{row.klasifikasiUtama}</div>
                      <div className="text-[11px] text-slate-500">{row.subKlasifikasi}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusMasukBadgeClass(row.statusPenyelesaian)}`}>
                          {row.statusPenyelesaian}
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium">
                          SLA: {row.sla} Hari
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[160px]">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase min-w-[50px]">Masuk:</span>
                          {row.fileLinkNaskahMasuk && row.fileLinkNaskahMasuk.trim() ? (
                            <a
                              href={row.fileLinkNaskahMasuk}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Link File</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase min-w-[50px]">Dijawab:</span>
                          {row.fileLinkNaskahDijawab && row.fileLinkNaskahDijawab.trim() ? (
                            <a
                              href={row.fileLinkNaskahDijawab}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-800 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Link File</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditItem(row)}
                          className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[140px]">
                      <div className="font-bold text-slate-800">{row.createdByName || 'Admin / Operator'}</div>
                      {row.createdBy && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          NIP: {row.createdBy}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {sortedList.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold">Tampilkan per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value="ALL">Semua (ALL)</option>
                </select>
              </div>

              <div className="text-slate-600 font-medium">
                Menampilkan{' '}
                <span className="font-extrabold text-emerald-950">
                  {itemsPerPage === 'ALL' ? 1 : Math.min((currentPage - 1) * effectiveLimit + 1, sortedList.length)}
                </span>{' '}
                -{' '}
                <span className="font-extrabold text-emerald-950">
                  {itemsPerPage === 'ALL' ? sortedList.length : Math.min(currentPage * effectiveLimit, sortedList.length)}
                </span>{' '}
                dari <span className="font-extrabold text-emerald-950">{sortedList.length}</span> surat (Urutan Terkini)
              </div>
            </div>

            {itemsPerPage !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      totalPages > 7 &&
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (page === 2 && currentPage > 3) return <span key={page} className="text-slate-400 px-1">..</span>;
                      if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key={page} className="text-slate-400 px-1">..</span>;
                      return null;
                    }
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Modal Preview Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-800/80 rounded-2xl text-emerald-300">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Preview Import Data Excel Naskah Masuk</h3>
                  <p className="text-xs text-emerald-200">
                    Ditemukan <span className="font-extrabold text-amber-300">{importPreviewData.length}</span> baris data yang siap ditambahkan ke database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 rounded-xl bg-emerald-800/50 text-emerald-200 hover:text-white hover:bg-emerald-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Table Preview */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Total Baris</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{importPreviewData.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>100% Sesuai DB</span>
                  </div>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">
                    {importPreviewData.filter((x) => x.validationStatus === 'valid').length}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Format Disesuaikan</span>
                  </div>
                  <div className="text-xl font-black text-amber-950 mt-0.5">
                    {importPreviewData.filter((x) => x.validationStatus === 'warning').length}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-orange-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Duplikat di DB</span>
                  </div>
                  <div className="text-xl font-black text-orange-950 mt-0.5">
                    {importPreviewData.filter((x) => x.validationStatus === 'duplicate').length}
                  </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Format Salah / Kosong</span>
                  </div>
                  <div className="text-xl font-black text-rose-950 mt-0.5">
                    {importPreviewData.filter((x) => x.validationStatus === 'error').length}
                  </div>
                </div>
              </div>

              {/* Status Sinkronisasi & Option Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Target DB: <strong className="text-emerald-950">Supabase & Google Sheet DB</strong></span>
                </div>
                <label className="flex items-center gap-2 text-slate-800 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Abaikan (Skip) data duplikat saat konfirmasi simpan</span>
                </label>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setImportFilterTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    importFilterTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Data ({importPreviewData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportFilterTab('VALID')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    importFilterTab === 'VALID'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Sesuai DB ({importPreviewData.filter((x) => x.validationStatus === 'valid').length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportFilterTab('WARNING')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    importFilterTab === 'WARNING'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  🟡 Disesuaikan ({importPreviewData.filter((x) => x.validationStatus === 'warning').length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportFilterTab('DUPLICATE')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    importFilterTab === 'DUPLICATE'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                  }`}
                >
                  🟠 Duplikat ({importPreviewData.filter((x) => x.validationStatus === 'duplicate').length})
                </button>
                {importPreviewData.some((x) => x.validationStatus === 'error') && (
                  <button
                    type="button"
                    onClick={() => setImportFilterTab('ERROR')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      importFilterTab === 'ERROR'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    🔴 Error ({importPreviewData.filter((x) => x.validationStatus === 'error').length})
                  </button>
                )}
              </div>

              {/* Table Preview with Validation Notes */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">No</th>
                      <th className="px-3 py-2.5">Nomor Naskah</th>
                      <th className="px-3 py-2.5">Tgl Terima</th>
                      <th className="px-3 py-2.5">Perihal</th>
                      <th className="px-3 py-2.5">Unit Kerja</th>
                      <th className="px-3 py-2.5">Hasil Validasi Struktur DB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {importPreviewData
                      .filter((row) => {
                        if (importFilterTab === 'VALID') return row.validationStatus === 'valid';
                        if (importFilterTab === 'WARNING') return row.validationStatus === 'warning';
                        if (importFilterTab === 'DUPLICATE') return row.validationStatus === 'duplicate';
                        if (importFilterTab === 'ERROR') return row.validationStatus === 'error';
                        return true;
                      })
                      .map((rowObj, idx) => {
                        const item = rowObj.data;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-bold text-emerald-900 whitespace-nowrap">
                              {item.nomorNaskah || <span className="text-rose-600 font-extrabold">(Kosong)</span>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{formatDateDDMMYYYY(item.tglTerima)}</td>
                            <td className="px-3 py-2.5 max-w-xs truncate" title={item.perihal}>
                              {item.perihal || <span className="text-rose-600 font-extrabold">(Kosong)</span>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{item.unitKerja || '-'}</td>
                            <td className="px-3 py-2.5">
                              {rowObj.validationStatus === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>100% Sesuai Struktur DB</span>
                                </span>
                              )}
                              {rowObj.validationStatus === 'warning' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-extrabold">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    <span>Disesuaikan ke Format DB</span>
                                  </span>
                                  <div className="text-[10px] text-amber-700 font-semibold">
                                    {rowObj.validationNotes.filter((n) => n.startsWith('🟡')).join(' • ')}
                                  </div>
                                </div>
                              )}
                              {rowObj.validationStatus === 'duplicate' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-100 text-orange-800 border border-orange-300 rounded-full text-[10px] font-extrabold">
                                    <AlertCircle className="w-3 h-3 text-orange-600" />
                                    <span>Duplikat di DB</span>
                                  </span>
                                  <div className="text-[10px] text-orange-700 font-semibold">
                                    {skipDuplicates ? 'Akan dilewati saat simpan' : 'Akan ditambahkan ulang'}
                                  </div>
                                </div>
                              )}
                              {rowObj.validationStatus === 'error' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-extrabold">
                                    <X className="w-3 h-3 text-rose-600" />
                                    <span>Format Tidak Sesuai</span>
                                  </span>
                                  <div className="text-[10px] text-rose-700 font-semibold">
                                    {rowObj.validationNotes.filter((n) => n.startsWith('❌')).join(' • ')}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-600 font-bold pl-2">
                Siap Diimpor: <strong className="text-emerald-800">{importPreviewData.filter((r) => !r.hasError && (skipDuplicates ? !r.isDuplicate : true)).length}</strong> dari {importPreviewData.length} baris
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImportSaving}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImportSaving || importPreviewData.filter((r) => !r.hasError && (skipDuplicates ? !r.isDuplicate : true)).length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isImportSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Konfirmasi & Import {importPreviewData.filter((r) => !r.hasError && (skipDuplicates ? !r.isDuplicate : true)).length} Data Valid</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Peringatan Duplikasi untuk User Sama */}
      {isDuplicateConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 max-w-md w-full overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl border border-amber-300 shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Peringatan Duplikasi Naskah
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Nomor Naskah: <strong className="text-amber-900">{nomorNaskah}</strong>
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
              Naskah sudah terdaftar di database, Apakah akan tetap disimpan?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDuplicateConfirmModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateConfirmModalOpen(false);
                  handleSave(undefined, true);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
