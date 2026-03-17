'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface CalendarData {
  dates: string[];
  photoDates: string[];
}

export function CalendarView() {
  const router = useRouter();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [data, setData] = useState<CalendarData>({ dates: [], photoDates: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [entriesRes, photosRes] = await Promise.all([
        fetch('/api/entries'),
        fetch('/api/photos'),
      ]);
      const entries = entriesRes.ok ? await entriesRes.json() : { dates: [] };
      const photos = photosRes.ok ? await photosRes.json() : { dates: [] };
      setData({ dates: entries.dates || [], photoDates: photos.dates || [] });
    } catch (e) {
      console.error('Failed to fetch calendar data', e);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    haptic('light');
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    haptic('light');
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const entrySet = new Set(data.dates);
  const photoSet = new Set(data.photoDates);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <button
          onClick={prevMonth}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#1a1a1a] active:bg-[#242424] text-[#888] active:text-white transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white">{monthName}</h2>
        <button
          onClick={nextMonth}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#1a1a1a] active:bg-[#242424] text-[#888] active:text-white transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#444] uppercase tracking-widest py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-[#141414] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = entrySet.has(dateStr);
            const hasPhotoForDay = photoSet.has(dateStr);
            const isToday = dateStr === today;

            return (
              <DayTile
                key={dateStr}
                day={day}
                dateStr={dateStr}
                hasEntry={hasEntry}
                hasPhoto={hasPhotoForDay}
                isToday={isToday}
                onClick={() => {
                  haptic('light');
                  router.push(`/entry/${dateStr}`);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DayTileProps {
  day: number;
  dateStr: string;
  hasEntry: boolean;
  hasPhoto: boolean;
  isToday: boolean;
  onClick: () => void;
}

function DayTile({ day, dateStr, hasEntry, hasPhoto, isToday, onClick }: DayTileProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (hasPhoto) {
      setPhotoUrl(`/api/photo/${dateStr}`);
    }
  }, [hasPhoto, dateStr]);

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-xl overflow-hidden transition-transform active:scale-95
        ${isToday ? 'ring-2 ring-[#e63946] ring-offset-1 ring-offset-[#0a0a0a]' : ''}
        ${!photoUrl && hasEntry ? 'bg-[#e63946]/15' : 'bg-[#141414]'}
      `}
      style={{ minHeight: '44px' }}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`Photo for ${dateStr}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Gradient overlay for photo tiles */}
      {photoUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      )}
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span
          className={`text-[11px] font-semibold relative z-10 ${
            isToday
              ? 'text-[#e63946]'
              : photoUrl
              ? 'text-white'
              : hasEntry
              ? 'text-[#e5e5e5]'
              : 'text-[#444]'
          }`}
        >
          {day}
        </span>
      </div>
    </button>
  );
}
