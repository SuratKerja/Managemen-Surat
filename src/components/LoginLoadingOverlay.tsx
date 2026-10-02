/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

interface LoginLoadingOverlayProps {
  isOpen: boolean;
  userName: string;
}

export const LoginLoadingOverlay: React.FC<LoginLoadingOverlayProps> = ({ isOpen, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fadeIn px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full border border-emerald-100 flex flex-col items-center text-center animate-scaleUp">
        {/* Animated Emerald Spinner & Icon */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-600 border-r-emerald-500 rounded-full animate-spin" />
          {/* Inner rotating reverse ring */}
          <div className="absolute inset-3 border-4 border-emerald-50 border-b-emerald-500 border-l-emerald-600 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          {/* Center glowing badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-2 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Otentikasi Berhasil</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest pt-2">
            Selamat Datang
          </h3>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight break-words">
            {userName || 'User'}
          </h2>
        </div>

        {/* Status indicator */}
        <div className="mt-6 pt-5 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-xs text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Memuat halaman utama dan data naskah...</span>
        </div>
      </div>
    </div>
  );
};
