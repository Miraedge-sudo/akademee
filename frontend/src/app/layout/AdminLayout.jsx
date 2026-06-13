import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-900">
      {/* Sidebar viendra ici à l'étape suivante */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}