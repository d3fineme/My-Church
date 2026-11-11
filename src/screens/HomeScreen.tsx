import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight, HeartHandshake, Church, Megaphone, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { TabType } from '../components/BottomNav';
import { ChurchEvent } from '../types';

interface HomeScreenProps {
  onNavigateTab: (tab: TabType) => void;
  onSelectEvent: (event: ChurchEvent) => void;
  onOpenNotifications: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateTab,
  onSelectEvent,
  onOpenNotifications,
}) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const { events, services, announcements, churchProfile } = useChurchData();

  // Find next upcoming event
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((e) => e.status === 'Published' && e.startDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // Upcoming regular services preview (e.g. next 2)
  const previewServices = services.slice(0, 3);

  // Recent announcements (e.g. 2)
  const recentAnnouncements = announcements.slice(0, 2);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#0F2648] to-[#1E3A8A] text-white p-6 shadow-xl border border-white/10">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#D4AF37] mb-2">
            <span>✝</span>
            <span>{churchProfile?.shortName || 'AOGIM Dublin'}</span>
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            {user ? `${t.home.greeting}, ${firstName}!` : t.home.guestGreeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            {churchProfile?.description || t.home.subtitle}
          </p>

          {!user && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-[#0A192F] font-bold text-xs shadow-md transition-colors"
              >
                {t.auth.signUp}
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
              >
                {t.auth.signIn}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Highlighted / Pinned Announcements (Prompt 3 requirement) */}
      {announcements.filter((a) => a.isHighlighted).length > 0 && (
        <section className="space-y-3">
          {announcements
            .filter((a) => a.isHighlighted)
            .map((pinned) => (
              <div
                key={pinned.id}
                onClick={onOpenNotifications}
                className="bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-transparent border-l-4 border-[#D4AF37] bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#99791e] shrink-0 mt-0.5">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A192F]">
                        ★ Pinned Notice
                      </span>
                      {pinned.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {pinned.category}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {pinned.publicationDate}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {pinned.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {pinned.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNotifications();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0A192F] text-[#D4AF37] font-semibold text-xs shrink-0 self-end sm:self-center"
                >
                  View Notice
                </button>
              </div>
            ))}
        </section>
      )}

      {/* Next Event Spotlight */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.home.nextEvent}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>{t.common.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nextEvent ? (
          <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-lg transition-all">
            <div className="relative h-44 sm:h-52 w-full bg-slate-900 overflow-hidden">
              <img
                src={nextEvent.banner}
                alt={nextEvent.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Free/Paid and Category Indicators (clean text tags) */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
                <span className="px-2.5 py-1 rounded-lg bg-[#0A192F]/80 backdrop-blur-md border border-white/20 text-[#D4AF37]">
                  {nextEvent.category}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg backdrop-blur-md border font-bold ${
                    nextEvent.isPaid
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {nextEvent.isPaid ? `€${nextEvent.ticketPrice}` : t.common.free}
                </span>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="font-display font-bold text-lg text-white leading-snug line-clamp-2">
                  {nextEvent.title}
                </h3>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {nextEvent.startDate} · {nextEvent.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="truncate">{nextEvent.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  {nextEvent.maximumCapacity ? (
                    <span>
                      {nextEvent.maximumCapacity - (nextEvent.registeredCount || 0)}{' '}
                      {t.events.seatsLeft}
                    </span>
                  ) : (
                    <span>{t.events.unlimitedCapacity}</span>
                  )}
                </div>

                <button
                  onClick={() => onSelectEvent(nextEvent)}
                  className="px-4 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>{t.home.viewEvent}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
            {t.home.noUpcomingEvents}
          </div>
        )}
      </section>

      {/* Quick Shortcuts */}
      <section className="space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900">
          {t.home.quickShortcuts}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('events')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0F2648]/40 shadow-sm transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F2648]/10 text-[#0F2648] flex items-center justify-center mb-2.5 group-hover:bg-[#0F2648] group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-900 leading-tight">
              {t.home.shortcutEvents}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {events.length} {t.nav.events}
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('services')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0F2648]/40 shadow-sm transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#b89326] flex items-center justify-center mb-2.5 group-hover:bg-[#D4AF37] group-hover:text-[#0A192F] transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-900 leading-tight">
              {t.home.shortcutServices}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {services.length} weekly
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('giving')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0F2648]/40 shadow-sm transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-900 leading-tight">
              {t.home.shortcutGiving}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {t.giving.badge}
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('church')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0F2648]/40 shadow-sm transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Church className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-900 leading-tight">
              {t.home.shortcutAddress}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Dublin 12, Ireland
            </span>
          </button>
        </div>
      </section>

      {/* Upcoming Services Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.home.upcomingServices}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('services')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>{t.common.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {previewServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onNavigateTab('services')}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-[#0F2648]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {service.dayOfWeek.slice(0, 3)}
                  </span>
                  <span className="text-xs font-bold leading-none mt-0.5">
                    {service.startTime}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {service.serviceName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{service.mainLanguage}</span>
                    {service.hasSimultaneousTranslation && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#b89326] font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 inline" />
                          Translation
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.home.announcements}
            </h2>
          </div>
          <button
            onClick={onOpenNotifications}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            {t.common.viewAll}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {recentAnnouncements.map((ann) => (
            <div
              key={ann.id}
              onClick={onOpenNotifications}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 hover:border-slate-300 transition-colors cursor-pointer"
            >
              {ann.image && (
                <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={ann.image}
                    alt={ann.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400">
                  {ann.publicationDate}
                </span>
                <h4 className="font-display font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {ann.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
