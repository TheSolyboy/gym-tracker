'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { signIn } from 'next-auth/react';

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

export default function EntryPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entry, setEntry] = useState<EntryData>({});
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Format display date
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEntry();
    }
  }, [status, date]);

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
    try {
      const res = await fetch(`/api/entry/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        setSavedMsg('Saved!');
        setTimeout(() => setSavedMsg(''), 2000);
      }
    } catch (e) {
      console.error('Failed to save', e);
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
        setHasPhoto(true);
        setPhotoUrl(`/api/photo/${date}?t=${Date.now()}`);
      }
    } catch (e) {
      console.error('Failed to upload photo', e);
    } finally {
      setUploading(false);
    }
  }

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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-400">Please sign in to track your progress.</p>
        <button
          onClick={() => signIn('discord')}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Login with Discord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Back to calendar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{displayDate}</h1>
          <p className="text-gray-500 text-sm">Progress Entry</p>
        </div>
      </div>

      {/* Photo Section */}
      <div className="mb-6">
        {hasPhoto && photoUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Progress photo"
              className="w-full rounded-xl object-cover max-h-80"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
              >
                Replace Photo
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center gap-3 hover:border-rose-600 hover:bg-rose-600/5 transition-all group"
          >
            {uploading ? (
              <div className="text-gray-400 animate-pulse">Uploading...</div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-600 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-500 group-hover:text-rose-400 transition-colors">Upload progress photo</span>
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
        {uploading && <p className="text-center text-gray-500 text-sm mt-2 animate-pulse">Uploading photo...</p>}
      </div>

      {/* Stats Form */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Measurements</h2>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={entry.weight ?? ''}
              onChange={(e) => updateField('weight', e.target.value)}
              placeholder="75.5"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-rose-600 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              value={entry.height ?? ''}
              onChange={(e) => updateField('height', e.target.value)}
              placeholder="180"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-rose-600 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">BMI</label>
            <div className="w-full bg-[#0f0f0f] border border-[#222] rounded-lg px-3 py-2 text-gray-400">
              {bmi ?? <span className="text-gray-600">Auto-calculated</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Body Fat (%)</label>
            <input
              type="number"
              step="0.1"
              value={entry.bodyFat ?? ''}
              onChange={(e) => updateField('bodyFat', e.target.value)}
              placeholder="15.0"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-rose-600 transition-colors"
            />
          </div>
        </div>

        {/* Body Measurements */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Body Measurements (cm)</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { field: 'leftBicep' as keyof EntryData, label: 'Left Bicep' },
              { field: 'rightBicep' as keyof EntryData, label: 'Right Bicep' },
              { field: 'chest' as keyof EntryData, label: 'Chest' },
              { field: 'waist' as keyof EntryData, label: 'Waist' },
              { field: 'hips' as keyof EntryData, label: 'Hips' },
              { field: 'neck' as keyof EntryData, label: 'Neck' },
              { field: 'leftThigh' as keyof EntryData, label: 'Left Thigh' },
              { field: 'rightThigh' as keyof EntryData, label: 'Right Thigh' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={entry[field] as number ?? ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-rose-600 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notes</label>
          <textarea
            value={entry.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="How did you feel today? What workouts did you do?"
            rows={3}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-rose-600 transition-colors resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
          {savedMsg && (
            <span className="text-green-400 font-medium">{savedMsg}</span>
          )}
        </div>
      </div>
    </div>
  );
}
