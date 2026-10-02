import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BerkasThread } from '../types';
import { ThreadCRUDModal } from './ThreadCRUDModal';
import {
  FolderKanban,
  Plus,
  Layers,
  ExternalLink,
  X,
  CheckCircle2,
  Tag,
  Link as LinkIcon
} from 'lucide-react';

interface ThreadFieldSelectorProps {
  documentType: 'masuk' | 'keluar';
  documentId?: string | null;
  nomorNaskah?: string;
  perihal?: string;
  // Controlled or callback
  selectedThreadId?: string | null;
  onThreadChange?: (threadId: string | null) => void;
}

export const ThreadFieldSelector: React.FC<ThreadFieldSelectorProps> = ({
  documentType,
  documentId,
  nomorNaskah = '',
  perihal = '',
  selectedThreadId,
  onThreadChange
}) => {
  const {
    berkasThreadList,
    setActiveTab,
    linkNaskahToThread,
    unlinkNaskahFromThread
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find currently connected thread for this document
  const linkedThread = berkasThreadList.find((t) => {
    if (selectedThreadId) return t.id === selectedThreadId;
    if (documentId) {
      if (documentType === 'masuk') {
        return (t.naskahMasukIds || []).includes(documentId);
      } else {
        return (t.naskahKeluarIds || []).includes(documentId);
      }
    }
    return false;
  });

  const handleSelectThread = (thread: BerkasThread | null) => {
    if (onThreadChange) {
      onThreadChange(thread ? thread.id : null);
    }
    if (documentId) {
      if (thread) {
        linkNaskahToThread(thread.id, documentType, documentId);
      } else if (linkedThread) {
        unlinkNaskahFromThread(linkedThread.id, documentType, documentId);
      }
    }
  };

  const handleUnlink = () => {
    if (linkedThread && documentId) {
      unlinkNaskahFromThread(linkedThread.id, documentType, documentId);
    }
    if (onThreadChange) {
      onThreadChange(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-2xl border border-emerald-200 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-700 text-white rounded-lg shadow-2xs">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                Pemberkasan Surat (Thread)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Fitur Integrasi
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Satukan naskah masuk & keluar yang berkaitan ke dalam satu nomor berkas/thread.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah / Kelola Thread</span>
        </button>
      </div>

      {/* Selected Thread Info or Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 border-t border-emerald-100">
        <div className="md:col-span-8">
          <div className="relative">
            <select
              value={linkedThread ? linkedThread.id : (selectedThreadId || '')}
              onChange={(e) => {
                const targetId = e.target.value;
                if (!targetId) {
                  handleSelectThread(null);
                } else {
                  const found = berkasThreadList.find((t) => t.id === targetId);
                  handleSelectThread(found || null);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-semibold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="">-- Tidak Dikaitkan ke Thread Manapun --</option>
              {berkasThreadList.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.nomorThread}] {t.namaBerkas} {t.kodeKlasifikasi ? `(${t.kodeKlasifikasi})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          {linkedThread ? (
            <div className="flex items-center gap-1.5 w-full justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('pemberkasan')}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
                title="Buka menu Pemberkasan untuk melihat riwayat thread ini"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Lihat Alur</span>
              </button>

              <button
                type="button"
                onClick={handleUnlink}
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Lepas dari thread ini"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Pilih thread atau buat baru
            </span>
          )}
        </div>
      </div>

      {/* Linked Thread Banner Details */}
      {linkedThread && (
        <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
              {linkedThread.nomorThread}
            </span>
            <span className="font-bold text-slate-800">{linkedThread.namaBerkas}</span>
            {linkedThread.kodeKlasifikasi && (
              <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Kode: {linkedThread.kodeKlasifikasi}
              </span>
            )}
            {linkedThread.klasifikasiBerkas && (
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {linkedThread.klasifikasiBerkas}
              </span>
            )}
          </div>

          <div className="text-[11px] font-bold text-slate-500">
            Total Dokumen: {(linkedThread.naskahMasukIds?.length || 0) + (linkedThread.naskahKeluarIds?.length || 0)}
          </div>
        </div>
      )}

      {/* CRUD Modal for Threads */}
      <ThreadCRUDModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedThreadId={linkedThread?.id || selectedThreadId}
        onSelectThread={handleSelectThread}
        documentToAutoLink={
          documentId
            ? {
                type: documentType,
                id: documentId,
                nomorNaskah: nomorNaskah || '',
                perihal: perihal || ''
              }
            : undefined
        }
      />
    </div>
  );
};
