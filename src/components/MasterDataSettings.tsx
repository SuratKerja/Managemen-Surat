import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount, InstansiWilayah, KlasifikasiSub, NaskahMasukItem, KlasifikasiArsipItem, ThreadNumberConfig } from '../types';
import {
  defaultUsers,
  defaultUnitKerjaList,
  defaultJenisNaskahMasuk,
  defaultJenisNaskahKeluar,
  defaultInstansiWilayah,
  defaultKlasifikasiSub,
  defaultKlasifikasiArsip,
  defaultStatusPenyelesaian,
  defaultStatusKirim,
  defaultThreadNumberConfig
} from '../data/defaultData';
import {
  Database,
  Plus,
  Trash2,
  Save,
  Users,
  Building2,
  Tag,
  FileText,
  CheckCircle2,
  Download,
  Upload,
  ExternalLink,
  Shield,
  Key,
  FolderOpen,
  RefreshCw,
  Edit2,
  X,
  Search,
  Table,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  ListTree,
  Check,
  FolderKanban,
  Settings,
  Clock,
  Sparkles
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { pushToSupabase, SUPABASE_SCHEMA_SQL, testSupabaseConnectionAndSchema, clearTableInSupabase } from '../services/supabaseData';
import { getStoredSupabaseConfig, updateSupabaseClient, resetSupabaseConfigToDefault, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../lib/supabase';
import { SearchableSelect } from './SearchableSelect';

export const MasterDataSettings: React.FC = () => {
  const {
    activeTab,
    jenisNaskahMasuk,
    setJenisNaskahMasuk,
    jenisNaskahKeluar,
    setJenisNaskahKeluar,
    instansiWilayah,
    setInstansiWilayah,
    klasifikasiSub,
    setKlasifikasiSub,
    statusPenyelesaian,
    setStatusPenyelesaian,
    statusKirim,
    setStatusKirim,
    unitKerjaList,
    setUnitKerjaList,
    users,
    setUsers,
    naskahMasukList,
    setNaskahMasukList,
    naskahKeluarList,
    setNaskahKeluarList,
    berkasThreadList,
    setBerkasThreadList,
    klasifikasiArsipList,
    setKlasifikasiArsipList,
    threadNumberConfig,
    setThreadNumberConfig,
    setActiveTab,
    showToast,
    syncWithGoogleSheets,
    currentUser,
    saveNaskahMasukDirectly,
    saveNaskahKeluarDirectly
  } = useApp();

  const [activeSection, setActiveSection] = useState<
    | 'jenisMasuk'
    | 'jenisKeluar'
    | 'unitKerja'
    | 'instansi'
    | 'klasifikasi'
    | 'klasifikasiArsip'
    | 'status'
  >('jenisMasuk');

  useEffect(() => {
    if (activeTab === 'masterJenisMasuk') setActiveSection('jenisMasuk');
    else if (activeTab === 'masterJenisKeluar') setActiveSection('jenisKeluar');
    else if (activeTab === 'masterUnitKerja') setActiveSection('unitKerja');
    else if (activeTab === 'masterInstansi') setActiveSection('instansi');
    else if (activeTab === 'masterSubKlasifikasi') setActiveSection('klasifikasi');
    else if (activeTab === 'masterKlasifikasiArsip') setActiveSection('klasifikasiArsip');
    else if (activeTab === 'masterStatus') setActiveSection('status');
  }, [activeTab]);

  const handleSelectSection = (id: typeof activeSection) => {
    setActiveSection(id);
    if (id === 'jenisMasuk') setActiveTab('masterJenisMasuk');
    else if (id === 'jenisKeluar') setActiveTab('masterJenisKeluar');
    else if (id === 'unitKerja') setActiveTab('masterUnitKerja');
    else if (id === 'instansi') setActiveTab('masterInstansi');
    else if (id === 'klasifikasi') setActiveTab('masterSubKlasifikasi');
    else if (id === 'klasifikasiArsip') setActiveTab('masterKlasifikasiArsip');
    else if (id === 'status') setActiveTab('masterStatus');
  };

  // Reset Table Modal States
  const [resetModalInfo, setResetModalInfo] = useState<{
    isOpen: boolean;
    tableKey: string;
    tableName: string;
    rowCount: number;
    dbTableName: string;
  } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [supabaseDiag, setSupabaseDiag] = useState<{
    running: boolean;
    result?: { connected: boolean; tableStatuses: { table: string; status: 'ok' | 'missing' | 'rls_error' | 'error'; message: string }[]; summary: string };
  }>({ running: false });

  const [supabaseConfigInput, setSupabaseConfigInput] = useState(() => getStoredSupabaseConfig());
  const [newJenisMasuk, setNewJenisMasuk] = useState('');
  const [newJenisKeluar, setNewJenisKeluar] = useState('');
  const [newUnitKerja, setNewUnitKerja] = useState('');
  const [newInstansi, setNewInstansi] = useState('');
  const [newWilayah, setNewWilayah] = useState('');

  const [newKlasUtama, setNewKlasUtama] = useState('');
  const [newSubKlas, setNewSubKlas] = useState('');

  const [newStatusSelesai, setNewStatusSelesai] = useState('');
  const [newStatusKirim, setNewStatusKirim] = useState('');

  // Editing states for CRUD update
  const [editingJenisMasuk, setEditingJenisMasuk] = useState<string | null>(null);
  const [editJenisMasukValue, setEditJenisMasukValue] = useState('');

  const [editingJenisKeluar, setEditingJenisKeluar] = useState<string | null>(null);
  const [editJenisKeluarValue, setEditJenisKeluarValue] = useState('');

  const [editingUnitKerja, setEditingUnitKerja] = useState<string | null>(null);
  const [editUnitKerjaValue, setEditUnitKerjaValue] = useState('');

  const [editingInstansiId, setEditingInstansiId] = useState<string | null>(null);
  const [editInstansiName, setEditInstansiName] = useState('');
  const [editWilayahKerja, setEditWilayahKerja] = useState('');

  const [editingKlasifikasiId, setEditingKlasifikasiId] = useState<string | null>(null);
  const [editKlasUtama, setEditKlasUtama] = useState('');
  const [editSubKlas, setEditSubKlas] = useState('');

  // Klasifikasi & Sub-Klasifikasi unified states
  const [klasViewMode, setKlasViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [subKlasSearch, setSubKlasSearch] = useState('');
  const [subKlasFilterParent, setSubKlasFilterParent] = useState('ALL');
  const [activeAddForm, setActiveAddForm] = useState<'none' | 'sub' | 'parent'>('none');
  const [selectedParentForSub, setSelectedParentForSub] = useState('');
  const [newSubNameInput, setNewSubNameInput] = useState('');
  const [newParentOnlyName, setNewParentOnlyName] = useState('');
  const [newParentInitialSubs, setNewParentInitialSubs] = useState('');
  const [expandedParents, setExpandedParents] = useState<{ [parentId: string]: boolean }>({});
  const [inlineNewSub, setInlineNewSub] = useState<{ [parentId: string]: string }>({});

  // Editing single sub
  const [editingSubItem, setEditingSubItem] = useState<{ parentId: string; oldSub: string } | null>(null);
  const [editSubItemValue, setEditSubItemValue] = useState('');
  const [editSubItemTargetParentId, setEditSubItemTargetParentId] = useState('');

  // Klasifikasi Arsip (Kode Arsip) states
  const [newKodeArsip, setNewKodeArsip] = useState('');
  const [newNamaKlasArsip, setNewNamaKlasArsip] = useState('');
  const [newDeskripsiArsip, setNewDeskripsiArsip] = useState('');
  const [newRetensiAktif, setNewRetensiAktif] = useState<number>(2);
  const [newRetensiInaktif, setNewRetensiInaktif] = useState<number>(5);
  const [newNasibAkhir, setNewNasibAkhir] = useState<'Musnah' | 'Permanen' | 'Dinilai Kembali'>('Permanen');
  const [arsipSearch, setArsipSearch] = useState('');
  const [editingArsipId, setEditingArsipId] = useState<string | null>(null);
  const [editKodeArsip, setEditKodeArsip] = useState('');
  const [editNamaKlasArsip, setEditNamaKlasArsip] = useState('');
  const [editDeskripsiArsip, setEditDeskripsiArsip] = useState('');
  const [editRetensiAktif, setEditRetensiAktif] = useState<number>(2);
  const [editRetensiInaktif, setEditRetensiInaktif] = useState<number>(5);
  const [editNasibAkhir, setEditNasibAkhir] = useState<'Musnah' | 'Permanen' | 'Dinilai Kembali'>('Permanen');
  const [arsipToDelete, setArsipToDelete] = useState<KlasifikasiArsipItem | null>(null);

  // Pengaturan Format Nomor Thread Otomatis states
  const [masterConfigPrefix, setMasterConfigPrefix] = useState(threadNumberConfig.prefix || 'TH');
  const [masterConfigFormat, setMasterConfigFormat] = useState(threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]');
  const [masterConfigDigits, setMasterConfigDigits] = useState(threadNumberConfig.counterDigits || 4);
  const [masterConfigCounter, setMasterConfigCounter] = useState(threadNumberConfig.currentCounter || 1);
  const [masterConfigReset, setMasterConfigReset] = useState(threadNumberConfig.resetPeriod || 'yearly');

  const [editingStatusSelesai, setEditingStatusSelesai] = useState<string | null>(null);
  const [editStatusSelesaiValue, setEditStatusSelesaiValue] = useState('');

  const [editingStatusKirim, setEditingStatusKirim] = useState<string | null>(null);
  const [editStatusKirimValue, setEditStatusKirimValue] = useState('');

  // User management states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNip, setUserNip] = useState('');
  const [userNama, setUserNama] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userUnitKerja, setUserUnitKerja] = useState('Bagian Umum');
  const [userRole, setUserRole] = useState<'Admin' | 'Operator' | 'Verifikator' | 'Public'>('Operator');
  const [userHakAkses, setUserHakAkses] = useState<string[]>([
    'Dashboard',
    'Naskah Masuk',
    'Naskah Keluar',
    'Laporan'
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Table Handler Helpers
  const openResetModal = (tableKey: string, tableName: string, rowCount: number, dbTableName: string) => {
    setResetModalInfo({
      isOpen: true,
      tableKey,
      tableName,
      rowCount,
      dbTableName
    });
    setResetConfirmText('');
  };

  const handleExecuteResetTable = async (key: string) => {
    setIsResetting(true);
    try {
      let localMsg = '';

      if (key === 'naskah_masuk') {
        setNaskahMasukList([]);
        try { localStorage.setItem('ms_naskah_masuk', JSON.stringify([])); } catch (e) {}
        await clearTableInSupabase('naskah_masuk');
        syncWithGoogleSheets({ naskahMasuk: [] });
        localMsg = 'Tabel Naskah Masuk berhasil dikosongkan (Lokal & Supabase DB).';
      } else if (key === 'naskah_keluar') {
        setNaskahKeluarList([]);
        try { localStorage.setItem('ms_naskah_keluar', JSON.stringify([])); } catch (e) {}
        await clearTableInSupabase('naskah_keluar');
        syncWithGoogleSheets({ naskahKeluar: [] });
        localMsg = 'Tabel Naskah Keluar berhasil dikosongkan (Lokal & Supabase DB).';
      } else if (key === 'berkas_thread') {
        setBerkasThreadList([]);
        try { localStorage.setItem('ms_pemberkasan', JSON.stringify([])); } catch (e) {}
        await clearTableInSupabase('berkas_thread');
        syncWithGoogleSheets({ berkasThreadList: [] });
        localMsg = 'Tabel Pemberkasan (Thread Tracker) berhasil dikosongkan.';
      } else if (key === 'klasifikasi_arsip') {
        setKlasifikasiArsipList(defaultKlasifikasiArsip);
        try { localStorage.setItem('ms_klasifikasi_arsip_list', JSON.stringify(defaultKlasifikasiArsip)); } catch (e) {}
        await clearTableInSupabase('klasifikasi_arsip');
        pushToSupabase({ klasifikasiArsipList: defaultKlasifikasiArsip });
        localMsg = 'Tabel Kode Klasifikasi Arsip di-reset ke data default launching.';
      } else if (key === 'klasifikasi_sub') {
        setKlasifikasiSub(defaultKlasifikasiSub);
        try { localStorage.setItem('ms_klasifikasi_sub', JSON.stringify(defaultKlasifikasiSub)); } catch (e) {}
        await clearTableInSupabase('klasifikasi_sub');
        pushToSupabase({ klasifikasiSub: defaultKlasifikasiSub });
        localMsg = 'Tabel Sub-Klasifikasi Arsip di-reset ke data default launching.';
      } else if (key === 'instansi_wilayah') {
        setInstansiWilayah(defaultInstansiWilayah);
        try { localStorage.setItem('ms_instansi_wilayah', JSON.stringify(defaultInstansiWilayah)); } catch (e) {}
        await clearTableInSupabase('instansi_wilayah');
        pushToSupabase({ instansiWilayah: defaultInstansiWilayah });
        localMsg = 'Tabel Instansi & Wilayah Kerja di-reset ke data default launching.';
      } else if (key === 'unit_kerja') {
        setUnitKerjaList(defaultUnitKerjaList);
        try { localStorage.setItem('ms_unit_kerja_list', JSON.stringify(defaultUnitKerjaList)); } catch (e) {}
        await clearTableInSupabase('unit_kerja');
        pushToSupabase({ unitKerjaList: defaultUnitKerjaList });
        localMsg = 'Tabel Unit Kerja di-reset ke data default launching.';
      } else if (key === 'users') {
        setUsers(defaultUsers);
        try { localStorage.setItem('ms_users', JSON.stringify(defaultUsers)); } catch (e) {}
        await clearTableInSupabase('users');
        pushToSupabase({ users: defaultUsers });
        localMsg = 'Tabel Pengguna di-reset ke data default launching.';
      } else if (key === 'jenis_naskah_masuk') {
        setJenisNaskahMasuk(defaultJenisNaskahMasuk);
        try { localStorage.setItem('ms_jenis_naskah_masuk', JSON.stringify(defaultJenisNaskahMasuk)); } catch (e) {}
        await clearTableInSupabase('master_dropdown', { column: 'kategori', value: 'Jenis Naskah Masuk' });
        pushToSupabase({ jenisNaskahMasuk: defaultJenisNaskahMasuk });
        localMsg = 'Opsi Jenis Naskah Masuk di-reset ke data default launching.';
      } else if (key === 'jenis_naskah_keluar') {
        setJenisNaskahKeluar(defaultJenisNaskahKeluar);
        try { localStorage.setItem('ms_jenis_naskah_keluar', JSON.stringify(defaultJenisNaskahKeluar)); } catch (e) {}
        await clearTableInSupabase('master_dropdown', { column: 'kategori', value: 'Jenis Naskah Keluar' });
        pushToSupabase({ jenisNaskahKeluar: defaultJenisNaskahKeluar });
        localMsg = 'Opsi Jenis Naskah Keluar di-reset ke data default launching.';
      } else if (key === 'thread_number_config') {
        setThreadNumberConfig(defaultThreadNumberConfig);
        try { localStorage.setItem('ms_thread_number_config', JSON.stringify(defaultThreadNumberConfig)); } catch (e) {}
        await clearTableInSupabase('thread_number_config');
        pushToSupabase({ threadNumberConfig: defaultThreadNumberConfig });
        localMsg = 'Counter Nomor Thread di-reset ke data default launching.';
      }

      showToast(localMsg, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal reset tabel: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsResetting(false);
      setResetModalInfo(null);
      setResetConfirmText('');
    }
  };

  // --- Handlers for Jenis Masuk ---
  const handleAddJenisMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisMasuk.trim()) return;
    if (jenisNaskahMasuk.includes(newJenisMasuk.trim())) {
      showToast('Jenis naskah sudah ada di database', 'error');
      return;
    }
    setJenisNaskahMasuk([...jenisNaskahMasuk, newJenisMasuk.trim()]);
    setNewJenisMasuk('');
    showToast('Jenis Naskah Masuk ditambahkan', 'success');
  };

  const handleUpdateJenisMasuk = (oldItem: string) => {
    const trimmed = editJenisMasukValue.trim();
    if (!trimmed) {
      showToast('Nama jenis naskah tidak boleh kosong', 'error');
      return;
    }
    if (trimmed !== oldItem && jenisNaskahMasuk.includes(trimmed)) {
      showToast('Jenis naskah sudah ada di database', 'error');
      return;
    }
    setJenisNaskahMasuk(jenisNaskahMasuk.map((j) => (j === oldItem ? trimmed : j)));
    setEditingJenisMasuk(null);
    setEditJenisMasukValue('');
    showToast('Jenis Naskah Masuk berhasil diperbarui', 'success');
  };

  const handleDeleteJenisMasuk = (item: string) => {
    setJenisNaskahMasuk(jenisNaskahMasuk.filter((j) => j !== item));
    showToast('Item berhasil dihapus', 'info');
  };

  // --- Handlers for Jenis Keluar ---
  const handleAddJenisKeluar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisKeluar.trim()) return;
    if (jenisNaskahKeluar.includes(newJenisKeluar.trim())) {
      showToast('Jenis naskah sudah ada di database', 'error');
      return;
    }
    setJenisNaskahKeluar([...jenisNaskahKeluar, newJenisKeluar.trim()]);
    setNewJenisKeluar('');
    showToast('Jenis Naskah Keluar ditambahkan', 'success');
  };

  const handleUpdateJenisKeluar = (oldItem: string) => {
    const trimmed = editJenisKeluarValue.trim();
    if (!trimmed) {
      showToast('Nama jenis naskah tidak boleh kosong', 'error');
      return;
    }
    if (trimmed !== oldItem && jenisNaskahKeluar.includes(trimmed)) {
      showToast('Jenis naskah sudah ada di database', 'error');
      return;
    }
    setJenisNaskahKeluar(jenisNaskahKeluar.map((j) => (j === oldItem ? trimmed : j)));
    setEditingJenisKeluar(null);
    setEditJenisKeluarValue('');
    showToast('Jenis Naskah Keluar berhasil diperbarui', 'success');
  };

  const handleDeleteJenisKeluar = (item: string) => {
    setJenisNaskahKeluar(jenisNaskahKeluar.filter((j) => j !== item));
    showToast('Item berhasil dihapus', 'info');
  };

  // --- Handlers for Unit Kerja ---
  const handleAddUnitKerja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitKerja.trim()) return;
    if (unitKerjaList.includes(newUnitKerja.trim())) {
      showToast('Unit Kerja sudah ada di database', 'error');
      return;
    }
    setUnitKerjaList([...unitKerjaList, newUnitKerja.trim()]);
    setNewUnitKerja('');
    showToast('Unit Kerja ditambahkan', 'success');
  };

  const handleUpdateUnitKerja = (oldItem: string) => {
    const trimmed = editUnitKerjaValue.trim();
    if (!trimmed) {
      showToast('Nama unit kerja tidak boleh kosong', 'error');
      return;
    }
    if (trimmed !== oldItem && unitKerjaList.includes(trimmed)) {
      showToast('Unit Kerja sudah ada di database', 'error');
      return;
    }
    setUnitKerjaList(unitKerjaList.map((u) => (u === oldItem ? trimmed : u)));
    setEditingUnitKerja(null);
    setEditUnitKerjaValue('');
    showToast('Unit Kerja berhasil diperbarui', 'success');
  };

  const handleDeleteUnitKerja = (item: string) => {
    if (unitKerjaList.length <= 1) {
      showToast('Minimal harus ada 1 Unit Kerja dalam sistem', 'error');
      return;
    }
    setUnitKerjaList(unitKerjaList.filter((u) => u !== item));
    showToast('Unit Kerja berhasil dihapus', 'info');
  };

  // --- Handlers for Instansi & Wilayah Kerja ---
  const handleAddInstansi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstansi.trim() || !newWilayah.trim()) {
      showToast('Instansi dan Wilayah Kerja harus diisi', 'error');
      return;
    }
    const newItem: InstansiWilayah = {
      id: 'ins-' + Date.now(),
      instansi: newInstansi.trim(),
      wilayahKerja: newWilayah.trim()
    };
    setInstansiWilayah([...instansiWilayah, newItem]);
    setNewInstansi('');
    setNewWilayah('');
    showToast('Instansi & Wilayah Kerja ditambahkan', 'success');
  };

  const handleUpdateInstansi = (id: string) => {
    if (!editInstansiName.trim() || !editWilayahKerja.trim()) {
      showToast('Instansi dan Wilayah Kerja harus diisi', 'error');
      return;
    }
    setInstansiWilayah(
      instansiWilayah.map((item) =>
        item.id === id
          ? { ...item, instansi: editInstansiName.trim(), wilayahKerja: editWilayahKerja.trim() }
          : item
      )
    );
    setEditingInstansiId(null);
    setEditInstansiName('');
    setEditWilayahKerja('');
    showToast('Instansi & Wilayah Kerja berhasil diperbarui', 'success');
  };

  const handleDeleteInstansi = (id: string) => {
    setInstansiWilayah(instansiWilayah.filter((i) => i.id !== id));
    showToast('Instansi & Wilayah Kerja dihapus', 'info');
  };

  // --- Handlers for Klasifikasi & Sub Klasifikasi ---
  const handleAddKlasifikasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKlasUtama.trim() || !newSubKlas.trim()) {
      showToast('Klasifikasi Utama dan Sub Klasifikasi harus diisi', 'error');
      return;
    }
    const subArray = newSubKlas
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const existingIndex = klasifikasiSub.findIndex(
      (k) => k.klasifikasiUtama.toLowerCase() === newKlasUtama.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // merge subklasifikasi
      const updated = [...klasifikasiSub];
      const mergedSubs = Array.from(
        new Set([...updated[existingIndex].subKlasifikasiList, ...subArray])
      );
      updated[existingIndex] = {
        ...updated[existingIndex],
        subKlasifikasiList: mergedSubs
      };
      setKlasifikasiSub(updated);
    } else {
      setKlasifikasiSub([
        ...klasifikasiSub,
        {
          id: 'klas-' + Date.now(),
          klasifikasiUtama: newKlasUtama.trim(),
          subKlasifikasiList: subArray
        }
      ]);
    }
    setNewKlasUtama('');
    setNewSubKlas('');
    showToast('Klasifikasi & Sub-Klasifikasi ditambahkan', 'success');
  };

  const handleUpdateKlasifikasi = (id: string) => {
    if (!editKlasUtama.trim() || !editSubKlas.trim()) {
      showToast('Klasifikasi Utama dan Sub Klasifikasi harus diisi', 'error');
      return;
    }
    const subArray = editSubKlas
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setKlasifikasiSub(
      klasifikasiSub.map((item) =>
        item.id === id
          ? { ...item, klasifikasiUtama: editKlasUtama.trim(), subKlasifikasiList: subArray }
          : item
      )
    );
    setEditingKlasifikasiId(null);
    setEditKlasUtama('');
    setEditSubKlas('');
    showToast('Klasifikasi & Sub-Klasifikasi berhasil diperbarui', 'success');
  };

  const handleDeleteKlasifikasi = (id: string) => {
    setKlasifikasiSub(klasifikasiSub.filter((k) => k.id !== id));
    showToast('Klasifikasi dihapus', 'info');
  };

  // --- Handlers for Sub-Klasifikasi Specific Operations ---
  const handleCreateSubKlasifikasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentForSub) {
      showToast('Pilih Klasifikasi Utama (Induk) terlebih dahulu', 'error');
      return;
    }
    const subNames = newSubNameInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (subNames.length === 0) {
      showToast('Masukkan minimal satu nama sub-klasifikasi', 'error');
      return;
    }

    setKlasifikasiSub((prev) =>
      prev.map((k) => {
        if (k.id === selectedParentForSub) {
          return {
            ...k,
            subKlasifikasiList: Array.from(new Set([...k.subKlasifikasiList, ...subNames]))
          };
        }
        return k;
      })
    );

    setNewSubNameInput('');
    setActiveAddForm('none');
    showToast(`${subNames.length} Sub-Klasifikasi berhasil disimpan`, 'success');
  };

  const handleAddParentOnly = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newParentOnlyName.trim();
    if (!trimmed) {
      showToast('Nama Klasifikasi Utama tidak boleh kosong', 'error');
      return;
    }
    if (klasifikasiSub.some((k) => k.klasifikasiUtama.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Klasifikasi Utama sudah ada dalam daftar', 'error');
      return;
    }
    const initialSubs = newParentInitialSubs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setKlasifikasiSub([
      ...klasifikasiSub,
      {
        id: 'klas-' + Date.now(),
        klasifikasiUtama: trimmed,
        subKlasifikasiList: initialSubs
      }
    ]);
    setNewParentOnlyName('');
    setNewParentInitialSubs('');
    setActiveAddForm('none');
    showToast(`Klasifikasi Utama "${trimmed}" berhasil ditambahkan`, 'success');
  };

  const handleAddInlineSub = (parentId: string) => {
    const raw = (inlineNewSub[parentId] || '').trim();
    if (!raw) {
      showToast('Ketik nama sub-klasifikasi terlebih dahulu', 'error');
      return;
    }
    const subs = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (subs.length === 0) return;

    setKlasifikasiSub((prev) =>
      prev.map((k) => {
        if (k.id === parentId) {
          return {
            ...k,
            subKlasifikasiList: Array.from(new Set([...k.subKlasifikasiList, ...subs]))
          };
        }
        return k;
      })
    );
    setInlineNewSub((prev) => ({ ...prev, [parentId]: '' }));
    showToast(`${subs.length} Sub-Klasifikasi berhasil ditambahkan`, 'success');
  };

  const handleToggleExpand = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: prev[parentId] === undefined ? false : !prev[parentId]
    }));
  };

  const handleToggleAllParents = () => {
    const allExpanded = klasifikasiSub.every((k) => expandedParents[k.id] !== false);
    const nextState: { [id: string]: boolean } = {};
    klasifikasiSub.forEach((k) => {
      nextState[k.id] = !allExpanded;
    });
    setExpandedParents(nextState);
  };

  const handleDeleteSingleSub = (parentId: string, subName: string) => {
    setKlasifikasiSub((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subKlasifikasiList: item.subKlasifikasiList.filter((s) => s !== subName)
            }
          : item
      )
    );
    showToast(`Sub-Klasifikasi "${subName}" berhasil dihapus`, 'info');
  };

  const handleStartEditSingleSub = (parentId: string, subName: string) => {
    setEditingSubItem({ parentId, oldSub: subName });
    setEditSubItemValue(subName);
    setEditSubItemTargetParentId(parentId);
  };

  const handleSaveEditSingleSub = () => {
    if (!editingSubItem) return;
    const trimmed = editSubItemValue.trim();
    if (!trimmed) {
      showToast('Nama Sub-Klasifikasi tidak boleh kosong', 'error');
      return;
    }

    const currentParentId = editingSubItem.parentId;
    const targetParentId = editSubItemTargetParentId || currentParentId;

    if (targetParentId === currentParentId) {
      setKlasifikasiSub((prev) =>
        prev.map((item) =>
          item.id === currentParentId
            ? {
                ...item,
                subKlasifikasiList: item.subKlasifikasiList.map((s) =>
                  s === editingSubItem.oldSub ? trimmed : s
                )
              }
            : item
        )
      );
    } else {
      setKlasifikasiSub((prev) =>
        prev.map((item) => {
          if (item.id === currentParentId) {
            return {
              ...item,
              subKlasifikasiList: item.subKlasifikasiList.filter((s) => s !== editingSubItem.oldSub)
            };
          }
          if (item.id === targetParentId) {
            return {
              ...item,
              subKlasifikasiList: Array.from(new Set([...item.subKlasifikasiList, trimmed]))
            };
          }
          return item;
        })
      );
    }

    setEditingSubItem(null);
    setEditSubItemValue('');
    setEditSubItemTargetParentId('');
    showToast('Sub-Klasifikasi berhasil diperbarui', 'success');
  };

  // --- Handlers for Klasifikasi Arsip (Kode Arsip) ---
  const handleAddKlasifikasiArsip = (e: React.FormEvent) => {
    e.preventDefault();
    const kode = newKodeArsip.trim();
    const nama = newNamaKlasArsip.trim();
    if (!kode || !nama) {
      showToast('Kode Klasifikasi dan Nama Klasifikasi wajib diisi', 'error');
      return;
    }
    const exists = klasifikasiArsipList.some((k) => k.kodeKlasifikasi.toLowerCase() === kode.toLowerCase());
    if (exists) {
      showToast(`Kode Klasifikasi Arsip "${kode}" sudah ada`, 'error');
      return;
    }

    const newItem: KlasifikasiArsipItem = {
      id: `ka-${Date.now()}`,
      kodeKlasifikasi: kode,
      namaKlasifikasi: nama,
      deskripsi: newDeskripsiArsip.trim(),
      retensiAktif: Number(newRetensiAktif) || 2,
      retensiInaktif: Number(newRetensiInaktif) || 5,
      nasibAkhir: newNasibAkhir,
      createdAt: new Date().toISOString()
    };

    setKlasifikasiArsipList([...klasifikasiArsipList, newItem]);
    setNewKodeArsip('');
    setNewNamaKlasArsip('');
    setNewDeskripsiArsip('');
    showToast(`Klasifikasi Arsip "${kode} - ${nama}" berhasil ditambahkan!`, 'success');
  };

  const handleStartEditArsip = (item: KlasifikasiArsipItem) => {
    setEditingArsipId(item.id);
    setEditKodeArsip(item.kodeKlasifikasi);
    setEditNamaKlasArsip(item.namaKlasifikasi);
    setEditDeskripsiArsip(item.deskripsi || '');
    setEditRetensiAktif(item.retensiAktif || 2);
    setEditRetensiInaktif(item.retensiInaktif || 5);
    setEditNasibAkhir(item.nasibAkhir || 'Permanen');
  };

  const handleSaveEditArsip = (id: string) => {
    const kode = editKodeArsip.trim();
    const nama = editNamaKlasArsip.trim();
    if (!kode || !nama) {
      showToast('Kode dan Nama Klasifikasi tidak boleh kosong', 'error');
      return;
    }

    setKlasifikasiArsipList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              kodeKlasifikasi: kode,
              namaKlasifikasi: nama,
              deskripsi: editDeskripsiArsip.trim(),
              retensiAktif: Number(editRetensiAktif) || 2,
              retensiInaktif: Number(editRetensiInaktif) || 5,
              nasibAkhir: editNasibAkhir
            }
          : item
      )
    );

    setEditingArsipId(null);
    showToast('Klasifikasi Arsip berhasil diperbarui', 'success');
  };

  const handleDeleteKlasifikasiArsip = (item: KlasifikasiArsipItem) => {
    setArsipToDelete(item);
  };

  const handleConfirmDeleteArsip = () => {
    if (!arsipToDelete) return;
    const { id, kodeKlasifikasi } = arsipToDelete;
    setKlasifikasiArsipList((prev) => prev.filter((item) => item.id !== id));
    showToast(`Klasifikasi Arsip "${kodeKlasifikasi}" berhasil dihapus`, 'info');
    setArsipToDelete(null);
  };

  const handleSaveThreadConfigInMaster = (e: React.FormEvent) => {
    e.preventDefault();
    setThreadNumberConfig({
      prefix: masterConfigPrefix.trim() || 'TH',
      separator: '-',
      format: masterConfigFormat.trim() || '[PREFIX]-[YYYY]-[COUNTER]',
      counterDigits: Number(masterConfigDigits) || 4,
      currentCounter: Number(masterConfigCounter) || 1,
      resetPeriod: masterConfigReset as any,
      lastResetYear: new Date().getFullYear(),
      lastResetMonth: new Date().getMonth() + 1
    });
    showToast('Pengaturan Format Nomor Thread Otomatis berhasil disimpan!', 'success');
  };

  // --- Handlers for Status Penyelesaian & Kirim ---
  const handleAddStatusSelesai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusSelesai.trim()) return;
    setStatusPenyelesaian([...statusPenyelesaian, newStatusSelesai.trim()]);
    setNewStatusSelesai('');
    showToast('Status penyelesaian ditambahkan', 'success');
  };

  const handleUpdateStatusSelesai = (oldStatus: string) => {
    const trimmed = editStatusSelesaiValue.trim();
    if (!trimmed) {
      showToast('Status tidak boleh kosong', 'error');
      return;
    }
    setStatusPenyelesaian(statusPenyelesaian.map((s) => (s === oldStatus ? trimmed : s)));
    setEditingStatusSelesai(null);
    setEditStatusSelesaiValue('');
    showToast('Status penyelesaian berhasil diperbarui', 'success');
  };

  const handleAddStatusKirim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusKirim.trim()) return;
    setStatusKirim([...statusKirim, newStatusKirim.trim()]);
    setNewStatusKirim('');
    showToast('Status kirim ditambahkan', 'success');
  };

  const handleUpdateStatusKirim = (oldStatus: string) => {
    const trimmed = editStatusKirimValue.trim();
    if (!trimmed) {
      showToast('Status tidak boleh kosong', 'error');
      return;
    }
    setStatusKirim(statusKirim.map((s) => (s === oldStatus ? trimmed : s)));
    setEditingStatusKirim(null);
    setEditStatusKirimValue('');
    showToast('Status kirim berhasil diperbarui', 'success');
  };

  // --- Handlers for User Roles ---
  const handleEditUser = (u: UserAccount) => {
    setEditingUserId(u.id);
    setUserNip(u.nip);
    setUserNama(u.nama);
    setUserPassword(u.password || '');
    setUserEmail(u.email || '');
    setUserUnitKerja(u.unitKerja || 'Bagian Umum');
    setUserRole(u.jenisUser);
    setUserHakAkses(
      Array.isArray(u.hakAkses) && u.hakAkses.length > 0
        ? u.hakAkses
        : u.jenisUser === 'Admin' || String(u.jenisUser || '').toLowerCase().includes('admin')
        ? ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Master Data', 'Laporan']
        : ['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Laporan']
    );
  };

  const handleResetUserForm = () => {
    setEditingUserId(null);
    setUserNip('');
    setUserNama('');
    setUserPassword('');
    setUserEmail('');
    setUserUnitKerja('Bagian Umum');
    setUserRole('Operator');
    setUserHakAkses(['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Laporan']);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNip.trim() || !userNama.trim()) {
      showToast('NIP dan Nama Pengguna wajib diisi', 'error');
      return;
    }

    if (editingUserId) {
      setUsers(
        users.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                nip: userNip.trim(),
                nama: userNama.trim(),
                password: userPassword.trim(),
                email: userEmail.trim() || undefined,
                unitKerja: userUnitKerja.trim(),
                jenisUser: userRole,
                hakAkses: userHakAkses
              }
            : u
        )
      );
      showToast('Pengaturan role & user berhasil diperbarui', 'success');
    } else {
      const newUser: UserAccount = {
        id: 'usr-' + Date.now(),
        nip: userNip.trim(),
        nama: userNama.trim(),
        password: userPassword.trim(),
        email: userEmail.trim() || undefined,
        unitKerja: userUnitKerja.trim(),
        jenisUser: userRole,
        hakAkses: userHakAkses
      };
      setUsers([...users, newUser]);
      showToast('User baru berhasil ditambahkan', 'success');
    }
    handleResetUserForm();
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      showToast('Minimal harus ada 1 pengguna di sistem', 'error');
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
    if (editingUserId === id) handleResetUserForm();
    showToast('User dihapus', 'info');
  };

  const toggleHakAkses = (item: string) => {
    const currentList = Array.isArray(userHakAkses) ? userHakAkses : [];
    if (currentList.includes(item)) {
      setUserHakAkses(currentList.filter((i) => i !== item));
    } else {
      setUserHakAkses([...currentList, item]);
    }
  };

  // --- Export and Import Database from Google Sheet (Excel format) ---
  const handleExportGoogleSheetExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Master Dropdowns Sheet
      const wsDropdowns = XLSX.utils.json_to_sheet([
        ...jenisNaskahMasuk.map((j) => ({ Kategori: 'Jenis Naskah Masuk', Nilai: j })),
        ...jenisNaskahKeluar.map((j) => ({ Kategori: 'Jenis Naskah Keluar', Nilai: j })),
        ...unitKerjaList.map((u) => ({ Kategori: 'Unit Kerja', Nilai: u })),
        ...statusPenyelesaian.map((s) => ({ Kategori: 'Status Penyelesaian', Nilai: s })),
        ...statusKirim.map((s) => ({ Kategori: 'Status Kirim', Nilai: s }))
      ]);
      XLSX.utils.book_append_sheet(wb, wsDropdowns, 'MASTER DROPDOWN');

      // Instansi Wilayah Sheet
      const wsInstansi = XLSX.utils.json_to_sheet(instansiWilayah);
      XLSX.utils.book_append_sheet(wb, wsInstansi, 'INSTANSI & WILAYAH');

      // Klasifikasi Sheet
      const wsKlas = XLSX.utils.json_to_sheet(
        klasifikasiSub.map((k) => ({
          klasifikasiUtama: k.klasifikasiUtama,
          subKlasifikasiList: k.subKlasifikasiList.join('; ')
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsKlas, 'KLASIFIKASI & SUB');

      // Users Sheet
      const wsUsers = XLSX.utils.json_to_sheet(
        users.map((u) => ({
          NIP: u.nip,
          Nama: u.nama,
          UnitKerja: u.unitKerja || '',
          Password: u.password || '',
          Email: u.email || '',
          Role: u.jenisUser,
          HakAkses: u.hakAkses.join(', ')
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsUsers, 'USER ROLES');

      // Naskah Masuk Sheet
      const wsMasuk = XLSX.utils.json_to_sheet(naskahMasukList);
      XLSX.utils.book_append_sheet(wb, wsMasuk, 'NASKAH MASUK DB');

      // Naskah Keluar Sheet
      const wsKeluar = XLSX.utils.json_to_sheet(naskahKeluarList);
      XLSX.utils.book_append_sheet(wb, wsKeluar, 'NASKAH KELUAR DB');

      XLSX.writeFile(
        wb,
        `GoogleSheet_DB_ManagementSurat_MasterData_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast('Export Database GoogleSheet (Excel) berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data', 'error');
    }
  };

  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Parse Master Dropdowns if present
      if (workbook.SheetNames.includes('MASTER DROPDOWN')) {
        const sheet = workbook.Sheets['MASTER DROPDOWN'];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        const jMasuk = json.filter((r) => r.Kategori === 'Jenis Naskah Masuk').map((r) => r.Nilai);
        const jKeluar = json.filter((r) => r.Kategori === 'Jenis Naskah Keluar').map((r) => r.Nilai);
        const uKerja = json.filter((r) => r.Kategori === 'Unit Kerja').map((r) => r.Nilai);
        const sSelesai = json.filter((r) => r.Kategori === 'Status Penyelesaian').map((r) => r.Nilai);
        const sKirim = json.filter((r) => r.Kategori === 'Status Kirim').map((r) => r.Nilai);

        if (jMasuk.length > 0) setJenisNaskahMasuk(jMasuk);
        if (jKeluar.length > 0) setJenisNaskahKeluar(jKeluar);
        if (uKerja.length > 0) setUnitKerjaList(uKerja);
        if (sSelesai.length > 0) setStatusPenyelesaian(sSelesai);
        if (sKirim.length > 0) setStatusKirim(sKirim);
      }

      // Parse Instansi Wilayah if present
      let importedInstansi: InstansiWilayah[] | undefined;
      if (workbook.SheetNames.includes('INSTANSI & WILAYAH')) {
        const sheet = workbook.Sheets['INSTANSI & WILAYAH'];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          importedInstansi = json.map((row, idx) => ({
            id: row.id || `ins-${idx}-${Date.now()}`,
            instansi: row.instansi || '',
            wilayahKerja: row.wilayahKerja || ''
          }));
          setInstansiWilayah(importedInstansi);
        }
      }

      // Parse Klasifikasi & Sub if present
      let importedKlasifikasi: KlasifikasiSub[] | undefined;
      if (workbook.SheetNames.includes('KLASIFIKASI & SUB')) {
        const sheet = workbook.Sheets['KLASIFIKASI & SUB'];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          importedKlasifikasi = json.map((row, idx) => {
            const rawSub = row.subKlasifikasiList || row.subKlasifikasi || '';
            const subList = typeof rawSub === 'string'
              ? rawSub.split(';').map((s: string) => s.trim()).filter(Boolean)
              : Array.isArray(rawSub) ? rawSub : [];
            return {
              id: row.id || `klas-${idx}-${Date.now()}`,
              klasifikasiUtama: row.klasifikasiUtama || '',
              subKlasifikasiList: subList
            };
          });
          setKlasifikasiSub(importedKlasifikasi);
        }
      }

      // Parse User Roles if present
      if (workbook.SheetNames.includes('USER ROLES')) {
        const sheet = workbook.Sheets['USER ROLES'];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          const parsedUsers = json.map((row, idx) => {
            const rawAkses = row.HakAkses || row.hakAkses || '';
            const hakAkses = typeof rawAkses === 'string'
              ? rawAkses.split(',').map((s: string) => s.trim()).filter(Boolean)
              : ['Dashboard', 'Naskah Masuk', 'Naskah Keluar'];
            return {
              id: row.id || `usr-${idx}-${Date.now()}`,
              nip: String(row.NIP || row.nip || ''),
              nama: String(row.Nama || row.nama || ''),
              password: String(row.Password || row.password || 'user'),
              email: row.Email || row.email || undefined,
              unitKerja: row.UnitKerja || row.unitKerja || 'Bagian Umum',
              jenisUser: (row.Role || row.jenisUser || 'Operator') as any,
              hakAkses
            };
          });
          setUsers(parsedUsers);
        }
      }

      // Parse Naskah Masuk if present
      let importedMasuk: NaskahMasukItem[] | undefined;
      if (workbook.SheetNames.includes('NASKAH MASUK DB') || workbook.SheetNames.includes('NASKAH MASUK')) {
        const sheet = workbook.Sheets['NASKAH MASUK DB'] || workbook.Sheets['NASKAH MASUK'];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          importedMasuk = json.map((row, idx) => ({
            id: `masuk-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            tglTerima: String(row.tglTerima || row['Tanggal Terima'] || ''),
            tglNaskah: String(row.tglNaskah || row['Tanggal Naskah'] || ''),
            nomorNaskah: String(row.nomorNaskah || row['Nomor Naskah'] || ''),
            perihal: String(row.perihal || row['Perihal'] || ''),
            jenisNaskah: String(row.jenisNaskah || row['Jenis Naskah'] || 'Surat Biasa'),
            unitKerja: String(row.unitKerja || row['Unit Kerja'] || 'Bagian Umum'),
            pengirimNaskah: String(row.pengirimNaskah || row['Pengirim Naskah'] || ''),
            instansiTerkait: String(row.instansiTerkait || row['Instansi Terkait'] || ''),
            wilayahKerja: String(row.wilayahKerja || row['Wilayah Kerja'] || ''),
            klasifikasiUtama: String(row.klasifikasiUtama || row['Klasifikasi Utama'] || ''),
            subKlasifikasi: String(row.subKlasifikasi || row['Sub Klasifikasi'] || ''),
            statusPenyelesaian: String(row.statusPenyelesaian || row['Status Penyelesaian'] || 'Belum Diproses'),
            sla: Number(row.sla || row['SLA (Hari)']) || 3,
            fileLinkNaskahMasuk: String(row.fileLinkNaskahMasuk || row['Link Naskah Masuk'] || ''),
            fileLinkNaskahDijawab: String(row.fileLinkNaskahDijawab || row['Link Naskah Dijawab'] || ''),
            createdBy: currentUser?.nip || '198901012010011001',
            createdByName: currentUser?.nama || 'Riswan Anas',
            createdAt: new Date().toISOString()
          }));
          saveNaskahMasukDirectly([...importedMasuk, ...naskahMasukList]);
        }
      }

      showToast('Import Database dari GoogleSheet/Excel berhasil diproses!', 'success');
      await syncWithGoogleSheets({
        naskahMasuk: importedMasuk ? [...importedMasuk, ...naskahMasukList] : undefined,
        instansiWilayah: importedInstansi,
        klasifikasiSub: importedKlasifikasi
      });
    } catch (err) {
      console.error(err);
      showToast('File Excel tidak valid atau format sheet berbeda', 'error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs = [
    { id: 'jenisMasuk', label: '1. Jenis Naskah Masuk', icon: <FileText className="w-4 h-4" /> },
    { id: 'jenisKeluar', label: '2. Jenis Naskah Keluar', icon: <FileText className="w-4 h-4" /> },
    { id: 'unitKerja', label: '3. Unit Kerja Pengelola', icon: <Building2 className="w-4 h-4" /> },
    { id: 'instansi', label: '4. Instansi & Wilayah Kerja', icon: <Building2 className="w-4 h-4" /> },
    { id: 'klasifikasi', label: '5. Sub-Klasifikasi Arsip', icon: <Tag className="w-4 h-4" /> },
    { id: 'klasifikasiArsip', label: '6. Kode Klasifikasi Arsip (Master)', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'status', label: '7. Status Penyelesaian & Kirim', icon: <CheckCircle2 className="w-4 h-4" /> }
  ] as const;

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 text-emerald-200 text-xs font-bold mb-2">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Menu Pengaturan Master Data • Supabase Cloud DB</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Setting Database “Master Data”
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              Mengatur data dropdown yang bisa diubah sesuai kebutuhan Form Naskah Masuk & Form Naskah Keluar, Pengaturan Role User, serta Ekspor & Impor Database Excel.
            </p>
          </div>

          {/* Export & Import Excel Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportGoogleSheetExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all border border-emerald-400/40 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel Database</span>
            </button>

            <label className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Import Excel Database</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcelFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs (7 items required) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-emerald-200">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-md border-t-2 border-emerald-400'
                  : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Database Dropdown Jenis Naskah Masuk */}
      {activeSection === 'jenisMasuk' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                1. Database Dropdown Jenis Naskah Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Data jenis surat yang otomatis muncul di pilihan/dropdown Form Naskah Masuk
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Total: {jenisNaskahMasuk.length} Kategori
            </span>
          </div>

          <form onSubmit={handleAddJenisMasuk} className="flex gap-3">
            <input
              type="text"
              value={newJenisMasuk}
              onChange={(e) => setNewJenisMasuk(e.target.value)}
              placeholder="Tambah Jenis Naskah Masuk baru (contoh: Surat Undangan)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                  <th className="py-3 px-4 text-center w-16">No</th>
                  <th className="py-3 px-4">Jenis Naskah Masuk</th>
                  <th className="py-3 px-4 text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {jenisNaskahMasuk.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada jenis naskah masuk. Silakan tambah data di atas.
                    </td>
                  </tr>
                ) : (
                  jenisNaskahMasuk.map((j, idx) => (
                    <tr key={`${j}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      {editingJenisMasuk === j ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editJenisMasukValue}
                              onChange={(e) => setEditJenisMasukValue(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
                              autoFocus
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateJenisMasuk(j)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                title="Simpan perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingJenisMasuk(null);
                                  setEditJenisMasukValue('');
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-800">{j}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingJenisMasuk(j);
                                  setEditJenisMasukValue(j);
                                }}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                                title="Edit jenis naskah"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJenisMasuk(j)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus jenis naskah"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: Database Dropdown Jenis Naskah Keluar */}
      {activeSection === 'jenisKeluar' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                2. Database Dropdown Jenis Naskah Keluar
              </h3>
              <p className="text-xs text-slate-500">
                Data jenis surat yang otomatis muncul di pilihan/dropdown Form Naskah Keluar
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Total: {jenisNaskahKeluar.length} Kategori
            </span>
          </div>

          <form onSubmit={handleAddJenisKeluar} className="flex gap-3">
            <input
              type="text"
              value={newJenisKeluar}
              onChange={(e) => setNewJenisKeluar(e.target.value)}
              placeholder="Tambah Jenis Naskah Keluar baru (contoh: Surat Tugas)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                  <th className="py-3 px-4 text-center w-16">No</th>
                  <th className="py-3 px-4">Jenis Naskah Keluar</th>
                  <th className="py-3 px-4 text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {jenisNaskahKeluar.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada jenis naskah keluar. Silakan tambah data di atas.
                    </td>
                  </tr>
                ) : (
                  jenisNaskahKeluar.map((j, idx) => (
                    <tr key={`${j}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      {editingJenisKeluar === j ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editJenisKeluarValue}
                              onChange={(e) => setEditJenisKeluarValue(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
                              autoFocus
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateJenisKeluar(j)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                title="Simpan perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingJenisKeluar(null);
                                  setEditJenisKeluarValue('');
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-800">{j}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingJenisKeluar(j);
                                  setEditJenisKeluarValue(j);
                                }}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                                title="Edit jenis naskah"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJenisKeluar(j)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus jenis naskah"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: Database Unit Kerja Pengelola */}
      {activeSection === 'unitKerja' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                3. Database Dropdown Unit Kerja Pengelola
              </h3>
              <p className="text-xs text-slate-500">
                Daftar unit kerja / bidang / bagian yang mengelola naskah surat dan menentukan hak akses data user
              </p>
            </div>
            <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
              Total: {unitKerjaList.length} Unit Kerja
            </span>
          </div>

          <form onSubmit={handleAddUnitKerja} className="flex gap-3">
            <input
              type="text"
              value={newUnitKerja}
              onChange={(e) => setNewUnitKerja(e.target.value)}
              placeholder="Tambah Unit Kerja baru (contoh: Bidang Pelayanan & Mutasi)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                  <th className="py-3 px-4 text-center w-16">No</th>
                  <th className="py-3 px-4">Nama Unit Kerja / Bidang</th>
                  <th className="py-3 px-4 text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitKerjaList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada unit kerja. Silakan tambah data di atas.
                    </td>
                  </tr>
                ) : (
                  unitKerjaList.map((u, idx) => (
                    <tr key={`${u}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      {editingUnitKerja === u ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editUnitKerjaValue}
                              onChange={(e) => setEditUnitKerjaValue(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-teal-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold bg-white"
                              autoFocus
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateUnitKerja(u)}
                                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                title="Simpan perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUnitKerja(null);
                                  setEditUnitKerjaValue('');
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-bold text-teal-950">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                              <span>{u}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingUnitKerja(u);
                                  setEditUnitKerjaValue(u);
                                }}
                                className="p-1.5 text-teal-700 hover:bg-teal-100 rounded-lg"
                                title="Edit Unit Kerja"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnitKerja(u)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus Unit Kerja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: Database Dropdown Instansi dan Wilayah Kerja */}
      {activeSection === 'instansi' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">
              4. Database Dropdown Instansi dan Wilayah Kerja
            </h3>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              Wilayah Kerja menginduk kepada Instansi. Misal Jika Instansi Nilainya Jakarta, Maka Wilayah Kerjanya otomatis Jadi Kanreg V (DKI Jakarta).
            </p>
          </div>

          <form onSubmit={handleAddInstansi} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newInstansi}
              onChange={(e) => setNewInstansi(e.target.value)}
              placeholder="Nama Instansi (contoh: Kanreg V BKN Jakarta)"
              className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              required
            />
            <input
              type="text"
              value={newWilayah}
              onChange={(e) => setNewWilayah(e.target.value)}
              placeholder="Wilayah Kerja Menginduk (contoh: Wilayah Kerja Kanreg V)"
              className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Instansi & Wilayah</span>
            </button>
          </form>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                  <th className="py-3 px-4 text-center w-16">No</th>
                  <th className="py-3 px-4">Instansi Terkait</th>
                  <th className="py-3 px-4">Wilayah Kerja (Menginduk)</th>
                  <th className="py-3 px-4 text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {instansiWilayah.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada data instansi dan wilayah kerja. Silakan tambah data di atas.
                    </td>
                  </tr>
                ) : (
                  instansiWilayah.map((item, idx) => (
                    <tr key={`${item.id || 'iw'}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      {editingInstansiId === item.id ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editInstansiName}
                              onChange={(e) => setEditInstansiName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="Nama Instansi"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editWilayahKerja}
                              onChange={(e) => setEditWilayahKerja(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="Wilayah Kerja"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateInstansi(item.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                title="Simpan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingInstansiId(null);
                                  setEditInstansiName('');
                                  setEditWilayahKerja('');
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-800">{item.instansi}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-800">{item.wilayahKerja}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingInstansiId(item.id);
                                  setEditInstansiName(item.instansi);
                                  setEditWilayahKerja(item.wilayahKerja);
                                }}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                                title="Edit Instansi & Wilayah"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteInstansi(item.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: Database Dropdown Klasifikasi Utama dan Sub-Klasifikasi */}
      {activeSection === 'klasifikasi' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          {/* 1. Header Informasi & Ringkasan */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-emerald-950">
                    5. Database Klasifikasi Utama & Sub-Klasifikasi
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Struktur Bertingkat
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Sub-Klasifikasi merupakan rincian naskah yang menginduk kepada Klasifikasi Utama (contoh: Induk <strong className="text-emerald-900">Kepegawaian</strong> membawahi Sub <strong className="text-emerald-900">Cuti</strong>, <strong className="text-emerald-900">Kenaikan Pangkat</strong>, dll).
                </p>
              </div>
            </div>

            {/* Total Counters */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 block">Klasifikasi Utama</span>
                <span className="text-sm font-black text-slate-800">{klasifikasiSub.length} Induk</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-700 block">Total Sub-Klasifikasi</span>
                <span className="text-sm font-black text-emerald-800">
                  {klasifikasiSub.reduce((acc, k) => acc + k.subKlasifikasiList.length, 0)} Sub
                </span>
              </div>
            </div>
          </div>

          {/* 2. Action Toolbar: Tombol Tambah & Mode Tampilan */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-2xl border border-emerald-200/80">
            {/* Action Buttons: Tambah Cepat */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (activeAddForm === 'sub') {
                    setActiveAddForm('none');
                  } else {
                    setActiveAddForm('sub');
                    if (klasifikasiSub.length > 0 && !selectedParentForSub) {
                      setSelectedParentForSub(klasifikasiSub[0].id);
                    }
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                  activeAddForm === 'sub'
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {activeAddForm === 'sub' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{activeAddForm === 'sub' ? 'Tutup Form' : '+ Tambah Sub-Klasifikasi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAddForm(activeAddForm === 'parent' ? 'none' : 'parent')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                  activeAddForm === 'parent'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {activeAddForm === 'parent' ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4 text-emerald-700" />}
                <span>{activeAddForm === 'parent' ? 'Tutup Form' : '+ Tambah Klasifikasi Induk'}</span>
              </button>

              {klasViewMode === 'grouped' && (
                <button
                  type="button"
                  onClick={handleToggleAllParents}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-xl transition-colors ml-1"
                >
                  {klasifikasiSub.every((k) => expandedParents[k.id] !== false)
                    ? 'Tutup Semua Rincian'
                    : 'Buka Semua Rincian'}
                </button>
              )}
            </div>

            {/* View Mode Toggle: Grouped vs Flat Master Table */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-200 shadow-xs">
              <button
                type="button"
                onClick={() => setKlasViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  klasViewMode === 'grouped'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-50'
                }`}
                title="Tampilan hierarki terstruktur per kategori klasifikasi induk"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Per Kategori Induk</span>
              </button>

              <button
                type="button"
                onClick={() => setKlasViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  klasViewMode === 'flat'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-50'
                }`}
                title="Tabel rekapitulasi seluruh sub-klasifikasi dalam satu tabel lengkap"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Rekap Semua Sub</span>
              </button>
            </div>
          </div>

          {/* 3. Panel Tambah Data (Sub atau Induk) - Sangat Jelas dan Tidak Membingungkan */}
          {activeAddForm === 'sub' && (
            <div className="p-5 bg-emerald-50/90 rounded-2xl border-2 border-emerald-400 shadow-sm animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950">
                      Formulir Tambah Sub-Klasifikasi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pilih Klasifikasi Induk tempat Sub-Klasifikasi ini menginduk.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAddForm('none')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubKlasifikasi} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Klasifikasi Utama (Induk) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedParentForSub}
                    onChange={(e) => setSelectedParentForSub(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    required
                  >
                    <option value="">-- Pilih Klasifikasi Utama --</option>
                    {klasifikasiSub.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.klasifikasiUtama} ({k.subKlasifikasiList.length} sub)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Sub-Klasifikasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubNameInput}
                    onChange={(e) => setNewSubNameInput(e.target.value)}
                    placeholder="Contoh: Pengaduan Disiplin Pegawai (bisa koma untuk banyak)"
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Sub</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeAddForm === 'parent' && (
            <div className="p-5 bg-teal-50/90 rounded-2xl border-2 border-teal-400 shadow-sm animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-700 text-white rounded-lg">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-teal-950">
                      Formulir Tambah Klasifikasi Utama (Induk)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Buat kelompok induk baru untuk menampung sub-klasifikasi terkait.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAddForm('none')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddParentOnly} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Klasifikasi Utama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newParentOnlyName}
                    onChange={(e) => setNewParentOnlyName(e.target.value)}
                    placeholder="Contoh: KP - Kepegawaian atau Keuangan"
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 shadow-xs"
                    required
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-Klasifikasi Awal <span className="text-slate-400 font-normal">(Opsional, pisahkan koma)</span>
                  </label>
                  <input
                    type="text"
                    value={newParentInitialSubs}
                    onChange={(e) => setNewParentInitialSubs(e.target.value)}
                    placeholder="Contoh: Cuti Pegawai, Kenaikan Pangkat, Mutasi"
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Induk</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subKlasSearch}
                onChange={(e) => setSubKlasSearch(e.target.value)}
                placeholder="Cari nama sub-klasifikasi atau klasifikasi induk..."
                className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {subKlasSearch && (
                <button
                  type="button"
                  onClick={() => setSubKlasSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {klasViewMode === 'flat' && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-bold text-slate-600">Filter Induk:</span>
                <select
                  value={subKlasFilterParent}
                  onChange={(e) => setSubKlasFilterParent(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none shadow-xs max-w-[200px] truncate"
                >
                  <option value="ALL">Semua Klasifikasi Utama</option>
                  {klasifikasiSub.map((k) => (
                    <option key={k.id} value={k.klasifikasiUtama}>
                      {k.klasifikasiUtama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(subKlasSearch || (klasViewMode === 'flat' && subKlasFilterParent !== 'ALL')) && (
              <button
                type="button"
                onClick={() => {
                  setSubKlasSearch('');
                  setSubKlasFilterParent('ALL');
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                Reset Pencarian
              </button>
            )}
          </div>

          {/* 5A. VIEW MODE 1: GROUPED PER KATEGORI INDUK DENGAN TABEL SUB-KLASIFIKASI LENGKAP */}
          {klasViewMode === 'grouped' && (
            <div className="space-y-5">
              {(() => {
                const searchQ = subKlasSearch.toLowerCase().trim();
                const filteredParents = klasifikasiSub.filter((parent) => {
                  if (!searchQ) return true;
                  const matchParent = parent.klasifikasiUtama.toLowerCase().includes(searchQ);
                  const matchSub = parent.subKlasifikasiList.some((s) => s.toLowerCase().includes(searchQ));
                  return matchParent || matchSub;
                });

                if (filteredParents.length === 0) {
                  return (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">Tidak ada klasifikasi yang cocok</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Coba gunakan kata kunci pencarian yang lain atau tambah data baru di atas.
                      </p>
                    </div>
                  );
                }

                return filteredParents.map((parent, pIdx) => {
                  const isExpanded = expandedParents[parent.id] !== false; // default expanded
                  const isEditingParent = editingKlasifikasiId === parent.id;

                  // Filter sub-classifications if search is active
                  const displayedSubs = searchQ
                    ? parent.subKlasifikasiList.filter(
                        (s) => s.toLowerCase().includes(searchQ) || parent.klasifikasiUtama.toLowerCase().includes(searchQ)
                      )
                    : parent.subKlasifikasiList;

                  // Compute total letters for this parent
                  const parentMasukCount = naskahMasukList.filter(
                    (m) => String(m.klasifikasiUtama || '').toLowerCase() === parent.klasifikasiUtama.toLowerCase()
                  ).length;
                  const parentKeluarCount = naskahKeluarList.filter(
                    (k) => String(k.klasifikasiUtama || '').toLowerCase() === parent.klasifikasiUtama.toLowerCase()
                  ).length;
                  const parentTotalLetters = parentMasukCount + parentKeluarCount;

                  return (
                    <div
                      key={parent.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white transition-all"
                    >
                      {/* Parent Category Header */}
                      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(parent.id)}
                            className="p-1 rounded-lg hover:bg-white/20 text-emerald-200 transition-colors"
                            title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian'}
                          >
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white rotate-180" />}
                          </button>

                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-xs font-black flex items-center justify-center">
                              {pIdx + 1}
                            </span>

                            {isEditingParent ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editKlasUtama}
                                  onChange={(e) => setEditKlasUtama(e.target.value)}
                                  className="px-3 py-1 bg-white text-slate-900 text-xs font-bold rounded-lg border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[240px]"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateKlasifikasi(parent.id)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingKlasifikasiId(null);
                                    setEditKlasUtama('');
                                  }}
                                  className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-extrabold text-white tracking-wide">
                                  {parent.klasifikasiUtama}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingKlasifikasiId(parent.id);
                                    setEditKlasUtama(parent.klasifikasiUtama);
                                    setEditSubKlas(parent.subKlasifikasiList.join(', '));
                                  }}
                                  className="p-1 rounded-md text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
                                  title="Edit Nama Klasifikasi Induk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKlasifikasi(parent.id)}
                                  className="p-1 rounded-md text-rose-300 hover:text-white hover:bg-rose-600/30 transition-colors"
                                  title="Hapus Klasifikasi Induk beserta Sub-nya"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badges on right side of Parent header */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-[11px] font-bold bg-emerald-800/80 text-emerald-100 border border-emerald-600/50 px-3 py-1 rounded-lg">
                            {parent.subKlasifikasiList.length} Sub-Klasifikasi
                          </span>
                          <span className="text-[11px] font-bold bg-teal-800/80 text-teal-100 border border-teal-600/50 px-3 py-1 rounded-lg">
                            {parentTotalLetters} Surat Terkait
                          </span>
                        </div>
                      </div>

                      {/* Sub-Classification Table inside Parent */}
                      {isExpanded && (
                        <div className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                                  <th className="py-2.5 px-3.5 text-center w-12">No</th>
                                  <th className="py-2.5 px-4">Nama Sub-Klasifikasi</th>
                                  <th className="py-2.5 px-3 text-center w-28">Naskah Masuk</th>
                                  <th className="py-2.5 px-3 text-center w-28">Naskah Keluar</th>
                                  <th className="py-2.5 px-3 text-center w-28">Total Surat</th>
                                  <th className="py-2.5 px-4 text-right w-28">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {displayedSubs.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                      Belum ada sub-klasifikasi untuk kategori ini. Tambahkan langsung melalui baris di bawah.
                                    </td>
                                  </tr>
                                ) : (
                                  displayedSubs.map((subName, sIdx) => {
                                    const isEditingThisSub =
                                      editingSubItem?.parentId === parent.id && editingSubItem?.oldSub === subName;

                                    const countMasuk = naskahMasukList.filter(
                                      (m) =>
                                        String(m.klasifikasiUtama || '').toLowerCase() === parent.klasifikasiUtama.toLowerCase() &&
                                        String(m.subKlasifikasi || '').toLowerCase() === subName.toLowerCase()
                                    ).length;

                                    const countKeluar = naskahKeluarList.filter(
                                      (k) =>
                                        String(k.klasifikasiUtama || '').toLowerCase() === parent.klasifikasiUtama.toLowerCase() &&
                                        String(k.subKlasifikasi || '').toLowerCase() === subName.toLowerCase()
                                    ).length;

                                    const totalSurat = countMasuk + countKeluar;

                                    return (
                                      <tr
                                        key={`${parent.id}-${sIdx}-${subName}`}
                                        className={`hover:bg-emerald-50/40 transition-colors ${
                                          isEditingThisSub ? 'bg-emerald-50/80' : ''
                                        }`}
                                      >
                                        <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">
                                          {sIdx + 1}
                                        </td>

                                        {/* Sub-Classification Name */}
                                        <td className="py-2.5 px-4 font-bold text-slate-900">
                                          {isEditingThisSub ? (
                                            <input
                                              type="text"
                                              value={editSubItemValue}
                                              onChange={(e) => setEditSubItemValue(e.target.value)}
                                              className="w-full max-w-md px-3 py-1 border border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                              autoFocus
                                            />
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                                              <span>{subName}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* Masuk Count */}
                                        <td className="py-2.5 px-3 text-center">
                                          {countMasuk > 0 ? (
                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                              {countMasuk}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300">0</span>
                                          )}
                                        </td>

                                        {/* Keluar Count */}
                                        <td className="py-2.5 px-3 text-center">
                                          {countKeluar > 0 ? (
                                            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                              {countKeluar}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300">0</span>
                                          )}
                                        </td>

                                        {/* Total Surat */}
                                        <td className="py-2.5 px-3 text-center">
                                          <span
                                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                              totalSurat > 0
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}
                                          >
                                            {totalSurat} Surat
                                          </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-2.5 px-4 text-right">
                                          {isEditingThisSub ? (
                                            <div className="flex items-center justify-end gap-1">
                                              <button
                                                type="button"
                                                onClick={handleSaveEditSingleSub}
                                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                                                title="Simpan"
                                              >
                                                <Save className="w-3.5 h-3.5" />
                                                <span>Simpan</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingSubItem(null)}
                                                className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
                                                title="Batal"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-end gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleStartEditSingleSub(parent.id, subName)}
                                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                                title="Edit Sub-Klasifikasi"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteSingleSub(parent.id, subName)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Hapus Sub-Klasifikasi"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Quick Inline Add Row under each parent table */}
                          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              value={inlineNewSub[parent.id] || ''}
                              onChange={(e) =>
                                setInlineNewSub((prev) => ({ ...prev, [parent.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddInlineSub(parent.id);
                                }
                              }}
                              placeholder={`+ Ketik nama Sub-Klasifikasi baru untuk ${parent.klasifikasiUtama}... (Tekan Enter)`}
                              className="flex-1 w-full px-3.5 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddInlineSub(parent.id)}
                              className="w-full sm:w-auto px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Sub</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* 5B. VIEW MODE 2: TABEL REKAP SEMUA SUB-KLASIFIKASI (FLAT MASTER TABLE) */}
          {klasViewMode === 'flat' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white uppercase text-[11px] font-extrabold tracking-wider">
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-4 w-1/3">Nama Sub-Klasifikasi</th>
                      <th className="py-3 px-4">Klasifikasi Utama (Induk)</th>
                      <th className="py-3 px-3 text-center">Naskah Masuk</th>
                      <th className="py-3 px-3 text-center">Naskah Keluar</th>
                      <th className="py-3 px-3 text-center">Total Terpakai</th>
                      <th className="py-3 px-4 text-right w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const allSubRows = klasifikasiSub.flatMap((parent) =>
                        parent.subKlasifikasiList.map((sub, sIdx) => ({
                          key: `${parent.id}-${sIdx}-${sub}`,
                          parentId: parent.id,
                          parentName: parent.klasifikasiUtama,
                          subName: sub
                        }))
                      );

                      const filteredSubRows = allSubRows.filter((item) => {
                        if (subKlasFilterParent !== 'ALL' && item.parentName !== subKlasFilterParent) {
                          return false;
                        }
                        if (subKlasSearch.trim()) {
                          const q = subKlasSearch.toLowerCase().trim();
                          const matchSub = item.subName.toLowerCase().includes(q);
                          const matchParent = item.parentName.toLowerCase().includes(q);
                          if (!matchSub && !matchParent) return false;
                        }
                        return true;
                      });

                      if (filteredSubRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center">
                                <Table className="w-8 h-8 text-slate-300 mb-2" />
                                <span className="font-bold text-slate-600 text-sm">
                                  Belum ada Sub-Klasifikasi yang cocok
                                </span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                  {subKlasSearch || subKlasFilterParent !== 'ALL'
                                    ? 'Coba bersihkan pencarian atau ubah filter klasifikasi induk di atas.'
                                    : 'Gunakan tombol "+ Tambah Sub-Klasifikasi" di atas untuk menambahkan data.'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return filteredSubRows.map((row, idx) => {
                        const countMasuk = naskahMasukList.filter(
                          (m) =>
                            String(m.klasifikasiUtama || '').toLowerCase() === row.parentName.toLowerCase() &&
                            String(m.subKlasifikasi || '').toLowerCase() === row.subName.toLowerCase()
                        ).length;

                        const countKeluar = naskahKeluarList.filter(
                          (k) =>
                            String(k.klasifikasiUtama || '').toLowerCase() === row.parentName.toLowerCase() &&
                            String(k.subKlasifikasi || '').toLowerCase() === row.subName.toLowerCase()
                        ).length;

                        const totalUsage = countMasuk + countKeluar;
                        const isEditingThis =
                          editingSubItem?.parentId === row.parentId && editingSubItem?.oldSub === row.subName;

                        return (
                          <tr
                            key={row.key}
                            className={`hover:bg-emerald-50/50 transition-colors ${
                              isEditingThis ? 'bg-emerald-50/80' : ''
                            }`}
                          >
                            <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Nama Sub-Klasifikasi */}
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {isEditingThis ? (
                                <input
                                  type="text"
                                  value={editSubItemValue}
                                  onChange={(e) => setEditSubItemValue(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                                  <span>{row.subName}</span>
                                </div>
                              )}
                            </td>

                            {/* Klasifikasi Utama (Induk) */}
                            <td className="py-3 px-4">
                              {isEditingThis ? (
                                <select
                                  value={editSubItemTargetParentId}
                                  onChange={(e) => setEditSubItemTargetParentId(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                  {klasifikasiSub.map((k) => (
                                    <option key={k.id} value={k.id}>
                                      {k.klasifikasiUtama}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                                  <Tag className="w-3 h-3 text-emerald-700" />
                                  <span>{row.parentName}</span>
                                </span>
                              )}
                            </td>

                            {/* Count Masuk */}
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {countMasuk > 0 ? (
                                <span className="text-emerald-700 font-bold">{countMasuk}</span>
                              ) : (
                                <span className="text-slate-300">0</span>
                              )}
                            </td>

                            {/* Count Keluar */}
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {countKeluar > 0 ? (
                                <span className="text-sky-700 font-bold">{countKeluar}</span>
                              ) : (
                                <span className="text-slate-300">0</span>
                              )}
                            </td>

                            {/* Total Usage */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                  totalUsage > 0
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {totalUsage} Surat
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              {isEditingThis ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditSingleSub}
                                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                                    title="Simpan perubahan"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSubItem(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSingleSub(row.parentId, row.subName)}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                    title="Edit Sub-Klasifikasi"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleSub(row.parentId, row.subName)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Hapus Sub-Klasifikasi"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: Klasifikasi Arsip (Kode Arsip & Kearsipan) */}
      {activeSection === 'klasifikasiArsip' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl shadow-md">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-emerald-950">
                  6. Database Klasifikasi Arsip (Kode Arsip)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar Kode Klasifikasi Kearsipan (Pola Klasifikasi Arsip Dinamis) yang digunakan saat pembuatan Berkas Thread di menu Pemberkasan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-xs">
                {klasifikasiArsipList.length} Kode Arsip Terdaftar
              </span>
            </div>
          </div>

          {/* Form Tambah Kode Klasifikasi Arsip */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white rounded-2xl border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Tambah Kode Klasifikasi Arsip Baru</span>
            </div>

            <form onSubmit={handleAddKlasifikasiArsip} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Klasifikasi (Kode Arsip) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKodeArsip}
                    onChange={(e) => setNewKodeArsip(e.target.value)}
                    placeholder="Contoh: KP.01.00 atau HK.02.01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama / Uraian Klasifikasi Arsip <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNamaKlasArsip}
                    onChange={(e) => setNewNamaKlasArsip(e.target.value)}
                    placeholder="Contoh: Pengadaan dan Rekrutmen Pegawai ASN"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Retensi Aktif</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={newRetensiAktif}
                      onChange={(e) => setNewRetensiAktif(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900 text-center"
                    />
                    <span className="text-slate-500 font-bold">Thn</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Retensi Inaktif</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={newRetensiInaktif}
                      onChange={(e) => setNewRetensiInaktif(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900 text-center"
                    />
                    <span className="text-slate-500 font-bold">Thn</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-7">
                  <label className="block font-bold text-slate-700 mb-1">
                    Deskripsi / Cakupan Arsip <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={newDeskripsiArsip}
                    onChange={(e) => setNewDeskripsiArsip(e.target.value)}
                    placeholder="Rincian berkas, surat, dan dokumen yang termasuk dalam klasifikasi ini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Nasib Akhir Arsip</label>
                  <select
                    value={newNasibAkhir}
                    onChange={(e) => setNewNasibAkhir(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900"
                  >
                    <option value="Permanen">Permanen (Diserahkan ke ANRI)</option>
                    <option value="Musnah">Musnah (Selesai Retensi)</option>
                    <option value="Dinilai Kembali">Dinilai Kembali</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={arsipSearch}
                onChange={(e) => setArsipSearch(e.target.value)}
                placeholder="Cari kode klasifikasi atau uraian arsip..."
                className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {arsipSearch && (
                <button
                  type="button"
                  onClick={() => setArsipSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {
                klasifikasiArsipList.filter((ka) =>
                  !arsipSearch ||
                  ka.kodeKlasifikasi.toLowerCase().includes(arsipSearch.toLowerCase()) ||
                  ka.namaKlasifikasi.toLowerCase().includes(arsipSearch.toLowerCase())
                ).length
              } dari {klasifikasiArsipList.length} data
            </span>
          </div>

          {/* Table of Klasifikasi Arsip */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-950 text-white uppercase text-[11px] font-extrabold tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4 w-32">Kode Arsip</th>
                    <th className="py-3 px-4">Nama Klasifikasi Arsip</th>
                    <th className="py-3 px-4">Deskripsi / Cakupan</th>
                    <th className="py-3 px-3 text-center w-24">Retensi Aktif</th>
                    <th className="py-3 px-3 text-center w-24">Retensi Inaktif</th>
                    <th className="py-3 px-3 text-center w-28">Nasib Akhir</th>
                    <th className="py-3 px-4 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {klasifikasiArsipList
                    .filter((ka) =>
                      !arsipSearch ||
                      ka.kodeKlasifikasi.toLowerCase().includes(arsipSearch.toLowerCase()) ||
                      ka.namaKlasifikasi.toLowerCase().includes(arsipSearch.toLowerCase()) ||
                      (ka.deskripsi && ka.deskripsi.toLowerCase().includes(arsipSearch.toLowerCase()))
                    )
                    .map((item, idx) => {
                      const isEditing = editingArsipId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Kode */}
                          <td className="py-3 px-4 font-mono font-black text-emerald-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editKodeArsip}
                                onChange={(e) => setEditKodeArsip(e.target.value)}
                                className="w-full px-2 py-1 border border-emerald-400 rounded-lg text-xs font-bold font-mono"
                              />
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {item.kodeKlasifikasi}
                              </span>
                            )}
                          </td>

                          {/* Nama */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editNamaKlasArsip}
                                onChange={(e) => setEditNamaKlasArsip(e.target.value)}
                                className="w-full px-2 py-1 border border-emerald-400 rounded-lg text-xs font-semibold"
                              />
                            ) : (
                              item.namaKlasifikasi
                            )}
                          </td>

                          {/* Deskripsi */}
                          <td className="py-3 px-4 text-slate-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDeskripsiArsip}
                                onChange={(e) => setEditDeskripsiArsip(e.target.value)}
                                className="w-full px-2 py-1 border border-emerald-400 rounded-lg text-xs"
                              />
                            ) : (
                              item.deskripsi || '-'
                            )}
                          </td>

                          {/* Retensi Aktif */}
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={editRetensiAktif}
                                onChange={(e) => setEditRetensiAktif(Number(e.target.value))}
                                className="w-16 px-1 py-1 border border-emerald-400 rounded-lg text-xs text-center font-bold"
                              />
                            ) : (
                              `${item.retensiAktif || 2} thn`
                            )}
                          </td>

                          {/* Retensi Inaktif */}
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={editRetensiInaktif}
                                onChange={(e) => setEditRetensiInaktif(Number(e.target.value))}
                                className="w-16 px-1 py-1 border border-emerald-400 rounded-lg text-xs text-center font-bold"
                              />
                            ) : (
                              `${item.retensiInaktif || 5} thn`
                            )}
                          </td>

                          {/* Nasib Akhir */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <select
                                value={editNasibAkhir}
                                onChange={(e) => setEditNasibAkhir(e.target.value as any)}
                                className="px-1 py-1 border border-emerald-400 rounded-lg text-xs"
                              >
                                <option value="Permanen">Permanen</option>
                                <option value="Musnah">Musnah</option>
                                <option value="Dinilai Kembali">Dinilai Kembali</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  item.nasibAkhir === 'Permanen'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : item.nasibAkhir === 'Musnah'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.nasibAkhir || 'Permanen'}
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditArsip(item.id)}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingArsipId(null)}
                                  className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditArsip(item)}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Kode Klasifikasi"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKlasifikasiArsip(item)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                                  title="Hapus Kode Klasifikasi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
        </div>
      )}

      {/* SECTION 7: Pengaturan Format Nomor Thread Otomatis */}
      {activeSection === 'nomorThread' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-5">
            <div className="p-3 bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl shadow-md">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-emerald-950">
                7. Pengaturan Format Nomor Thread Otomatis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi nomor otomatis untuk setiap Berkas (Thread) baru yang dibuat pada menu Pemberkasan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveThreadConfigInMaster} className="max-w-2xl space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prefix / Awalan Nomor
                </label>
                <input
                  type="text"
                  value={masterConfigPrefix}
                  onChange={(e) => setMasterConfigPrefix(e.target.value)}
                  placeholder="Contoh: TH, BRK, atau BKS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pola Format Nomor
                </label>
                <input
                  type="text"
                  value={masterConfigFormat}
                  onChange={(e) => setMasterConfigFormat(e.target.value)}
                  placeholder="[PREFIX]-[YYYY]-[COUNTER]"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tag pengganti: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[PREFIX]</code>,{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[YYYY]</code> (tahun 4 digit),{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[YY]</code> (tahun 2 digit),{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[MM]</code> (bulan 2 digit),{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[COUNTER]</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Digit Urut</label>
                  <select
                    value={masterConfigDigits}
                    onChange={(e) => setMasterConfigDigits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
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
                    value={masterConfigCounter}
                    onChange={(e) => setMasterConfigCounter(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periode Reset Nomor Urut</label>
                <select
                  value={masterConfigReset}
                  onChange={(e) => setMasterConfigReset(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                >
                  <option value="yearly">Reset Setiap Tahun Baru (1 Januari)</option>
                  <option value="monthly">Reset Setiap Bulan Baru</option>
                  <option value="never">Tidak Pernah Reset (Lanjut Terus)</option>
                </select>
              </div>

              {/* Live Preview */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Simulasi Nomor Thread Berikutnya:
                </span>
                <span className="font-mono text-base font-black text-emerald-950 mt-1 block">
                  {masterConfigFormat
                    .replace(/\[PREFIX\]/g, masterConfigPrefix)
                    .replace(/\[YYYY\]/g, String(new Date().getFullYear()))
                    .replace(/\[YY\]/g, String(new Date().getFullYear()).slice(-2))
                    .replace(/\[MM\]/g, String(new Date().getMonth() + 1).padStart(2, '0'))
                    .replace(/\[COUNTER\]/g, String(Number(masterConfigCounter) + 1).padStart(Number(masterConfigDigits) || 4, '0'))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Nomor Thread</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 8: Database Dropdown Status Penyelesaian & Status Kirim */}
      {activeSection === 'status' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-8">
          {/* Status Penyelesaian */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-emerald-950">
              8a. Database Dropdown Status Penyelesaian (Form Naskah Masuk)
            </h3>
            <form onSubmit={handleAddStatusSelesai} className="flex gap-3">
              <input
                type="text"
                value={newStatusSelesai}
                onChange={(e) => setNewStatusSelesai(e.target.value)}
                placeholder="Tambah status penyelesaian baru..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Status</span>
              </button>
            </form>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                    <th className="py-3 px-4 text-center w-16">No</th>
                    <th className="py-3 px-4">Nama Status Penyelesaian</th>
                    <th className="py-3 px-4 text-right w-44">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {statusPenyelesaian.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 font-medium">
                        Belum ada data status penyelesaian.
                      </td>
                    </tr>
                  ) : (
                    statusPenyelesaian.map((s, idx) => (
                      <tr key={`${s}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        {editingStatusSelesai === s ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editStatusSelesaiValue}
                                onChange={(e) => setEditStatusSelesaiValue(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                                autoFocus
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateStatusSelesai(s)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                  title="Simpan"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStatusSelesai(null);
                                    setEditStatusSelesaiValue('');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Batal</span>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                                {s}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStatusSelesai(s);
                                    setEditStatusSelesaiValue(s);
                                  }}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                                  title="Edit status"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setStatusPenyelesaian(statusPenyelesaian.filter((item) => item !== s))}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Hapus status"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Status Kirim */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-emerald-950">
              8b. Database Dropdown Status Kirim (Form Naskah Keluar)
            </h3>
            <form onSubmit={handleAddStatusKirim} className="flex gap-3">
              <input
                type="text"
                value={newStatusKirim}
                onChange={(e) => setNewStatusKirim(e.target.value)}
                placeholder="Tambah status kirim baru..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Status</span>
              </button>
            </form>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                    <th className="py-3 px-4 text-center w-16">No</th>
                    <th className="py-3 px-4">Nama Status Kirim</th>
                    <th className="py-3 px-4 text-right w-44">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {statusKirim.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 font-medium">
                        Belum ada data status kirim.
                      </td>
                    </tr>
                  ) : (
                    statusKirim.map((s, idx) => (
                      <tr key={`${s}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        {editingStatusKirim === s ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editStatusKirimValue}
                                onChange={(e) => setEditStatusKirimValue(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-teal-400 rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                                autoFocus
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateStatusKirim(s)}
                                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                                  title="Simpan"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStatusKirim(null);
                                    setEditStatusKirimValue('');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 font-bold"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Batal</span>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 font-bold text-xs border border-teal-300">
                                {s}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStatusKirim(s);
                                    setEditStatusKirimValue(s);
                                  }}
                                  className="p-1.5 text-teal-700 hover:bg-teal-100 rounded-lg"
                                  title="Edit status"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setStatusKirim(statusKirim.filter((item) => item !== s))}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Hapus status"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: Pengaturan Role User yang bisa disesuaikan dan ditambahkan fungsinya */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">
              9. Pengaturan Role User Aplikasi (Jenjang Role & Unit Kerja Yang Bisa Di Akses)
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai ketentuan, hanya Admin yang bisa melihat keseluruhan data di Menu Dashboard, dan user hanya melihat data yang dikelola unit kerjanya.
            </p>
          </div>

          <form onSubmit={handleSaveUser} className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
              {editingUserId ? `Edit User (ID: ${editingUserId})` : '+ Tambah User / Role Baru'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP *</label>
                <input
                  type="text"
                  value={userNip}
                  onChange={(e) => setUserNip(e.target.value)}
                  placeholder="Contoh: 198901012010011001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={userNama}
                  onChange={(e) => setUserNama(e.target.value)}
                  placeholder="Nama Lengkap User"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Setting Password</label>
                <input
                  type="text"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Password Login"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Google (Untuk OTP)</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="contoh: akun@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja</label>
                <SearchableSelect
                  options={unitKerjaList}
                  value={userUnitKerja}
                  onChange={(val) => setUserUnitKerja(val)}
                  emptyLabel="-- Pilih Unit Kerja --"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis User (Role)</label>
                <SearchableSelect
                  options={[
                    { label: 'Admin (Hak Penuh)', value: 'Admin' },
                    { label: 'Operator', value: 'Operator' },
                    { label: 'Verifikator', value: 'Verifikator' },
                    { label: 'Public', value: 'Public' }
                  ]}
                  value={userRole}
                  onChange={(val) => setUserRole(val as any)}
                />
              </div>
            </div>

            {/* Hak Akses: Pilihan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hak Akses: Pilihan Menu
              </label>
              <div className="flex flex-wrap gap-2">
                {['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Master Data', 'Laporan', 'Rekapitulasi'].map((menu) => {
                  const checked = (Array.isArray(userHakAkses) ? userHakAkses : []).includes(menu);
                  return (
                    <button
                      key={menu}
                      type="button"
                      onClick={() => toggleHakAkses(menu)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        checked
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '}
                      {menu}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                {editingUserId ? 'Simpan Perubahan User' : 'Tambah User Sekarang'}
              </button>
              {editingUserId && (
                <button
                  type="button"
                  onClick={handleResetUserForm}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          {/* User list table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white text-xs uppercase font-bold">
                  <th className="py-3 px-4 text-center w-16">No</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Unit Kerja</th>
                  <th className="py-3 px-4">Email Google (OTP)</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Jenis User</th>
                  <th className="py-3 px-4">Hak Akses</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada data user. Silakan tambah user di atas.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={`${u.id || 'usr'}-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{u.nip}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-900">{u.nama}</td>
                      <td className="py-3 px-4 font-semibold text-teal-800">
                        <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-xs">
                          {u.unitKerja || 'Bagian Umum'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{u.email || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.password || 'kosong'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {u.jenisUser}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.hakAkses.map((h, hIdx) => (
                            <span key={hIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {h}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 10: Membuka Database Naskah Masuk dan Database Naskah Keluar */}
      {activeSection === 'dbView' && (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                10. Membuka Database Naskah Masuk dan Database Naskah Keluar
              </h3>
              <p className="text-xs text-slate-500">
                Langsung inspeksi seluruh record naskah yang terhubung ke GoogleSheet DB
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('naskahMasuk')}
                className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <span>Buka Form Masuk →</span>
              </button>
              <button
                onClick={() => setActiveTab('naskahKeluar')}
                className="px-4 py-2.5 bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <span>Buka Form Keluar →</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box Naskah Masuk summary */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Database Naskah Masuk
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white">
                  {naskahMasukList.length} Record
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Menyimpan 15 field data tanggal terima, tanggal naskah, nomor, pengirim, instansi/wilayah, klasifikasi, status, SLA, dan link arsip cloud.
              </p>
              <button
                onClick={() => setActiveTab('naskahMasuk')}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                Buka & Kelola Database Naskah Masuk
              </button>
            </div>

            {/* Box Naskah Keluar summary */}
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Database Naskah Keluar
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-700 text-white">
                  {naskahKeluarList.length} Record
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Menyimpan tanggal naskah, nomor surat, tujuan, tgl kirim bersyarat, status pengiriman, catatan, serta fitur pengiriman email.
              </p>
              <button
                onClick={() => setActiveTab('naskahKeluar')}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                Buka & Kelola Database Naskah Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. SUPABASE CLOUD DATABASE PANEL */}
      {activeSection === 'supabaseDb' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs mb-2">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Supabase PostgreSQL Cloud Database</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Status Integrasi & Sinkronisasi Supabase
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Database cloud terhubung ke: <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-700 font-bold border border-slate-200">https://ncwqsxocpxzqdisijcr.supabase.co</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Terhubung & Aktif</span>
              </span>
            </div>
          </div>

          {/* Supabase URL & Key Configuration Inputs */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-extrabold text-slate-900">Konfigurasi URL & API Key Supabase</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Supabase Project URL</label>
                <input
                  type="text"
                  value={supabaseConfigInput.url}
                  onChange={(e) => setSupabaseConfigInput((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 block">URL otomatis dibersihkan (tanpa trailing slash agar tidak error "invalid path").</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Supabase Anon Key (API Key Public)</label>
                <input
                  type="text"
                  value={supabaseConfigInput.anonKey}
                  onChange={(e) => setSupabaseConfigInput((prev) => ({ ...prev, anonKey: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  resetSupabaseConfigToDefault();
                  setSupabaseConfigInput({
                    url: DEFAULT_SUPABASE_URL,
                    anonKey: DEFAULT_SUPABASE_ANON_KEY
                  });
                  showToast('Kredensial Supabase berhasil di-reset ke URL & Anon Key Default!', 'success');
                }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                <span>🔄 Reset Kredensial Default Netlify</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSupabaseClient(supabaseConfigInput.url, supabaseConfigInput.anonKey);
                  showToast('Kredensial Supabase berhasil diperbarui & dibersihkan dari trailing slash!', 'success');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Simpan Kredensial Supabase</span>
              </button>
            </div>
          </div>

          {/* NETLIFY DEPLOYMENT & CORS GUIDANCE BOX */}
          <div className="p-5 rounded-2xl bg-cyan-950/90 text-cyan-50 space-y-3 border border-cyan-700/60 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>PANDUAN NETLIFY: Solusi Error Load Database Supabase dari Netlify</span>
            </div>
            <p className="text-xs text-cyan-100 leading-relaxed">
              Jika terjadi error saat load/save database dari domain Netlify (<code className="bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200 font-mono">*.netlify.app</code>), pastikan 2 langkah ringan berikut diatur:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-cyan-900/50 rounded-xl border border-cyan-800/80 space-y-1">
                <span className="font-extrabold text-cyan-200 block">1. Set Netlify Environment Variables</span>
                <p className="text-[11px] text-cyan-300/90 leading-snug">
                  Di Netlify Dashboard &gt; <strong>Site settings</strong> &gt; <strong>Environment variables</strong>, tambahkan:
                </p>
                <ul className="list-disc list-inside text-[11px] font-mono text-cyan-200 space-y-0.5 pt-1">
                  <li><strong className="text-white">VITE_SUPABASE_URL</strong>: <span className="opacity-90">{DEFAULT_SUPABASE_URL}</span></li>
                  <li><strong className="text-white">VITE_SUPABASE_ANON_KEY</strong>: <span className="opacity-90">{DEFAULT_SUPABASE_ANON_KEY.substring(0, 25)}...</span></li>
                </ul>
              </div>
              <div className="p-3 bg-cyan-900/50 rounded-xl border border-cyan-800/80 space-y-1">
                <span className="font-extrabold text-cyan-200 block">2. Izinkan CORS Domain Netlify di Supabase</span>
                <p className="text-[11px] text-cyan-300/90 leading-snug">
                  Di Supabase Dashboard &gt; <strong>Project Settings</strong> &gt; <strong>API</strong> &gt; <strong>CORS Origins</strong>, masukkan domain Netlify Anda (atau tanda asterisk <code className="bg-cyan-900 px-1 rounded text-cyan-200">*</code>) agar koneksi Netlify diizinkan.
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3 border border-indigo-800 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-cyan-300 font-extrabold text-[11px] border border-cyan-500/30">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Script Setup Tabel & Izin Akses Supabase</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">
                  Instalasi / Perbaikan Struktur Database Supabase (1-Click SQL)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Jika tabel belum ada di Supabase atau muncul error izin akses / RLS policy, salin script SQL ini lalu jalankan di menu <strong>SQL Editor</strong> di Dashboard Supabase Anda. Script ini otomatis membuat ke-10 tabel, mengizinkan hak akses public (`GRANT ALL`), dan menonaktifkan RLS agar sinkronisasi lancar tanpa hambatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                  showToast('Script SQL DDL Supabase (10 Tabel & RLS Bypass) berhasil disalin! Jalankan di Supabase SQL Editor.', 'success');
                }}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>📋 Salin Script DDL SQL Supabase</span>
              </button>
            </div>
          </div>

          {/* Action Sync Button */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-base font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
                Simpan / Pindahkan Data ke Supabase Instant
              </h4>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                Tekan tombol ini untuk menyalin dan menyelaraskan seluruh data yang ada di aplikasi & Google Sheet ke dalam 10 tabel database Supabase PostgreSQL Anda.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={async () => {
                  setSupabaseDiag({ running: true });
                  showToast('Sedang mendiagnosa ke-10 tabel di Supabase...', 'info');
                  const diag = await testSupabaseConnectionAndSchema();
                  setSupabaseDiag({ running: false, result: diag });
                  if (diag.connected) {
                    showToast(`Diagnosa Selesai: ${diag.summary}`, 'success');
                  } else {
                    showToast(`Diagnosa: Tabel belum dibuat atau RLS aktif di Supabase.`, 'error');
                  }
                }}
                className="w-full sm:w-auto px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 text-white ${supabaseDiag.running ? 'animate-spin' : ''}`} />
                <span>🔍 Diagnosa 10 Tabel</span>
              </button>
              <button
                onClick={async () => {
                  showToast('Memindahkan & Menyimpan 10 tabel data ke Supabase PostgreSQL...', 'info');
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
                  if (res.success) {
                    showToast('BERHASIL! Seluruh 10 tabel data telah tersimpan di Supabase PostgreSQL!', 'success');
                  } else {
                    showToast(`Gagal: ${res.errors.join(' | ')}`, 'error');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Database className="w-4 h-4 text-slate-950" />
                <span>⚡ Simpan 10 Tabel Now</span>
              </button>
            </div>
          </div>

          {/* Hasil Diagnosa Tabel */}
          {supabaseDiag.result && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-extrabold text-white">Hasil Diagnosa Real-time Supabase Database</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${supabaseDiag.result.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                  {supabaseDiag.result.summary}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1">
                {supabaseDiag.result.tableStatuses.map((st) => (
                  <div
                    key={st.table}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      st.status === 'ok'
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                        : st.status === 'missing'
                        ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                        : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] block">{st.table}</span>
                      <span className="font-black text-[10px] uppercase">{st.status}</span>
                    </div>
                    <p className="text-[10px] opacity-80 leading-tight">{st.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Summaries Grid (10 Tabel Database) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Naskah Masuk</span>
              <span className="text-xl font-black text-slate-900 block">{naskahMasukList.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">naskah_masuk</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Naskah Keluar</span>
              <span className="text-xl font-black text-slate-900 block">{naskahKeluarList.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">naskah_keluar</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Berkas Thread</span>
              <span className="text-xl font-black text-slate-900 block">{berkasThreadList.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">berkas_thread</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">4. Pengguna</span>
              <span className="text-xl font-black text-slate-900 block">{users.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">users</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">5. Unit Kerja</span>
              <span className="text-xl font-black text-slate-900 block">{unitKerjaList.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">unit_kerja</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">6. Klasifikasi Arsip</span>
              <span className="text-xl font-black text-slate-900 block">{klasifikasiArsipList.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">klasifikasi_arsip</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">7. Instansi Wilayah</span>
              <span className="text-xl font-black text-slate-900 block">{instansiWilayah.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">instansi_wilayah</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">8. Klasifikasi Sub</span>
              <span className="text-xl font-black text-slate-900 block">{klasifikasiSub.length}</span>
              <span className="text-[10px] text-blue-600 font-bold block">klasifikasi_sub</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">9. Master Dropdown</span>
              <span className="text-xl font-black text-slate-900 block">
                {jenisNaskahMasuk.length + jenisNaskahKeluar.length + statusPenyelesaian.length + statusKirim.length}
              </span>
              <span className="text-[10px] text-blue-600 font-bold block">master_dropdown</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">10. Pengaturan Thread</span>
              <span className="text-xl font-black text-slate-900 block">1</span>
              <span className="text-[10px] text-blue-600 font-bold block">thread_number_config</span>
            </div>
          </div>

          {/* Info & CSV Converter Helper */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-200/80 text-amber-900 rounded-xl shrink-0 font-bold text-xs">
                💡 SOLUSI HEADER CSV
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-amber-950">
                  Mengapa muncul error "This CSV cannot be imported... incompatible headers"?
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Header Google Sheet menggunakan nama Bahasa Indonesia seperti <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Instansi Terkait</code> dan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Wilayah Kerja Menginduk</code>, sedangkan tabel PostgreSQL Supabase memerlukan nama kolom <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">instansi_terkait</code> dan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">wilayah_kerja</code> (kecil & underscore).
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-amber-950">Atau Unduh File CSV Terkonversi (Siap Upload ke Supabase Studio):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const escapeCsvCell = (val: any) => {
                        if (val === null || val === undefined) return '""';
                        const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
                        return `"${str}"`;
                      };

                      const headers = ['id', 'nomor_naskah', 'tgl_naskah', 'tgl_terima', 'perihal', 'jenis_naskah', 'pengirim_naskah', 'instansi_terkait', 'wilayah_kerja', 'unit_kerja', 'klasifikasi_utama', 'klasifikasi_sub', 'status_penyelesaian', 'sla', 'created_by', 'created_by_name'];
                      const rows = naskahMasukList.map((m) => [
                        escapeCsvCell(m.id),
                        escapeCsvCell(m.nomorNaskah),
                        escapeCsvCell(m.tglNaskah),
                        escapeCsvCell(m.tglTerima),
                        escapeCsvCell(m.perihal),
                        escapeCsvCell(m.jenisNaskah),
                        escapeCsvCell(m.pengirimNaskah),
                        escapeCsvCell(m.instansiTerkait),
                        escapeCsvCell(m.wilayahKerja),
                        escapeCsvCell(m.unitKerja),
                        escapeCsvCell(m.klasifikasiUtama),
                        escapeCsvCell(m.subKlasifikasi),
                        escapeCsvCell(m.statusPenyelesaian),
                        m.sla || 3,
                        escapeCsvCell(m.createdBy),
                        escapeCsvCell(m.createdByName)
                      ]);
                      
                      const csvText = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                      const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'naskah_masuk_supabase_ready.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      showToast('File naskah_masuk_supabase_ready.csv (100% Valid Clean) berhasil diunduh! Siap di-upload ke Supabase Studio.', 'success');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow transition-all cursor-pointer"
                  >
                    📥 Download CSV Naskah Masuk (Format Supabase Clean)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const escapeCsvCell = (val: any) => {
                        if (val === null || val === undefined) return '""';
                        const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
                        return `"${str}"`;
                      };

                      const headers = ['id', 'nomor_naskah', 'tgl_naskah', 'perihal', 'jenis_naskah', 'tujuan_naskah', 'instansi_terkait', 'wilayah_kerja', 'unit_kerja', 'klasifikasi_utama', 'klasifikasi_sub', 'tgl_kirim', 'status_pengiriman', 'bukti_kirim', 'catatan', 'created_by', 'created_by_name'];
                      const rows = naskahKeluarList.map((k) => [
                        escapeCsvCell(k.id),
                        escapeCsvCell(k.nomorNaskah),
                        escapeCsvCell(k.tglNaskah),
                        escapeCsvCell(k.perihal),
                        escapeCsvCell(k.jenisNaskah),
                        escapeCsvCell(k.tujuanNaskah),
                        escapeCsvCell(k.instansiTerkait),
                        escapeCsvCell(k.wilayahKerja),
                        escapeCsvCell(k.unitKerja),
                        escapeCsvCell(k.klasifikasiUtama),
                        escapeCsvCell(k.subKlasifikasi),
                        escapeCsvCell(k.tglKirim),
                        escapeCsvCell(k.statusPengiriman),
                        escapeCsvCell(k.buktiKirim),
                        escapeCsvCell(k.catatan),
                        escapeCsvCell(k.createdBy),
                        escapeCsvCell(k.createdByName)
                      ]);

                      const csvText = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                      const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'naskah_keluar_supabase_ready.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      showToast('File naskah_keluar_supabase_ready.csv (100% Valid Clean) berhasil diunduh! Siap di-upload ke Supabase Studio.', 'success');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow transition-all cursor-pointer"
                  >
                    📥 Download CSV Naskah Keluar (Format Supabase Clean)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 12: RESET DATA PER-TABEL */}
      {activeSection === 'resetTables' && (
        <div className="bg-white rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black mb-1">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Panel Pengosongan & Reset Data Spesifik</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                12. Reset Data Masing-Masing Tabel Database
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Pilih tabel mana saja yang ingin dikosongkan. Data pada penyimpanan lokal dan Supabase Cloud DB untuk tabel tersebut akan dihapus permanen.
              </p>
            </div>
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold shrink-0">
              ⚠️ Perhatian: Data yang dihapus tidak dapat dikembalikan
            </div>
          </div>

          {/* Table List Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Naskah Masuk */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">1. Tabel Naskah Masuk</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {naskahMasukList.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.naskah_masuk</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menyimpan seluruh data registrasi dan arsip naskah masuk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('naskah_masuk', 'Naskah Masuk', naskahMasukList.length, 'public.naskah_masuk')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Tabel Naskah Masuk</span>
              </button>
            </div>

            {/* Card 2: Naskah Keluar */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">2. Tabel Naskah Keluar</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {naskahKeluarList.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.naskah_keluar</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menyimpan seluruh data naskah keluar dan bukti pengiriman.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('naskah_keluar', 'Naskah Keluar', naskahKeluarList.length, 'public.naskah_keluar')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Tabel Naskah Keluar</span>
              </button>
            </div>

            {/* Card 3: Berkas Thread */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">3. Tabel Pemberkasan (Thread)</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {berkasThreadList.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.berkas_thread</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menyimpan daftar thread berkas, penautan surat, dan riwayat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('berkas_thread', 'Pemberkasan (Thread Tracker)', berkasThreadList.length, 'public.berkas_thread')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Tabel Pemberkasan</span>
              </button>
            </div>

            {/* Card 4: Klasifikasi Arsip */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">4. Tabel Klasifikasi Arsip</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {klasifikasiArsipList.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.klasifikasi_arsip</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Master kode klasifikasi arsip, retensi aktif/inaktif & nasib akhir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('klasifikasi_arsip', 'Kode Klasifikasi Arsip', klasifikasiArsipList.length, 'public.klasifikasi_arsip')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Klasifikasi Arsip</span>
              </button>
            </div>

            {/* Card 5: Sub Klasifikasi */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">5. Tabel Sub-Klasifikasi</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {klasifikasiSub.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.klasifikasi_sub</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Master pemetaan klasifikasi utama dengan daftar sub-klasifikasinya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('klasifikasi_sub', 'Sub Klasifikasi Arsip', klasifikasiSub.length, 'public.klasifikasi_sub')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Sub-Klasifikasi</span>
              </button>
            </div>

            {/* Card 6: Instansi & Wilayah Kerja */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">6. Instansi & Wilayah Kerja</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {instansiWilayah.length} Baris
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.instansi_wilayah</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Daftar instansi luar/mitra dan wilayah kerja penginduknya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('instansi_wilayah', 'Instansi & Wilayah Kerja', instansiWilayah.length, 'public.instansi_wilayah')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Instansi & Wilayah</span>
              </button>
            </div>

            {/* Card 7: Unit Kerja */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">7. Unit Kerja Pengelola</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {unitKerjaList.length} Item
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.unit_kerja</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Daftar unit kerja/bidang pengelola naskah dalam organisasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('unit_kerja', 'Unit Kerja Pengelola', unitKerjaList.length, 'public.unit_kerja')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Unit Kerja</span>
              </button>
            </div>

            {/* Card 8: Akun Pengguna / Users */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">8. Akun Pengguna (Users)</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {users.length} Akun
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.users</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data pengguna & role. Admin utama akan dipertahankan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('users', 'Akun Pengguna', users.length, 'public.users')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Data Pengguna</span>
              </button>
            </div>

            {/* Card 9: Jenis Naskah Masuk */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">9. Opsi Jenis Naskah Masuk</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {jenisNaskahMasuk.length} Opsi
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">master_dropdown (Jenis Naskah Masuk)</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Opsi dropdown jenis naskah untuk Form Naskah Masuk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('jenis_naskah_masuk', 'Jenis Naskah Masuk', jenisNaskahMasuk.length, 'public.master_dropdown')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Jenis Naskah Masuk</span>
              </button>
            </div>

            {/* Card 10: Jenis Naskah Keluar */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">10. Opsi Jenis Naskah Keluar</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {jenisNaskahKeluar.length} Opsi
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">master_dropdown (Jenis Naskah Keluar)</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Opsi dropdown jenis naskah untuk Form Naskah Keluar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('jenis_naskah_keluar', 'Jenis Naskah Keluar', jenisNaskahKeluar.length, 'public.master_dropdown')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Jenis Naskah Keluar</span>
              </button>
            </div>

            {/* Card 11: Counter Thread */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">11. Counter Penomoran Thread</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    Angka: {threadNumberConfig.currentCounter}
                  </span>
                </div>
                <code className="text-[10px] text-blue-700 font-mono font-bold block">public.thread_number_config</code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mereset hitungan otomatis penomoran thread ke nilai 100.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openResetModal('thread_number_config', 'Counter Penomoran Thread', 1, 'public.thread_number_config')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Counter Thread</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI RESET TABEL SPESIFIK */}
      {resetModalInfo && resetModalInfo.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-800/80 rounded-2xl text-rose-200">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Konfirmasi Reset Tabel</h3>
                  <p className="text-xs text-rose-200">
                    Tabel: <strong className="text-white font-mono">{resetModalInfo.tableName}</strong> ({resetModalInfo.dbTableName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetModalInfo(null);
                  setResetConfirmText('');
                }}
                className="p-2 rounded-xl bg-rose-800/50 text-rose-200 hover:text-white hover:bg-rose-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>PERINGATAN MENGHAPUS PERMANEN</span>
                </div>
                <p className="leading-relaxed">
                  Tindakan ini akan <strong>MENGHAPUS SELURUH DATA ({resetModalInfo.rowCount} baris)</strong> pada tabel <strong className="underline">{resetModalInfo.tableName}</strong> dari memori lokal browser & database Supabase Cloud.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Ketik kata <code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono font-black border border-slate-300">RESET</code> di bawah ini untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Ketik RESET"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalInfo(null);
                    setResetConfirmText('');
                  }}
                  disabled={isResetting}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteResetTable(resetModalInfo.tableKey)}
                  disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  {isResetting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sedang Me-reset Tabel...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-white" />
                      <span>Hapus & Reset Tabel Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS KLASIFIKASI ARSIP */}
      {arsipToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Klasifikasi Arsip?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  Apakah Anda yakin ingin menghapus Kode Klasifikasi Arsip <strong className="font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{arsipToDelete.kodeKlasifikasi}</strong>?
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  "{arsipToDelete.namaKlasifikasi}"
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setArsipToDelete(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteArsip}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
