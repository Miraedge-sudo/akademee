import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((v) => !v);
            } else {
              setSidebarCollapsed((v) => !v);
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-6 pb-[76px] lg:pb-6">
          <Outlet />
        </main>
        <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />
      </div>
    </div>
  );
}