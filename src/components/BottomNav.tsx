import React from 'react';
import { Home, Calendar, Clock, HeartHandshake, Church } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type TabType = 'home' | 'events' | 'services' | 'giving' | 'church';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const navItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'events', label: t.nav.events, icon: Calendar },
    { id: 'services', label: t.nav.services, icon: Clock },
    { id: 'giving', label: t.nav.giving, icon: HeartHandshake },
    { id: 'church', label: t.nav.church, icon: Church },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all relative ${
                isActive ? 'text-[#0F2648]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-[#D4AF37]" />
              )}
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive ? 'scale-110 text-[#0F2648]' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-tight whitespace-nowrap mt-0.5 ${
                  isActive ? 'font-bold text-[#0F2648]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
