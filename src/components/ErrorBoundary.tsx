import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare readonly props: Props;
  state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Terjadi Kendala Memuat Aplikasi
            </h2>
            
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Browser di perangkat ini mungkin menyimpan cache versi lama atau data lokal perlu diperbarui agar kompatibel.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>Bersihkan Cache & Buka Kembali</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left text-xs bg-slate-100 p-3 rounded-xl text-slate-600 overflow-x-auto">
                <summary className="cursor-pointer font-bold text-slate-500 hover:text-slate-700">
                  Lihat Detail Teknis (Error Log)
                </summary>
                <p className="mt-2 font-mono text-[11px] text-rose-600 break-words whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
