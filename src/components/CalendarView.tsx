'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
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

  const days = [];
  // Pad start
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }
  // Pad end to complete last row
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">{monthName}</h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-[#111] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
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
                onClick={() => router.push(`/entry/${dateStr}`)}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-600/30 border border-rose-600/50" />
          <span>Has entry</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#333]" />
          <span>Has photo</span>
        </div>
      </div>
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
        relative aspect-square rounded-lg overflow-hidden transition-all
        hover:ring-2 hover:ring-rose-600 hover:scale-105
        ${isToday ? 'ring-2 ring-rose-500' : ''}
        ${hasEntry ? 'bg-rose-950/30 border border-rose-900/50' : 'bg-[#111] border border-[#1a1a1a]'}
      `}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`Photo for ${dateStr}`}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <div className={`absolute inset-0 flex items-center justify-center ${photoUrl ? 'bg-black/40' : ''}`}>
        <span
          className={`text-sm font-semibold relative z-10 ${
            isToday
              ? 'text-rose-400'
              : photoUrl || hasEntry
              ? 'text-white'
              : 'text-gray-500'
          }`}
        >
          {day}
        </span>
      </div>
    </button>
  );
}
