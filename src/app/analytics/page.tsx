'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { kgToLbs, cmToIn } from '@/lib/units';

interface AnalyticsEntry {
  date: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
  leftBicep?: number;
  rightBicep?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  neck?: number;
  leftThigh?: number;
  rightThigh?: number;
}

interface DisplayEntry extends Record<string, unknown> {
  date: string;
  label: string;
}

interface Settings {
  weightUnit: 'kg' | 'lbs';
  measurementUnit: 'cm' | 'in';
}

const CHART_COLORS = {
  primary: '#e63946',
  secondary: '#4fc3f7',
  tertiary: '#81c784',
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '12px',
  color: '#fff',
};

const labelStyle = { color: '#888' };

interface ChartCardProps {
  title: string;
  data: DisplayEntry[];
  lines: { key: string; label: string; color: string }[];
  unit: string;
  minPoints?: number;
}

function ChartCard({ title, data, lines, unit, minPoints = 2 }: ChartCardProps) {
  // Filter to entries that have at least one of the required keys
  const validData = data.filter((d) => lines.some((l) => d[l.key] !== undefined));
  if (validData.length < minPoints) return null;

  return (
    <div className="bg-[#141414] rounded-3xl p-5">
      <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={validData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
            itemStyle={{ color: '#ccc' }}
            formatter={(value) => [`${value} ${unit}`]}
          />
          {lines.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#555', paddingTop: '8px' }}
            />
          )}
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: l.color }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [rawEntries, setRawEntries] = useState<AnalyticsEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({ weightUnit: 'kg', measurementUnit: 'cm' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchAnalytics(), fetchSettings()]).finally(() => setLoading(false));
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setRawEntries(data.entries || []);
      }
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: Settings = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  }

  // Convert raw entries (always kg/cm) to display units
  const displayEntries: DisplayEntry[] = rawEntries.map((e) => {
    const d: DisplayEntry = { date: e.date, label: formatDateLabel(e.date) };

    if (e.weight !== undefined) {
      d.weight = settings.weightUnit === 'lbs'
        ? Math.round(kgToLbs(e.weight) * 10) / 10
        : Math.round(e.weight * 10) / 10;
    }
    if (e.height !== undefined) {
      d.height = settings.measurementUnit === 'in'
        ? Math.round(cmToIn(e.height) * 10) / 10
        : Math.round(e.height * 10) / 10;
    }
    if (e.bodyFat !== undefined) d.bodyFat = Math.round(e.bodyFat * 10) / 10;

    const mFields = ['leftBicep', 'rightBicep', 'chest', 'waist', 'hips', 'neck', 'leftThigh', 'rightThigh'] as const;
    for (const field of mFields) {
      if (e[field] !== undefined) {
        const val = e[field] as number;
        d[field] = settings.measurementUnit === 'in'
          ? Math.round(cmToIn(val) * 10) / 10
          : Math.round(val * 10) / 10;
      }
    }

    return d;
  });

  const wUnit = settings.weightUnit;
  const mUnit = settings.measurementUnit;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-[#e63946] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] px-6 gap-6">
        <p className="text-[#888]">Please sign in to view your analytics.</p>
        <button
          onClick={() => signIn('discord')}
          className="flex items-center gap-2 bg-[#5865F2] active:bg-[#4752C4] text-white font-semibold px-6 h-14 rounded-2xl transition-colors"
        >
          <LogIn size={18} />
          Login with Discord
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center h-14">
          <h1 className="text-xl font-bold text-white tracking-tight">Analytics</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 mb-tab-bar space-y-3 pb-4">
        {displayEntries.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <p className="text-[#555] text-sm text-center">
              Add at least 2 entries to see your progress graphs.
            </p>
          </div>
        ) : (
          <>
            <ChartCard
              title="Weight"
              data={displayEntries}
              lines={[{ key: 'weight', label: 'Weight', color: CHART_COLORS.primary }]}
              unit={wUnit}
            />
            <ChartCard
              title="Height"
              data={displayEntries}
              lines={[{ key: 'height', label: 'Height', color: CHART_COLORS.secondary }]}
              unit={mUnit}
            />
            <ChartCard
              title="Body Fat"
              data={displayEntries}
              lines={[{ key: 'bodyFat', label: 'Body Fat', color: CHART_COLORS.primary }]}
              unit="%"
            />
            <ChartCard
              title="Biceps"
              data={displayEntries}
              lines={[
                { key: 'leftBicep', label: 'Left Bicep', color: CHART_COLORS.primary },
                { key: 'rightBicep', label: 'Right Bicep', color: CHART_COLORS.secondary },
              ]}
              unit={mUnit}
            />
            <ChartCard
              title="Chest"
              data={displayEntries}
              lines={[{ key: 'chest', label: 'Chest', color: CHART_COLORS.primary }]}
              unit={mUnit}
            />
            <ChartCard
              title="Waist"
              data={displayEntries}
              lines={[{ key: 'waist', label: 'Waist', color: CHART_COLORS.primary }]}
              unit={mUnit}
            />
            <ChartCard
              title="Hips"
              data={displayEntries}
              lines={[{ key: 'hips', label: 'Hips', color: CHART_COLORS.tertiary }]}
              unit={mUnit}
            />
            <ChartCard
              title="Neck"
              data={displayEntries}
              lines={[{ key: 'neck', label: 'Neck', color: CHART_COLORS.secondary }]}
              unit={mUnit}
            />
            <ChartCard
              title="Thighs"
              data={displayEntries}
              lines={[
                { key: 'leftThigh', label: 'Left Thigh', color: CHART_COLORS.primary },
                { key: 'rightThigh', label: 'Right Thigh', color: CHART_COLORS.secondary },
              ]}
              unit={mUnit}
            />
          </>
        )}
      </main>
    </div>
  );
}
