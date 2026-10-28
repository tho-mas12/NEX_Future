import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Award,
  FileSpreadsheet,
  Globe,
  Sliders,
  ExternalLink,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Role Protection
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 mb-4">
          This control room is restricted to NEX platform administrators.
        </p>
        <Button onClick={() => navigate('/login')} variant="outline" className="border-slate-300">
          Log In as Admin
        </Button>
      </div>
    );
  }

  const navLinks = [
    { name: 'Analytics & Events', path: '/admin', icon: LayoutDashboard },
    { name: 'Subject Lessons Hub', path: '/admin/subjects', icon: BookOpen },
    { name: 'Day-Wise Curriculum', path: '/admin/curriculum', icon: CalendarDays },
    { name: 'Mock Tests Studio', path: '/admin/mocks', icon: Award },
    { name: 'Previous Year Papers', path: '/admin/pyqs', icon: FileSpreadsheet },
    { name: 'Current Affairs Manager', path: '/admin/current-affairs', icon: Globe },
    { name: 'Platform Rules & Gates', path: '/admin/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div className="p-5 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NEX Logo"
              className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
            />
            <div>
              <span className="font-black text-slate-900 text-lg tracking-tight">
                NEX
              </span>
              <span className="block text-[10px] text-blue-700 uppercase font-bold tracking-wider">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Options */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold"
          >
            <span>Switch to Student View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
