import React from 'react';
import { FileSpreadsheet, CloudUpload, DownloadCloud, CheckCircle2 } from 'lucide-react';

export interface CircularSyncModalProps {
  isOpen: boolean;
  type: 'push' | 'pull' | 'reload';
  title: string;
  message: string;
  progress: number;
}

export const CircularSyncModal: React.FC<CircularSyncModalProps> = ({
  isOpen,
  type,
  title,
  message,
  progress
}) => {
  if (!isOpen) return null;

  const isComplete = progress >= 100;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-fade-in">
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-8 max-w-md w-full border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.35)] ring-1 ring-emerald-300/40 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Circular Progress SVG Container */}
        <div className="relative w-36 h-36 flex items-center justify-center my-4">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse" />
          
          <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
            {/* Background Track Circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-emerald-950/80"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-emerald-400 transition-all duration-500 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Icon & Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isComplete ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-bounce" />
            ) : type === 'push' ? (
              <CloudUpload className="w-9 h-9 text-emerald-300 animate-pulse" />
            ) : (
              <DownloadCloud className="w-9 h-9 text-emerald-300 animate-bounce" />
            )}
            <span className="text-lg font-black text-white mt-1 tracking-tight drop-shadow">
              {Math.min(100, Math.max(0, Math.round(progress)))}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
          <span>{title}</span>
        </h3>

        {/* Status Message */}
        <p className="text-sm font-semibold text-emerald-200/90 mt-2 leading-relaxed px-2">
          {message}
        </p>

        {/* Footer Subtext */}
        <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-xs font-bold text-emerald-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Database Google Sheet Cloud Sync</span>
        </div>
      </div>
    </div>
  );
};
