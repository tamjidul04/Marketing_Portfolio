/**
 * The admin menu. Items with ready:false show a "Soon" tag and are not clickable yet.
 * When a section is built, set ready:true — nothing else needs to change.
 */
export type NavItem = { href: string; label: string; icon: string; ready: boolean; step?: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: 'home', ready: true },
      { href: '/inbox', label: 'Inbox', icon: 'inbox', ready: false, step: '3.6' },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/case-studies', label: 'Case studies', icon: 'briefcase', ready: false, step: '3.3' },
      { href: '/testimonials', label: 'Testimonials', icon: 'quote', ready: false, step: '3.3' },
      { href: '/profile', label: 'Profile & hero', icon: 'user', ready: false, step: '3.2' },
      { href: '/stats', label: 'Results', icon: 'chart', ready: false, step: '3.2' },
      { href: '/services', label: 'Services', icon: 'target', ready: false, step: '3.2' },
      { href: '/process', label: 'Process', icon: 'steps', ready: false, step: '3.2' },
      { href: '/tools', label: 'Tools', icon: 'tool', ready: false, step: '3.2' },
      { href: '/about', label: 'About facts', icon: 'info', ready: false, step: '3.2' },
      { href: '/faq', label: 'FAQ', icon: 'help', ready: false, step: '3.2' },
      { href: '/brands', label: 'Brands & badges', icon: 'badge', ready: false, step: '3.4' },
    ],
  },
  {
    title: 'Site',
    items: [
      { href: '/settings', label: 'Site settings', icon: 'settings', ready: false, step: '3.2' },
      { href: '/settings/password', label: 'Password', icon: 'key', ready: true },
    ],
  },
];

/** The most specific ready item whose path matches, so "/settings/password" doesn't also light up "/settings". */
export function activeHref(pathname: string): string | null {
  const all = NAV.flatMap((g) => g.items).filter((i) => i.ready);
  const matches = all.filter((i) => (i.href === '/' ? pathname === '/' : pathname === i.href || pathname.startsWith(i.href + '/')));
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? null;
}
