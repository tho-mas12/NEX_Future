import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role Protection
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 mb-4">
          This control room is restricted to NEX platform administrators.
        </p>
        <Button onClick={() => navigate('/login')} variant="outline" className="border-slate-300 min-h-[44px]">
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
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="NEX Logo"
            className="h-10 w-10 object-contain rounded-xl shadow-xs border border-slate-200/80 shrink-0"
          />
          <div>
            <span className="font-black text-slate-900 text-base tracking-tight">NEX Admin</span>
            <span className="block text-[9px] text-blue-700 font-bold uppercase tracking-wider">Command Center</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Off-Canvas Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col animate-in fade-in duration-200">
          <div className="bg-white w-4/5 max-w-sm h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="NEX Logo"
                    className="h-10 w-10 object-contain rounded-xl shadow-xs border border-slate-200/80"
                  />
                  <div>
                    <span className="font-black text-slate-900 text-base">NEX Admin</span>
                    <span className="block text-[10px] text-blue-700 font-bold uppercase">Navigation</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/admin' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all min-h-[44px] active:scale-95 ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-bold min-h-[44px]"
              >
                <span>Switch to Student View</span>
                <ExternalLink className="h-4 w-4" />
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-bold min-h-[44px] transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NEX Logo"
              className="h-11 w-11 object-contain rounded-xl shadow-xs border border-slate-200/80 shrink-0"
            />
            <div>
              <span className="font-black text-slate-900 text-lg tracking-tight">NEX</span>
              <span className="block text-[10px] text-blue-700 uppercase font-bold tracking-wider">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-xs'
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
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold min-h-[44px]"
          >
            <span>Switch to Student View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
