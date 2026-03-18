'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, User, Settings, BarChart2 } from 'lucide-react';
import { haptic } from '@/lib/haptics';

export function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (!session) return null;

  const tabs = [
    { label: 'Progress', icon: CalendarDays, href: '/' },
    { label: 'Analytics', icon: BarChart2, href: '/analytics' },
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname.startsWith('/entry');
    return pathname === href;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-[#242424]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <button
              key={href}
              onClick={() => {
                haptic('light');
                router.push(href);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors"
              aria-label={label}
            >
              <Icon
                size={22}
                className={active ? 'text-[#e63946]' : 'text-[#555]'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  active ? 'text-[#e63946]' : 'text-[#555]'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
