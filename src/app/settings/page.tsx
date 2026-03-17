'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Ruler, Weight, Calendar, User } from 'lucide-react';
import { haptic } from '@/lib/haptics';

type WeightUnit = 'kg' | 'lbs';
type MeasurementUnit = 'cm' | 'in';
type FirstDayOfWeek = 'Monday' | 'Sunday';

interface Settings {
  weightUnit: WeightUnit;
  measurementUnit: MeasurementUnit;
  firstDayOfWeek: FirstDayOfWeek;
  height?: number;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-[#1a1a1a] rounded-xl p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => {
            haptic('light');
            onChange(opt);
          }}
          className={`flex-1 h-8 rounded-[10px] text-sm font-semibold transition-colors ${
            value === opt
              ? 'bg-[#e63946] text-white'
              : 'text-[#666] active:text-[#999]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2 mt-5">
      <span className="text-[#e63946]">{icon}</span>
      <p className="text-xs font-semibold text-[#555] uppercase tracking-widest">{label}</p>
    </div>
  );
}

function SettingRow({ label, control }: { label: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 min-h-[56px] gap-4">
      <span className="text-[#888] text-sm font-medium shrink-0">{label}</span>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    weightUnit: 'kg',
    measurementUnit: 'cm',
    firstDayOfWeek: 'Monday',
    height: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        haptic('success');
        setSavedMsg('Saved!');
        setTimeout(() => setSavedMsg(''), 2000);
      } else {
        haptic('error');
        setSaveError('Failed to save');
      }
    } catch {
      haptic('error');
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-[#e63946] border-t-transparent animate-spin" />
      </div>
    );
  }

  const heightUnit = settings.measurementUnit === 'in' ? 'in' : 'cm';

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="flex items-center px-4 h-14 gap-3">
          <button
            onClick={() => {
              haptic('light');
              router.back();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#1a1a1a] active:bg-[#242424] text-[#888] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 mb-tab-bar">
        {/* Units section */}
        <SectionHeader icon={<Weight size={14} />} label="Units" />
        <div className="bg-[#141414] rounded-3xl overflow-hidden">
          <SettingRow
            label="Weight"
            control={
              <SegmentedControl<WeightUnit>
                options={['kg', 'lbs']}
                value={settings.weightUnit}
                onChange={(v) => setSettings((s) => ({ ...s, weightUnit: v }))}
              />
            }
          />
          <div className="mx-5 h-px bg-[#1f1f1f]" />
          <SettingRow
            label="Measurements"
            control={
              <SegmentedControl<MeasurementUnit>
                options={['cm', 'in']}
                value={settings.measurementUnit}
                onChange={(v) => setSettings((s) => ({ ...s, measurementUnit: v }))}
              />
            }
          />
        </div>

        {/* General section */}
        <SectionHeader icon={<Calendar size={14} />} label="General" />
        <div className="bg-[#141414] rounded-3xl overflow-hidden">
          <SettingRow
            label="First day of week"
            control={
              <SegmentedControl<FirstDayOfWeek>
                options={['Monday', 'Sunday']}
                value={settings.firstDayOfWeek}
                onChange={(v) => setSettings((s) => ({ ...s, firstDayOfWeek: v }))}
              />
            }
          />
        </div>

        {/* Profile section */}
        <SectionHeader icon={<User size={14} />} label="Profile" />
        <div className="bg-[#141414] rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-5 min-h-[56px] gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Ruler size={16} className="text-[#555]" />
              <span className="text-[#888] text-sm font-medium">Height</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={settings.height ?? ''}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    height: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  }))
                }
                placeholder={heightUnit === 'cm' ? '180' : '71'}
                className="w-20 bg-transparent text-right text-white text-sm font-medium placeholder-[#333] focus:outline-none"
              />
              <span className="text-[#444] text-xs shrink-0">{heightUnit}</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#e63946] active:bg-[#cc2f3b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-3xl transition-colors flex items-center justify-center"
            style={{ height: '56px' }}
          >
            {saving ? 'Saving...' : savedMsg || 'Save Settings'}
          </button>
          {saveError && (
            <p className="text-center text-[#e63946] text-sm mt-2">{saveError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
