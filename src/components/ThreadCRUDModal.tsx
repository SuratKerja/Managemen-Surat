import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BerkasThread } from '../types';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  Layers,
  FileText,
  Inbox,
  Send,
  ExternalLink,
  Tag,
  AlertCircle
} from 'lucide-react';

interface ThreadCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Currently selected thread ID for the active document form
  selectedThreadId?: string | null;
  // Callback when a thread is selected / chosen for this document
  onSelectThread?: (thread: BerkasThread | null) => void;
  // Optional document to auto-link upon creating a new thread
  documentToAutoLink?: {
    type: 'masuk' | 'keluar';
    id: string;
    nomorNaskah: string;
    perihal: string;
  };
}

export const ThreadCRUDModal: React.FC<ThreadCRUDModalProps> = ({
  isOpen,
  onClose,
  selectedThreadId,
  onSelectThread,
  documentToAutoLink
}) => {
  const {
    berkasThreadList,
    createBerkasThread,
    updateBerkasThread,
    deleteBerkasThread,
    getNextThreadNumber,
    klasifikasiSub,
    klasifikasiArsipList,
    showToast,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<BerkasThread | null>(null);

  // Form Fields
  const [nomorThread, setNomorThread] = useState<string>('');
  const [namaBerkas, setNamaBerkas] = useState<string>('');
  const [klasifikasiBerkas, setKlasifikasiBerkas] = useState<string>('');
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState<string>('');
  const [uraianBerkas, setUraianBerkas] = useState<string>('');
  const [statusBerkas, setStatusBerkas] = useState<'Aktif' | 'Inaktif' | 'Ditutup'>('Aktif');

  // Search in list view
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate next automatic thread number when modal opens or in create mode
  const refreshAutoNumber = () => {
    const nextNum = getNextThreadNumber();
    setNomorThread(nextNum);
  };

  useEffect(() => {
    if (isOpen && !editingThreadId) {
      refreshAutoNumber();
      // Set default classification if available
      if (klasifikasiSub.length > 0 && !klasifikasiBerkas) {
        setKlasifikasiBerkas(klasifikasiSub[0].klasifikasiUtama);
      }
      if (klasifikasiArsipList.length > 0 && !kodeKlasifikasi) {
        setKodeKlasifikasi(klasifikasiArsipList[0].kodeKlasifikasi);
      }
    }
  }, [isOpen, editingThreadId]);

  // Handle classification change - optionally suggest archive code
  const handleKlasifikasiChange = (val: string) => {
    setKlasifikasiBerkas(val);
    // Find matching archive code if any
    const matchedArsip = klasifikasiArsipList.find((ka) =>
      ka.namaKlasifikasi.toLowerCase().includes(val.toLowerCase()) ||
      val.toLowerCase().includes(ka.namaKlasifikasi.toLowerCase())
    );
    if (matchedArsip) {
      setKodeKlasifikasi(matchedArsip.kodeKlasifikasi);
    }
  };

  const handleKodeArsipChange = (val: string) => {
    setKodeKlasifikasi(val);
    const matched = klasifikasiArsipList.find((ka) => ka.kodeKlasifikasi === val);
    if (matched && !uraianBerkas) {
      setUraianBerkas(matched.namaKlasifikasi);
    }
  };

  const handleResetForm = () => {
    setEditingThreadId(null);
    setNamaBerkas('');
    setUraianBerkas('');
    setStatusBerkas('Aktif');
    refreshAutoNumber();
    if (klasifikasiSub.length > 0) setKlasifikasiBerkas(klasifikasiSub[0].klasifikasiUtama);
    if (klasifikasiArsipList.length > 0) setKodeKlasifikasi(klasifikasiArsipList[0].kodeKlasifikasi);
  };

  const handleEditThread = (thread: BerkasThread) => {
    setEditingThreadId(thread.id);
    setNomorThread(thread.nomorThread);
    setNamaBerkas(thread.namaBerkas);
    setKlasifikasiBerkas(thread.klasifikasiBerkas || '');
    setKodeKlasifikasi(thread.kodeKlasifikasi || '');
    setUraianBerkas(thread.uraianBerkas || '');
    setStatusBerkas(thread.statusBerkas || 'Aktif');
    setActiveTab('create');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBerkas.trim()) {
      showToast('Nama Berkas wajib diisi!', 'error');
      return;
    }

    if (editingThreadId) {
      // Update
      const success = updateBerkasThread(editingThreadId, {
        nomorThread,
        namaBerkas: namaBerkas.trim(),
        klasifikasiBerkas,
        kodeKlasifikasi,
        uraianBerkas: uraianBerkas.trim(),
        statusBerkas
      });

      if (success) {
        showToast('Thread Berkas berhasil diperbarui!', 'success');
        const updated = berkasThreadList.find((t) => t.id === editingThreadId);
        if (updated && onSelectThread) {
          onSelectThread(updated);
        }
        handleResetForm();
        setActiveTab('list');
      }
    } else {
      // Create new
      const initialMasukIds: string[] = [];
      const initialKeluarIds: string[] = [];

      if (documentToAutoLink) {
        if (documentToAutoLink.type === 'masuk') {
          initialMasukIds.push(documentToAutoLink.id);
        } else {
          initialKeluarIds.push(documentToAutoLink.id);
        }
      }

      const newThread = createBerkasThread({
        nomorThread,
        namaBerkas: namaBerkas.trim(),
        klasifikasiBerkas,
        kodeKlasifikasi,
        uraianBerkas: uraianBerkas.trim(),
        statusBerkas,
        naskahMasukIds: initialMasukIds,
        naskahKeluarIds: initialKeluarIds
      });

      showToast(`Thread ${newThread.nomorThread} berhasil dibuat!`, 'success');

      if (onSelectThread) {
        onSelectThread(newThread);
      }

      handleResetForm();
      onClose();
    }
  };

  const handleDelete = (thread: BerkasThread) => {
    setThreadToDelete(thread);
  };

  const handleConfirmDelete = () => {
    if (!threadToDelete) return;
    const id = threadToDelete.id;
    deleteBerkasThread(id);
    if (selectedThreadId === id && onSelectThread) {
      onSelectThread(null);
    }
    if (editingThreadId === id) {
      handleResetForm();
    }
    setThreadToDelete(null);
  };

  if (!isOpen) return null;

  const filteredThreads = berkasThreadList.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.nomorThread.toLowerCase().includes(q) ||
      t.namaBerkas.toLowerCase().includes(q) ||
      (t.klasifikasiBerkas && t.klasifikasiBerkas.toLowerCase().includes(q)) ||
      (t.kodeKlasifikasi && t.kodeKlasifikasi.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs">
              <FolderKanban className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {editingThreadId ? 'Edit Thread Berkas' : 'Kelola & Tambah Thread (Pemberkasan)'}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Mengelompokkan surat masuk dan surat keluar yang saling berkaitan dalam satu alur arsip.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              if (editingThreadId) handleResetForm();
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingThreadId ? 'Edit Form Thread' : '+ Tambah Thread Baru'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Daftar Thread ({berkasThreadList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {documentToAutoLink && !editingThreadId && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-emerald-950">
                  <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Menghubungkan Surat Ini Otomatis:</span>
                    <span className="text-[11px] text-emerald-800">
                      Surat No. <span className="font-mono font-bold">{documentToAutoLink.nomorNaskah || '(Belum bernomor)'}</span> ({documentToAutoLink.perihal}) akan langsung masuk ke dalam Thread ini.
                    </span>
                  </div>
                </div>
              )}

              {/* 1. Nomor Thread: Otomatis */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <span>1. Nomor Thread</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Otomatis
                    </span>
                  </label>
                  {!editingThreadId && (
                    <button
                      type="button"
                      onClick={refreshAutoNumber}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                      title="Perbarui nomor urut terbaru"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Ulang</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={nomorThread}
                    onChange={(e) => setNomorThread(e.target.value)}
                    placeholder="Contoh: TH-2026-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-emerald-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format dapat diatur di menu <span className="font-bold text-slate-600">Master Data &rarr; Pengaturan Nomor Thread</span>.
                </p>
              </div>

              {/* 2. Nama Berkas: Textbox */}
              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  2. Nama Berkas / Judul Thread <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaBerkas}
                  onChange={(e) => setNamaBerkas(e.target.value)}
                  placeholder="Contoh: Berkas Usulan Kenaikan Pangkat Golongan IV Periode Oktober 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  required
                />
              </div>

              {/* 3. Klasifikasi Berkas: Dropdown Klasifikasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Klasifikasi Berkas (Dropdown)</span>
                  </label>
                  <select
                    value={klasifikasiBerkas}
                    onChange={(e) => handleKlasifikasiChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="">-- Pilih Klasifikasi Berkas --</option>
                    {klasifikasiSub.map((k) => (
                      <option key={k.id} value={k.klasifikasiUtama}>
                        {k.klasifikasiUtama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Kode Klasifikasi: (Kode Arsip) dari Master Data Klasifikasi Arsip */}
                <div>
                  <label className="block font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-teal-600" />
                    <span>4. Kode Klasifikasi (Kode Arsip)</span>
                  </label>
                  <select
                    value={kodeKlasifikasi}
                    onChange={(e) => handleKodeArsipChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="">-- Pilih Kode Klasifikasi Arsip --</option>
                    {klasifikasiArsipList.map((ka) => (
                      <option key={ka.id} value={ka.kodeKlasifikasi}>
                        {ka.kodeKlasifikasi} - {ka.namaKlasifikasi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Uraian Berkas (Opsional) & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Uraian / Deskripsi Berkas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={uraianBerkas}
                    onChange={(e) => setUraianBerkas(e.target.value)}
                    placeholder="Catatan tambahan mengenai berkas ini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Berkas</label>
                  <select
                    value={statusBerkas}
                    onChange={(e) => setStatusBerkas(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                  >
                    <option value="Aktif">Aktif (Sedang Berjalan)</option>
                    <option value="Inaktif">Inaktif (Arsip Pasif)</option>
                    <option value="Ditutup">Ditutup (Selesai Penuh)</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Reset Form
                  </button>

                  {editingThreadId && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = berkasThreadList.find((t) => t.id === editingThreadId);
                        if (target) setThreadToDelete(target);
                      }}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus Thread Ini</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingThreadId ? 'Simpan Perubahan' : 'Buat Thread Berkas'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Daftar Thread View */
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor thread, nama berkas, atau kode..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Thread list table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">No. Thread</th>
                        <th className="py-2.5 px-3">Nama Berkas</th>
                        <th className="py-2.5 px-2 text-center">Naskah</th>
                        <th className="py-2.5 px-2 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredThreads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Belum ada thread yang terdaftar.
                          </td>
                        </tr>
                      ) : (
                        filteredThreads.map((thread) => {
                          const isSelected = selectedThreadId === thread.id;
                          return (
                            <tr
                              key={thread.id}
                              className={`transition-colors hover:bg-emerald-50/50 ${
                                isSelected ? 'bg-emerald-50/80 font-semibold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-900 whitespace-nowrap">
                                {thread.nomorThread}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 line-clamp-1">
                                  {thread.namaBerkas}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  {thread.kodeKlasifikasi && (
                                    <span className="font-mono bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded border border-teal-200">
                                      {thread.kodeKlasifikasi}
                                    </span>
                                  )}
                                  <span>{thread.klasifikasiBerkas}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                                  <span className="text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                    {(thread.naskahMasukIds || []).length}M
                                  </span>
                                  <span className="text-sky-700 bg-sky-100 px-1.5 rounded">
                                    {(thread.naskahKeluarIds || []).length}K
                                  </span>
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    thread.statusBerkas === 'Aktif'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : thread.statusBerkas === 'Inaktif'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {thread.statusBerkas || 'Aktif'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  {onSelectThread && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectThread(isSelected ? null : thread);
                                        onClose();
                                      }}
                                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      }`}
                                      title={isSelected ? 'Batalkan pilihan' : 'Pilih thread ini'}
                                    >
                                      {isSelected ? 'Terpilih' : 'Pilih'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleEditThread(thread)}
                                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Thread"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(thread)}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete Thread */}
      {threadToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Thread Berkas?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  Apakah Anda yakin ingin menghapus Thread Berkas <strong className="font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{threadToDelete.nomorThread}</strong>?
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  "{threadToDelete.namaBerkas}"
                </p>
                <div className="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-3 mt-3 border border-amber-200 text-left">
                  <span>Seluruh surat masuk dan keluar yang pernah ditautkan akan dilepaskan dari thread ini dan tetap aman di database surat.</span>
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
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Thread</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
