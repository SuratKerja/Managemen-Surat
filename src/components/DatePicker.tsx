import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, Check, Sparkles } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  required = false,
  disabled = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current selected date or default to today for view navigation
  const parsedValue = value && !isNaN(Date.parse(value)) ? new Date(value + 'T00:00:00') : null;
  
  const [viewDate, setViewDate] = useState<Date>(() => parsedValue || new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view date if value changes from outside
  useEffect(() => {
    if (parsedValue) {
      setViewDate(parsedValue);
    }
  }, [value]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Days in current month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const selectedIso = `${year}-${mm}-${dd}`;
    onChange(selectedIso);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;
    onChange(todayIso);
    setViewDate(today);
    setIsOpen(false);
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setViewDate(tomorrow);
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setViewDate(yesterday);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Format date display for input trigger
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
    const dayNum = d.getDate();
    const monthName = MONTH_NAMES_ID[d.getMonth()];
    const yr = d.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${yr}`;
  };

  const todayObj = new Date();
  const isToday = (dayNum: number) => {
    return (
      todayObj.getDate() === dayNum &&
      todayObj.getMonth() === month &&
      todayObj.getFullYear() === year
    );
  };

  const isSelected = (dayNum: number) => {
    if (!parsedValue) return false;
    return (
      parsedValue.getDate() === dayNum &&
      parsedValue.getMonth() === month &&
      parsedValue.getFullYear() === year
    );
  };

  // Years option (10 years back, 10 years forward)
  const currentYear = new Date().getFullYear();
  const yearsOptions = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Hidden native input for form compatibility/required checks */}
      <input
        type="date"
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        required={required}
        tabIndex={-1}
      />

      {/* Modern Custom Date Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
          isOpen
            ? 'border-emerald-500 ring-4 ring-emerald-500/15 bg-white'
            : value
            ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60 text-slate-900'
            : 'border-slate-300 bg-white hover:border-slate-400 text-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              value ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left truncate">
            {value ? (
              <>
                <span className="text-sm font-bold text-slate-900 truncate">
                  {formatDisplayDate(value)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 font-mono">
                  {value}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {value && !required && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
              title="Hapus tanggal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 font-semibold px-2 py-1 rounded-lg transition-colors border border-slate-200">
            {isOpen ? 'Tutup' : 'Pilih'}
          </span>
        </div>
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto right-0 sm:right-auto top-full mt-2 z-50 w-80 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={month}
                onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value), 1))}
                className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {MONTH_NAMES_ID.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={year}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), month, 1))}
                className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Nav Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={handleSetToday}
              className="flex-1 py-1 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors text-center flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Hari Ini</span>
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className="py-1 px-2 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={handleSetTomorrow}
              className="py-1 px-2 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Besok
            </button>
          </div>

          {/* Day Names Grid */}
          <div className="grid grid-cols-7 text-center mb-1">
            {DAY_NAMES_ID.map((d, i) => (
              <span
                key={d}
                className={`text-[11px] font-bold py-1 ${
                  i === 0 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month filler days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="py-2 text-xs text-slate-300 font-medium select-none pointer-events-none"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);
              const dayOfWeek = (firstDayOfMonth + i) % 7;
              const isSunday = dayOfWeek === 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`relative py-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105 z-10'
                      : today
                      ? 'bg-amber-100 text-amber-900 border border-amber-400/80 font-extrabold'
                      : isSunday
                      ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <span>{dayNum}</span>
                  {today && !selected && (
                    <span className="w-1 h-1 bg-amber-500 rounded-full mt-0.5"></span>
                  )}
                  {selected && (
                    <Check className="w-3 h-3 text-white absolute bottom-0.5 right-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-medium">
              Format: YYYY-MM-DD
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
