import React from 'react';
import { Clock, MapPin, Globe, Headphones, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { TabType } from '../components/BottomNav';
import { DayOfWeek } from '../types';

interface ServicesScreenProps {
  onNavigateTab: (tab: TabType) => void;
}

const ORDERED_DAYS: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const { services } = useChurchData();

  // Group services by day of week in chronological order
  const groupedServices = ORDERED_DAYS.map((day) => {
    return {
      day,
      items: services.filter((s) => s.dayOfWeek === day),
    };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
          {t.services.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.services.subtitle}
        </p>
      </div>

      {/* Services Schedule grouped by day of week */}
      <div className="space-y-6">
        {groupedServices.map(({ day, items }) => (
          <div key={day} className="space-y-3">
            {/* Day Header */}
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <h2 className="font-display font-bold text-base text-[#0A192F]">
                {day}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                ({items.length} {items.length === 1 ? 'service' : 'services'})
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {items.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar: Title & Time */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                        {svc.serviceName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{svc.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl bg-[#0A192F] text-white shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-mono font-bold text-xs">
                        {svc.startTime} - {svc.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Temporary Schedule Notice if any */}
                  {svc.temporaryNotice && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">
                          {t.services.temporaryChange}
                        </strong>
                        <span>{svc.temporaryNotice}</span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {svc.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {svc.description}
                    </p>
                  )}

                  {/* Language & Translation Details */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.services.mainLanguage}:</span>
                      <strong className="text-slate-900">{svc.mainLanguage}</strong>
                    </div>

                    {svc.hasSimultaneousTranslation ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                        <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {t.services.translationAvailable}:{' '}
                          <strong>{svc.translationLanguages.join(', ')}</strong>
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {t.services.noTranslation}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Direction Hint Card */}
      <div
        onClick={() => onNavigateTab('church')}
        className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0F2648] text-white flex items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-all"
      >
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm text-[#D4AF37]">
            Visiting AOGIM Dublin Sanctuary
          </h4>
          <p className="text-xs text-slate-300">
            {t.services.directionsHint}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};
