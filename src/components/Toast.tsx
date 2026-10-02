import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X, Check } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div 
      onClick={() => {
        // Dismiss all toasts if clicking backdrop
        toasts.forEach((t) => removeToast(t.id));
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="flex flex-col items-center gap-4 max-w-xl w-full cursor-default"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className={`w-full p-6 sm:p-8 rounded-2xl shadow-2xl border-2 transition-all duration-300 transform scale-100 flex flex-col items-center text-center relative overflow-hidden ${
                isSuccess
                  ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-400/80 shadow-emerald-950/70 ring-1 ring-emerald-300/40'
                  : isError
                  ? 'bg-gradient-to-br from-emerald-950 via-rose-950 to-emerald-950 text-white border-rose-400/80 shadow-rose-950/70 ring-1 ring-rose-400/40'
                  : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-400/80 shadow-emerald-950/70 ring-1 ring-emerald-300/40'
              }`}
            >
              {/* Close Button Top Right */}
              <button
                onClick={() => removeToast(t.id)}
                className="absolute top-4 right-4 p-2 text-emerald-200/70 hover:text-white hover:bg-emerald-800/50 rounded-full transition-colors cursor-pointer"
                aria-label="Tutup pesan"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Icon Box */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                  isSuccess
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                    : isError
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-10 h-10 animate-bounce text-emerald-300" />}
                {isError && <AlertCircle className="w-10 h-10 animate-pulse text-rose-300" />}
                {!isSuccess && !isError && <Info className="w-10 h-10 text-emerald-300" />}
              </div>

              {/* Header Title */}
              <span
                className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase px-3.5 py-1.5 rounded-full mb-2 ${
                  isSuccess
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                    : isError
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                }`}
              >
                {isSuccess ? 'PEMBERITAHUAN BERHASIL' : isError ? 'PERHATIAN / PROSES GAGAL' : 'INFORMASI SISTEM'}
              </span>

              {/* Message Body - Big & Clear */}
              <div className="my-2">
                <p className="text-lg sm:text-xl font-bold leading-relaxed text-white break-words px-2 drop-shadow-sm">
                  {t.message}
                </p>
              </div>

              {/* Auto Close Subtext */}
              <span className="text-xs text-emerald-200/80 mt-2 flex items-center gap-1.5 animate-pulse">
                <span>• Pesan ini akan menutup otomatis dalam 2 detik</span>
              </span>

              {/* Animated Progress Bar at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-950/60 overflow-hidden">
                <div
                  className={`h-full transition-all duration-[2000ms] ease-linear w-0 ${
                    isError ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: '100%', animation: 'shrinkBar 2s linear forwards' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

