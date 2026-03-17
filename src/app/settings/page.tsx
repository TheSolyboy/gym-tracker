'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm px-4">
        <div className="flex items-center h-14">
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 mb-tab-bar">
        <div className="bg-[#141414] rounded-3xl p-8 flex flex-col items-center gap-3">
          <Settings size={32} className="text-[#333]" strokeWidth={1.5} />
          <p className="text-[#555] text-sm text-center">Settings coming soon</p>
        </div>
      </main>
    </div>
  );
}
