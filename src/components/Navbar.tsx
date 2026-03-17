'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-[#1a1a1a] bg-[#0d0d0d] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg hover:text-rose-400 transition-colors">
          <span className="text-2xl">💪</span>
          <span>Gym Tracker</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-gray-300 text-sm hidden sm:block">
                {session.user.name}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors px-2 py-1 rounded hover:bg-[#1a1a1a]"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
