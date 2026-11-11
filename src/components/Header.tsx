import React from 'react';
import { Bell, User as UserIcon, Shield, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenNotifications,
  onOpenAdmin,
}) => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { churchProfile, announcements, unreadNotificationsCount } = useChurchData();

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : null;

  return (
    <header className="sticky top-0 z-30 bg-[#0A192F] text-white border-b border-white/10 shadow-sm backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Church Logo & App Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#0A192F] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            {churchProfile?.logo ? (
              <img
                src={churchProfile.logo}
                alt="AOGIM Dublin Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center leading-none text-[#D4AF37]">
                <span className="text-[15px] font-bold tracking-wider">✝</span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-white truncate">
                {churchProfile?.shortName || 'AOGIM Dublin'}
              </span>
              {isAdmin && (
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 truncate">
              {user ? `${t.home.greeting}, ${firstName}` : t.home.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions (Language, Notifications, Profile/Login) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Admin shortcut button if admin */}
          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title={t.nav.admin}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.nav.admin}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors"
            title="Switch Language / Mudar Idioma"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-[#0A192F] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0A192F]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            ) : announcements.length > 0 ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4AF37] ring-2 ring-[#0A192F]" />
            ) : null}
          </button>

          {/* Profile or Login */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              title={t.nav.profile}
            >
              <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-[#D4AF37] font-semibold text-xs flex items-center justify-center overflow-hidden border border-[#D4AF37]/40">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{user.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-medium text-slate-200 truncate max-w-[90px]">
                {firstName}
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c59b27] text-[#0A192F] font-semibold text-xs shadow-sm transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t.auth.signIn}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
