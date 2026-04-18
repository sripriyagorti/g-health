import type { ReactNode } from 'react';
import { BottomNav, SideNav } from './Navigation';
import type { NavScreen } from './Navigation';

interface Props {
  current: NavScreen;
  onNav: (s: NavScreen) => void;
  children: ReactNode;
  /** Chat page manages its own scroll — skip overflow-y-auto on content area */
  scrollable?: boolean;
}

export function AppLayout({ current, onNav, children, scrollable = true }: Props) {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <SideNav current={current} onChange={onNav} />

      {/* Content column: fills remaining width, stacks content + bottom nav */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <main className={`flex-1 min-h-0 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {children}
        </main>

        {/* Bottom nav sits as a real flex child — never overlaps content */}
        <BottomNav current={current} onChange={onNav} />
      </div>
    </div>
  );
}
