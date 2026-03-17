'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { ChevronLeft, Camera, Save, LogIn, Dumbbell } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { kgToLbs, lbsToKg, cmToIn, inToCm } from '@/lib/units';

interface EntryData {
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
  notes?: string;
}

interface UserSettings {
  weightUnit: 'kg' | 'lbs';
  measurementUnit: 'cm' | 'in';
  firstDayOfWeek: 'Monday' | 'Sunday';
  height?: number;
}

export default function EntryPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw entry stored in kg/cm internally
  const [entry, setEntry] = useState<EntryData>({});
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    weightUnit: 'kg',
    measurementUnit: 'cm',
    firstDayOfWeek: 'Monday',
  });

  // Display values (may be in lbs/in depending on settings)
  const [displayWeight, setDisplayWeight] = useState('');
  const [displayMeasurements, setDisplayMeasurements] = useState<Record<string, string>>({});

  // Format display date
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchEntry(), fetchSettings()]);
    }
  }, [status, date]);

  // Sync display values whenever entry or settings change
  useEffect(() => {
    // weight display
    if (entry.weight !== undefined) {
      const disp =
        settings.weightUnit === 'lbs'
          ? String(kgToLbs(entry.weight))
          : String(entry.weight);
      setDisplayWeight(disp);
    } else {
      setDisplayWeight('');
    }

    // measurement display
    const measurementKeys = [
      'leftBicep', 'rightBicep', 'chest', 'waist', 'hips', 'neck', 'leftThigh', 'rightThigh',
    ] as const;
    const newDisplay: Record<string, string> = {};
    for (const key of measurementKeys) {
      const val = entry[key as keyof EntryData] as number | undefined;
      if (val !== undefined) {
        newDisplay[key] =
          settings.measurementUnit === 'in' ? String(cmToIn(val)) : String(val);
      } else {
        newDisplay[key] = '';
      }
    }
    setDisplayMeasurements(newDisplay);
  }, [entry, settings]);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: UserSettings = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  }

  async function fetchEntry() {
    setLoading(true);
    try {
      const res = await fetch(`/api/entry/${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry || {});
        setHasPhoto(data.hasPhoto || false);
        if (data.hasPhoto) {
          setPhotoUrl(`/api/photo/${date}?t=${Date.now()}`);
        }
      }
    } catch (e) {
      console.error('Failed to fetch entry', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/entry/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        haptic('success');
        setSavedMsg('Saved!');
        setTimeout(() => setSavedMsg(''), 2000);
      } else {
        haptic('error');
        setSaveError('Failed to save');
      }
    } catch (e) {
      console.error('Failed to save', e);
      haptic('error');
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`/api/entry/${date}/photo`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        haptic('success');
        setHasPhoto(true);
        setPhotoUrl(`/api/photo/${date}?t=${Date.now()}`);
      } else {
        haptic('error');
      }
    } catch (e) {
      console.error('Failed to upload photo', e);
      haptic('error');
    } finally {
      setUploading(false);
    }
  }

  // BMI always uses raw kg/cm values
  const bmi =
    entry.weight && entry.height
      ? (entry.weight / Math.pow(entry.height / 100, 2)).toFixed(1)
      : null;

  function updateField(field: keyof EntryData, value: string) {
    setEntry((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : field === 'notes' ? value : parseFloat(value),
    }));
  }

  function handleWeightChange(v: string) {
    setDisplayWeight(v);
    if (v === '') {
      setEntry((prev) => ({ ...prev, weight: undefined }));
    } else {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        const kgVal = settings.weightUnit === 'lbs' ? lbsToKg(num) : num;
        setEntry((prev) => ({ ...prev, weight: kgVal }));
      }
    }
  }

  function handleMeasurementChange(field: string, v: string) {
    setDisplayMeasurements((prev) => ({ ...prev, [field]: v }));
    if (v === '') {
      setEntry((prev) => ({ ...prev, [field]: undefined }));
    } else {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        const cmVal = settings.measurementUnit === 'in' ? inToCm(num) : num;
        setEntry((prev) => ({ ...prev, [field]: cmVal }));
      }
    }
  }

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
        <p className="text-[#888]">Please sign in to track your progress.</p>
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

  const wUnit = settings.weightUnit;
  const mUnit = settings.measurementUnit === 'in' ? 'in' : 'cm';

  const measurementFields: { field: string; label: string }[] = [
    { field: 'leftBicep', label: 'Left Bicep' },
    { field: 'rightBicep', label: 'Right Bicep' },
    { field: 'chest', label: 'Chest' },
    { field: 'waist', label: 'Waist' },
    { field: 'hips', label: 'Hips' },
    { field: 'neck', label: 'Neck' },
    { field: 'leftThigh', label: 'Left Thigh' },
    { field: 'rightThigh', label: 'Right Thigh' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              haptic('light');
              router.push('/');
            }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#1a1a1a] active:bg-[#242424] text-[#888] transition-colors"
            aria-label="Back to calendar"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-white font-semibold text-sm leading-tight">{displayDate}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#e63946]/15 active:bg-[#e63946]/25 text-[#e63946] disabled:opacity-40 transition-colors"
            aria-label="Save entry"
          >
            <Save size={20} />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto mb-tab-bar">
        {/* Photo Section */}
        <div className="w-full aspect-[4/3] bg-[#141414] relative">
          {hasPhoto && photoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Progress photo"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm text-white active:bg-black/80 transition-colors"
                aria-label="Replace photo"
              >
                <Camera size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#2a2a2a] active:border-[#e63946] transition-colors"
            >
              {uploading ? (
                <div className="w-8 h-8 rounded-full border-2 border-[#e63946] border-t-transparent animate-spin" />
              ) : (
                <>
                  <Camera size={36} className="text-[#444]" strokeWidth={1.5} />
                  <span className="text-[#555] text-sm font-medium">Add Photo</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
        </div>

        {/* Stats Form */}
        <div className="px-4 pt-4 space-y-3">
          {/* Primary Stats Card */}
          <div className="bg-[#141414] rounded-3xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-semibold text-[#555] uppercase tracking-widest">Primary</p>
            </div>

            {/* Weight */}
            <StatRow
              label="Weight"
              unit={wUnit}
              value={displayWeight}
              onChange={handleWeightChange}
              placeholder={wUnit === 'lbs' ? '165' : '75.5'}
            />
            <div className="mx-5 h-px bg-[#1f1f1f]" />

            {/* Height */}
            <StatRow
              label="Height"
              unit={mUnit}
              value={
                entry.height !== undefined
                  ? settings.measurementUnit === 'in'
                    ? String(cmToIn(entry.height))
                    : String(entry.height)
                  : ''
              }
              onChange={(v) => {
                if (v === '') {
                  setEntry((prev) => ({ ...prev, height: undefined }));
                } else {
                  const num = parseFloat(v);
                  if (!isNaN(num)) {
                    const cmVal = settings.measurementUnit === 'in' ? inToCm(num) : num;
                    setEntry((prev) => ({ ...prev, height: cmVal }));
                  }
                }
              }}
              placeholder={mUnit === 'in' ? '71' : '180'}
            />
            <div className="mx-5 h-px bg-[#1f1f1f]" />

            {/* BMI — read only, always uses kg/cm */}
            <div className="flex items-center justify-between px-5 min-h-[56px]">
              <span className="text-[#888] text-sm font-medium">BMI</span>
              {bmi ? (
                <span className="bg-[#e63946]/15 text-[#e63946] text-sm font-bold px-3 py-1 rounded-full">
                  {bmi}
                </span>
              ) : (
                <span className="text-[#333] text-sm">—</span>
              )}
            </div>
            <div className="mx-5 h-px bg-[#1f1f1f]" />

            {/* Body Fat */}
            <StatRow
              label="Body Fat"
              unit="%"
              value={entry.bodyFat !== undefined ? String(entry.bodyFat) : ''}
              onChange={(v) => updateField('bodyFat', v)}
              placeholder="15.0"
            />
            <div className="pb-2" />
          </div>

          {/* Measurements Card */}
          <div className="bg-[#141414] rounded-3xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-semibold text-[#555] uppercase tracking-widest">
                Measurements ({mUnit})
              </p>
            </div>
            {measurementFields.map(({ field, label }, i) => (
              <div key={field}>
                <StatRow
                  label={label}
                  unit={mUnit}
                  value={displayMeasurements[field] ?? ''}
                  onChange={(v) => handleMeasurementChange(field, v)}
                  placeholder="0.0"
                />
                {i < measurementFields.length - 1 && (
                  <div className="mx-5 h-px bg-[#1f1f1f]" />
                )}
              </div>
            ))}
            <div className="pb-2" />
          </div>

          {/* Notes Card */}
          <div className="bg-[#141414] rounded-3xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-semibold text-[#555] uppercase tracking-widest">Notes</p>
            </div>
            <textarea
              value={entry.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="How did you feel? What did you train?"
              rows={4}
              className="w-full bg-transparent px-5 pb-5 text-[#e5e5e5] placeholder-[#333] focus:outline-none resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#e63946] active:bg-[#cc2f3b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-3xl transition-colors flex items-center justify-center gap-2"
            style={{ height: '56px' }}
          >
            <Dumbbell size={20} strokeWidth={2} />
            {saving ? 'Saving...' : savedMsg || 'Save Entry'}
          </button>

          {saveError && (
            <p className="text-center text-[#e63946] text-sm">{saveError}</p>
          )}

          {/* bottom spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Row ───────────────────────────────────────────────────────────────

interface StatRowProps {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function StatRow({ label, unit, value, onChange, placeholder }: StatRowProps) {
  return (
    <div className="flex items-center justify-between px-5 min-h-[56px] gap-4">
      <span className="text-[#888] text-sm font-medium shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-20 bg-transparent text-right text-white text-sm font-medium placeholder-[#333] focus:outline-none"
        />
        <span className="text-[#444] text-xs shrink-0">{unit}</span>
      </div>
    </div>
  );
}
