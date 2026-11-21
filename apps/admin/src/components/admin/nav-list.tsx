'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/admin/icons';
import { NAV, activeHref } from '@/components/admin/nav';

/**
 * The menu. `onNavigate` lets the phone drawer close itself after a tap.
 * `badges` shows a count next to an item, e.g. { '/inbox': 3 } for unread messages.
 */
export function NavList({ onNavigate, badges }: { onNavigate?: () => void; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <nav aria-label="Admin sections" className="grid gap-6">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">{group.title}</p>
          <ul className="grid gap-0.5">
            {group.items.map((item) => {
              const isActive = item.href === active;
              const base = 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition';
              if (!item.ready) {
                return (
                  <li key={item.href}>
                    <span
                      className={`${base} cursor-not-allowed text-white/40`}
                      aria-disabled="true"
                      title={item.step ? `Coming in step ${item.step}` : 'Coming soon'}
                    >
                      <Icon name={item.icon} size={18} />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">Soon</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${base} ${isActive ? 'bg-white/12 text-white shadow-[inset_3px_0_0_var(--accent)]' : 'text-white/75 hover:bg-white/8 hover:text-white'}`}
                  >
                    <Icon name={item.icon} size={18} className={isActive ? 'text-accent' : undefined} />
                    <span className="flex-1">{item.label}</span>
                    {!!badges?.[item.href] && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-on-accent">
                        {badges[item.href] > 99 ? '99+' : badges[item.href]}
                        <span className="sr-only"> new</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
