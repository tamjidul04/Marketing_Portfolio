import { Suspense } from 'react';
import { Shell, ShellFallback } from '@/components/admin/shell';

// Every signed-in page lives inside this frame. The session is read inside <Suspense>,
// as Next.js 16 (Cache Components) requires for anything that reads cookies.
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
