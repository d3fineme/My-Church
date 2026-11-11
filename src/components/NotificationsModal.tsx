import React, { useState } from 'react';
import { X, Bell, Calendar, Megaphone, CheckCheck, Check, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { useAuth } from '../context/AuthContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    announcements,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useChurchData();

  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'giving' | 'announcements'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'events') {
      return (
        n.type === 'EVENT_UPDATE' ||
        n.type === 'EVENT_REMINDER' ||
        n.type === 'REGISTRATION_CONFIRMATION'
      );
    }
    if (activeTab === 'giving') {
      return n.type === 'PAYMENT_APPROVED' || n.type === 'PAYMENT_REJECTED';
    }
    if (activeTab === 'announcements') {
      return n.type === 'ANNOUNCEMENT';
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_APPROVED':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT_REJECTED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'EVENT_UPDATE':
      case 'EVENT_REMINDER':
      case 'REGISTRATION_CONFIRMATION':
        return <Calendar className="w-4 h-4 text-[#D4AF37]" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0A192F] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-[#D4AF37] shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white truncate">
                  {t.notifications?.title || 'Notifications & Alerts'}
                </h3>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0A192F] text-[11px] font-bold">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate">
                {t.notifications?.memberDrawerTitle || 'Church Announcements & Updates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter & Mark All Read bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#0F2648] text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {t.notifications?.filterAll || 'All'}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-[#0F2648] text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {t.notifications?.filterEvents || 'Events'}
            </button>
            <button
              onClick={() => setActiveTab('giving')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'giving'
                  ? 'bg-[#0F2648] text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {t.notifications?.filterGiving || 'Giving'}
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'announcements'
                  ? 'bg-[#0F2648] text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {t.notifications?.filterAnnouncements || 'Announcements'}
            </button>
          </div>

          {user && unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] hover:text-[#0A192F] transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t.notifications?.markAllRead || 'Mark all read'}</span>
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* If user has personal notifications, display them */}
          {user && filteredNotifications.length > 0 && (
            <div className="space-y-2.5">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markNotificationRead(n.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !n.isRead
                      ? 'bg-amber-50/60 border-[#D4AF37]/50 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-display font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80 text-[10px] text-slate-400">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        {!n.isRead ? (
                          <span className="text-[#1E3A8A] font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            {t.notifications?.markRead || 'Mark read'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Announcements Section */}
          {(activeTab === 'all' || activeTab === 'announcements') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.home.announcements}</span>
              </div>
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs">{t.home.noAnnouncements}</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {item.image && (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-200">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{item.publicationDate}</span>
                      </div>
                      {item.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-slate-900 text-sm mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Empty state when no notifications match */}
          {user && filteredNotifications.length === 0 && activeTab !== 'announcements' && (
            <div className="py-10 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs">{t.notifications?.noUnread || 'You are all caught up!'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
