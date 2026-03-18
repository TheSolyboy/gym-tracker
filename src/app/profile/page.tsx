'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm px-4" style={{paddingTop: 'env(safe-area-inset-top, 0px)'}}>
        <div className="flex items-center h-14">
          <h1 className="text-xl font-bold text-white tracking-tight">Profile</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 mb-tab-bar space-y-3">
        {session?.user ? (
          <>
            <div className="bg-[#141414] rounded-3xl p-5 flex items-center gap-4">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={56}
                  height={56}
                  className="rounded-2xl"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                  <User size={24} className="text-[#555]" />
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{session.user.name}</p>
                <p className="text-[#555] text-sm">{session.user.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full bg-[#141414] rounded-3xl h-14 flex items-center justify-center gap-2 text-[#e63946] font-semibold active:bg-[#1a1a1a] transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-[#555]">Not signed in</p>
          </div>
        )}
      </main>
    </div>
  );
}
