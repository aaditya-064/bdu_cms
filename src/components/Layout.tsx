import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../types';
import {
  LayoutDashboard,
  FolderOpen,
  Shield,
  ClipboardList,
  Users,
  Workflow,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/files', label: 'Files', icon: FolderOpen },
  { path: '/vault', label: 'Vault', icon: Shield },
  { path: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { path: '/users', label: 'Users', icon: Users, adminOnly: true },
  { path: '/n8n', label: 'n8n Workflows', icon: Workflow },
];

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:in-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-900">Buddha Dana Udhyog</h1>
            <p className="text-xs text-gray-500 mt-1">Business Management</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Buddha Dana Udhyog</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
