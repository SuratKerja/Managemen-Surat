import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, ThreadNumberConfig, UserRole } from '../types';
import {
  defaultUsers,
  defaultUnitKerjaList,
  defaultJenisNaskahMasuk,
  defaultJenisNaskahKeluar,
  defaultInstansiWilayah,
  defaultKlasifikasiSub,
  defaultKlasifikasiArsip,
  defaultThreadNumberConfig
} from '../data/defaultData';
import {
  Settings,
  Users,
  Hash,
  Database,
  Trash2,
  Plus,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  X,
  FileText,
  Building2,
  Tag,
  FolderKanban,
  Edit,
  Sliders,
  Check,
  Zap,
  Info,
  Clock,
  Save
} from 'lucide-react';
import {
  clearTableInSupabase,
  pushToSupabase,
  SUPABASE_SCHEMA_SQL,
  testSupabaseConnectionAndSchema
} from '../services/supabaseData';
import { getStoredSupabaseConfig, updateSupabaseClient } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    users,
    setUsers,
    threadNumberConfig,
    setThreadNumberConfig,
    naskahMasukList,
    setNaskahMasukList,
    naskahKeluarList,
    setNaskahKeluarList,
    berkasThreadList,
    setBerkasThreadList,
    klasifikasiArsipList,
    setKlasifikasiArsipList,
    klasifikasiSub,
    setKlasifikasiSub,
    instansiWilayah,
    setInstansiWilayah,
    unitKerjaList,
    setUnitKerjaList,
    jenisNaskahMasuk,
    setJenisNaskahMasuk,
    jenisNaskahKeluar,
    setJenisNaskahKeluar,
    showToast,
    syncWithGoogleSheets,
    currentUser,
    slaConfig,
    setSlaConfig
  } = useApp();

  // Determine active sub-tab from activeTab or internal state
  const activeSubTab =
    activeTab === 'settingUserRole'
      ? 'userRole'
      : activeTab === 'settingCounterThread'
      ? 'counterThread'
      : activeTab === 'settingSla'
      ? 'sla'
      : activeTab === 'settingSupabase'
      ? 'supabase'
      : activeTab === 'settingResetTables'
      ? 'resetTables'
      : 'userRole';

  const handleSwitchSubTab = (tab: 'userRole' | 'counterThread' | 'sla' | 'supabase' | 'resetTables') => {
    if (tab === 'userRole') setActiveTab('settingUserRole');
    else if (tab === 'counterThread') setActiveTab('settingCounterThread');
    else if (tab === 'sla') setActiveTab('settingSla');
    else if (tab === 'supabase') setActiveTab('settingSupabase');
    else if (tab === 'resetTables') setActiveTab('settingResetTables');
  };

  // --- SUB-MENU 1: USER ROLE STATES & HANDLERS ---
  const [editingUserId, setEditingJenisUserId] = useState<string | null>(null);
  const [newNip, setNewNip] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Operator');
  const [newUnitKerja, setNewUnitKerja] = useState('Bagian Umum');
  const [newHakAkses, setNewHakAkses] = useState<string[]>([
    'Dashboard',
    'Naskah Masuk',
    'Naskah Keluar',
    'Pemberkasan',
    'Laporan'
  ]);

  const allAvailableHakAkses = [
    'Dashboard',
    'Naskah Masuk',
    'Naskah Keluar',
    'Pemberkasan',
    'Master Data',
    'Setting',
    'Laporan'
  ];

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNip.trim() || !newNama.trim()) {
      showToast('NIP dan Nama Pengguna harus diisi!', 'error');
      return;
    }

    if (users.some((u) => u.nip.trim() === newNip.trim() && u.id !== editingUserId)) {
      showToast('Pengguna dengan NIP ini sudah ada!', 'error');
      return;
    }

    if (editingUserId) {
      const updated = users.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              nip: newNip.trim(),
              nama: newNama.trim(),
              password: newPassword ? newPassword : u.password,
              jenisUser: newRole,
              unitKerja: newUnitKerja,
              hakAkses: newHakAkses
            }
          : u
      );
      setUsers(updated);
      try { localStorage.setItem('ms_users', JSON.stringify(updated)); } catch (e) {}
      pushToSupabase({ users: updated });
      showToast('Data Pengguna berhasil diperbarui!', 'success');
      setEditingJenisUserId(null);
    } else {
      const newUser = {
        id: `USR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nip: newNip.trim(),
        nama: newNama.trim(),
        password: newPassword || '123456',
        jenisUser: newRole,
        unitKerja: newUnitKerja,
        hakAkses: newHakAkses
      };
      const updated = [...users, newUser];
      setUsers(updated);
      try { localStorage.setItem('ms_users', JSON.stringify(updated)); } catch (e) {}
      pushToSupabase({ users: updated });
      showToast('Pengguna Baru Berhasil Ditambahkan!', 'success');
    }

    // Reset Form
    setNewNip('');
    setNewNama('');
    setNewPassword('');
    setNewRole('Operator');
    setNewHakAkses(['Dashboard', 'Naskah Masuk', 'Naskah Keluar', 'Pemberkasan', 'Laporan']);
  };

  const handleEditUser = (u: any) => {
    setEditingJenisUserId(u.id);
    setNewNip(u.nip);
    setNewNama(u.nama);
    setNewPassword('');
    setNewRole(u.jenisUser || 'Operator');
    setNewUnitKerja(u.unitKerja || 'Bagian Umum');
    setNewHakAkses(Array.isArray(u.hakAkses) ? u.hakAkses : ['Dashboard', 'Naskah Masuk', 'Naskah Keluar']);
  };

  const handleDeleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target?.jenisUser === 'Admin' && users.filter((u) => u.jenisUser === 'Admin').length <= 1) {
      showToast('Tidak bisa menghapus Administrator utama!', 'error');
      return;
    }
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    try { localStorage.setItem('ms_users', JSON.stringify(updated)); } catch (e) {}
    pushToSupabase({ users: updated });
    showToast('Pengguna berhasil dihapus', 'info');
  };

  // --- SUB-MENU 2: COUNTER THREAD STATES & HANDLERS ---
  const handleSaveThreadConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try { localStorage.setItem('ms_thread_number_config', JSON.stringify(threadNumberConfig)); } catch (e) {}
    pushToSupabase({ threadNumberConfig });
    showToast('Pengaturan Format Penomoran Thread Disimpan!', 'success');
  };

  const handleResetCounterValue = () => {
    const updated = { ...threadNumberConfig, currentCounter: 100 };
    setThreadNumberConfig(updated);
    try { localStorage.setItem('ms_thread_number_config', JSON.stringify(updated)); } catch (e) {}
    pushToSupabase({ threadNumberConfig: updated });
    showToast('Counter penomoran thread di-reset ke nilai 100', 'info');
  };

  // Live preview counter
  const generatePreviewNumber = () => {
    const yyyy = new Date().getFullYear().toString();
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const counterStr = String(threadNumberConfig.currentCounter || 100).padStart(
      threadNumberConfig.counterDigits || 4,
      '0'
    );
    let result = threadNumberConfig.format || '[PREFIX]-[YYYY]-[COUNTER]';
    result = result.replace('[PREFIX]', threadNumberConfig.prefix || 'TH');
    result = result.replace('[YYYY]', yyyy);
    result = result.replace('[MM]', mm);
    result = result.replace('[COUNTER]', counterStr);
    return result;
  };

  // --- SUB-MENU 3: SUPABASE DB STATES & HANDLERS ---
  const [supabaseDiag, setSupabaseDiag] = useState<{
    running: boolean;
    result?: { connected: boolean; tableStatuses: { table: string; status: 'ok' | 'missing' | 'rls_error' | 'error'; message: string }[]; summary: string };
  }>({ running: false });

  const [supabaseConfigInput, setSupabaseConfigInput] = useState(() => getStoredSupabaseConfig());

  const handleRunSupabaseDiagnosis = async () => {
    setSupabaseDiag({ running: true });
    const res = await testSupabaseConnectionAndSchema();
    setSupabaseDiag({ running: false, result: res });
    if (res.connected) {
      showToast('Koneksi Supabase DB terhubung & terverifikasi!', 'success');
    } else {
      showToast('Diagnosa Supabase: ' + res.summary, 'error');
    }
  };

  const handleCopySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    showToast('Script Setup SQL DDL berhasil disalin ke clipboard!', 'success');
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigInput.url.trim() || !supabaseConfigInput.anonKey.trim()) {
      showToast('Project URL dan Anon Key tidak boleh kosong!', 'error');
      return;
    }
    updateSupabaseClient(supabaseConfigInput.url, supabaseConfigInput.anonKey);
    showToast('Konfigurasi Supabase Project URL & Anon Key Berhasil Disimpan!', 'success');
    handleRunSupabaseDiagnosis();
  };

  const handleResetSupabaseConfig = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('CUSTOM_SUPABASE_URL');
      localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
    }
    const defaultConfig = getStoredSupabaseConfig();
    setSupabaseConfigInput(defaultConfig);
    updateSupabaseClient(defaultConfig.url, defaultConfig.anonKey);
    showToast('Konfigurasi Supabase dikembalikan ke pengaturan default', 'info');
  };

  // --- SUB-MENU 4: RESET TABLES STATES & HANDLERS ---
  const [resetModalInfo, setResetModalInfo] = useState<{
    isOpen: boolean;
    tableKey: string;
    tableName: string;
    rowCount: number;
    dbTableName: string;
  } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const openResetModal = (tableKey: string, tableName: string, rowCount: number, dbTableName: string) => {
    setResetModalInfo({ isOpen: true, tableKey, tableName, rowCount, dbTableName });
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/60 border border-emerald-500/40 rounded-full text-xs font-extrabold text-emerald-300">
              <Settings className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
              <span>Pengaturan Sistem Management Surat</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Setting & Konfigurasi Sistem
            </h2>
            <p className="text-sm text-emerald-200/90 max-w-xl leading-relaxed">
              Kelola pengaturan hak akses pengguna, format penomoran otomatis pemberkasan, diagnosa database Supabase Cloud, dan pengosongan tabel.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/30 shrink-0">
            <div className="p-3 bg-emerald-600/30 rounded-xl text-cyan-300 border border-cyan-400/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">Akses Pengaturan</div>
              <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentUser?.jenisUser || 'Admin'} • Full Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Menu Nav Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleSwitchSubTab('userRole')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'userRole'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>1. Role User & Pengguna</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('counterThread')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'counterThread'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Hash className="w-4 h-4 text-amber-400" />
          <span>2. Format Penomoran Thread</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('sla')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sla'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>3. Aturan SLA (Hari Kerja)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('supabase')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'supabase'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>4. Supabase Cloud DB</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('resetTables')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'resetTables'
              ? 'bg-rose-900 text-white shadow-lg shadow-rose-900/20'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>5. Reset Data Per-Tabel</span>
        </button>
      </div>

      {/* --- SUB-TAB 1: USER ROLE & PENGGUNA --- */}
      {activeSubTab === 'userRole' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Pengaturan Hak Akses & Akun Pengguna</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan akun login baru, tentukan NIP, Password, Role, dan izin akses menu khusus untuk setiap pengguna.
            </p>
          </div>

          {/* Form Tambah/Edit User */}
          <form onSubmit={handleAddUser} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center justify-between">
              <span>{editingUserId ? '✏️ Edit Akun Pengguna' : '➕ Tambah Akun Pengguna Baru'}</span>
              {editingUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingJenisUserId(null);
                    setNewNip('');
                    setNewNama('');
                    setNewPassword('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Batal Edit
                </button>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">NIP / ID User *</label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="198901012010011001"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Riswan Anas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Password {editingUserId ? '(Kosongkan jika tak diubah)' : '*'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Role / Peran *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="Admin">Admin (Akses Penuh)</option>
                  <option value="Operator">Operator (Pencatatan)</option>
                  <option value="Verifikator">Verifikator (Verifikasi)</option>
                  <option value="Public">Public (Lihat Sahaja)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Hak Akses Menu:</label>
              <div className="flex flex-wrap gap-2">
                {allAvailableHakAkses.map((hak) => {
                  const isChecked = newHakAkses.includes(hak);
                  return (
                    <button
                      key={hak}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setNewHakAkses(newHakAkses.filter((h) => h !== hak));
                        } else {
                          setNewHakAkses([...newHakAkses, hak]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{hak}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{editingUserId ? 'Simpan Perubahan Akun' : 'Tambah Akun Sekarang'}</span>
            </button>
          </form>

          {/* Table Users */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">NIP / ID</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Hak Akses Menu</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-950">{u.nip}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{u.nama}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          u.jenisUser === 'Admin'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {u.jenisUser}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(u.hakAkses || []).map((h) => (
                          <span key={h} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditUser(u)}
                        className="p-1.5 bg-amber-100 text-amber-800 rounded-lg font-bold hover:bg-amber-200 transition-all cursor-pointer"
                        title="Edit Akun"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 bg-rose-100 text-rose-800 rounded-lg font-bold hover:bg-rose-200 transition-all cursor-pointer"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: FORMAT PENOMORAN THREAD --- */}
      {activeSubTab === 'counterThread' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Hash className="w-6 h-6 text-amber-600" />
              <span>Format Penomoran Otomatis Pemberkasan (Thread Tracker)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur format penomoran berkas thread otomatis saat membuat pemberkasan naskah baru.
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg space-y-1">
            <div className="text-xs uppercase font-bold text-amber-100">Live Preview Nomor Thread Baru:</div>
            <div className="text-2xl font-black font-mono tracking-wider">{generatePreviewNumber()}</div>
          </div>

          <form onSubmit={handleSaveThreadConfig} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Prefix / Awalan</label>
                <input
                  type="text"
                  value={threadNumberConfig.prefix}
                  onChange={(e) => setThreadNumberConfig({ ...threadNumberConfig, prefix: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Pemisah (Separator)</label>
                <input
                  type="text"
                  value={threadNumberConfig.separator}
                  onChange={(e) => setThreadNumberConfig({ ...threadNumberConfig, separator: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Format Susunan</label>
                <select
                  value={threadNumberConfig.format}
                  onChange={(e) => setThreadNumberConfig({ ...threadNumberConfig, format: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold bg-white"
                >
                  <option value="[PREFIX]-[YYYY]-[COUNTER]">[PREFIX]-[YYYY]-[COUNTER]</option>
                  <option value="[PREFIX]/[YYYY]/[MM]/[COUNTER]">[PREFIX]/[YYYY]/[MM]/[COUNTER]</option>
                  <option value="[PREFIX].[COUNTER]">[PREFIX].[COUNTER]</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Counter Berjalan</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={threadNumberConfig.currentCounter}
                    onChange={(e) => setThreadNumberConfig({ ...threadNumberConfig, currentCounter: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleResetCounterValue}
                    className="px-3 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-200 cursor-pointer"
                    title="Reset ke 100"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Format Penomoran Thread</span>
            </button>
          </form>
        </div>
      )}

      {/* --- SUB-TAB 3: ATURAN SLA (HARI KERJA) --- */}
      {activeSubTab === 'sla' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              <span>Pengaturan Batas SLA (Hari Kerja) &amp; Status Penyelesaian</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur batas hari kerja SLA untuk otomatisasi penentuan Status Penyelesaian Naskah Masuk.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast('Pengaturan Aturan SLA (Hari Kerja) Berhasil Disimpan!', 'success');
            }}
            className="space-y-5 max-w-2xl"
          >
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium space-y-2">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Aturan Otomatisasi Status Penyelesaian Naskah Masuk:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  Nilai SLA = <strong>0 Hari</strong> &rarr; Status Otomatis:{' '}
                  <span className="font-extrabold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                    {slaConfig.labelBelumSelesai || 'Belum Selesai'}
                  </span>
                </li>
                <li>
                  Nilai SLA = <strong>1 s/d {slaConfig.maxSlaTepat} Hari Kerja</strong> &rarr; Status Otomatis:{' '}
                  <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {slaConfig.labelTepatSla || 'Selesai Tepat SLA'}
                  </span>
                </li>
                <li>
                  Nilai SLA &gt; <strong>{slaConfig.maxSlaTepat} Hari Kerja</strong> &rarr; Status Otomatis:{' '}
                  <span className="font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    {slaConfig.labelMelebihiSla || 'Selesai Melebihi SLA'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Batas Maksimal Hari Selesai Tepat SLA *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={slaConfig.maxSlaTepat}
                    onChange={(e) =>
                      setSlaConfig({ ...slaConfig, maxSlaTepat: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai SLA 1 s/d {slaConfig.maxSlaTepat} hari dianggap Selesai Tepat SLA.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Label Status SLA 0 Hari
                </label>
                <input
                  type="text"
                  value={slaConfig.labelBelumSelesai}
                  onChange={(e) => setSlaConfig({ ...slaConfig, labelBelumSelesai: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Label Status 1 - {slaConfig.maxSlaTepat} Hari Kerja
                </label>
                <input
                  type="text"
                  value={slaConfig.labelTepatSla}
                  onChange={(e) => setSlaConfig({ ...slaConfig, labelTepatSla: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Label Status &gt; {slaConfig.maxSlaTepat} Hari Kerja
                </label>
                <input
                  type="text"
                  value={slaConfig.labelMelebihiSla}
                  onChange={(e) => setSlaConfig({ ...slaConfig, labelMelebihiSla: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan SLA</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SUB-TAB 4: SUPABASE CLOUD DB --- */}
      {activeSubTab === 'supabase' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-cyan-600" />
                <span>Pengaturan Supabase Cloud Database (PostgreSQL)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verifikasi status koneksi, jalankan diagnosa tabel, atau salin script SQL DDL untuk setup awal di Supabase.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySqlScript}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Script Setup SQL DDL</span>
              </button>
              <button
                type="button"
                onClick={handleRunSupabaseDiagnosis}
                disabled={supabaseDiag.running}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${supabaseDiag.running ? 'animate-spin' : ''}`} />
                <span>Jalankan Diagnosa DB</span>
              </button>
            </div>
          </div>

          {/* Form Configuration URL & Anon Key */}
          <form onSubmit={handleSaveSupabaseConfig} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-600" />
                <span>Konfigurasi Credentials Supabase (Project URL &amp; Anon Key)</span>
              </h4>
              <button
                type="button"
                onClick={handleResetSupabaseConfig}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset ke Default
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="text"
                  value={supabaseConfigInput.url}
                  onChange={(e) => setSupabaseConfigInput({ ...supabaseConfigInput, url: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Domain REST API project Supabase Anda (misal: <code>https://ncwqsxocpxzqdisijcr.supabase.co</code>)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Supabase Anon Public Key *
                </label>
                <input
                  type="text"
                  value={supabaseConfigInput.anonKey}
                  onChange={(e) => setSupabaseConfigInput({ ...supabaseConfigInput, anonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kunci akses publik API (<code>anon public key</code>) dari Project Settings &gt; API
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Pengaturan tersimpan di memori browser lokal dan langsung menghubungkan aplikasi ke Supabase DB.</span>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Hubungkan Supabase</span>
              </button>
            </div>
          </form>

          {/* Results Box */}
          {supabaseDiag.result && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 ${
                supabaseDiag.result.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="font-extrabold flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hasil Diagnosa: {supabaseDiag.result.summary}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {supabaseDiag.result.tableStatuses.map((st, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{st.table}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        st.status === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 4: RESET DATA PER-TABEL --- */}
      {activeSubTab === 'resetTables' && (
        <div className="bg-white rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black mb-1">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Panel Pengosongan & Reset Data Spesifik</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Reset Data Masing-Masing Tabel Database
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Pilih tabel mana saja yang ingin dikosongkan. Data pada penyimpanan lokal dan Supabase Cloud DB untuk tabel tersebut akan dihapus permanen.
              </p>
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
    </div>
  );
};
