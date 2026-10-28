import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Rail', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Syllabus', path: '/analysis', icon: Layers },
    { label: 'Archive', path: '/completed-lessons', icon: CheckCircle2 },
    { label: 'PYQ', path: '/pyq', icon: FileSpreadsheet },
    { label: 'Current', path: '/current-affairs', icon: Globe },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
