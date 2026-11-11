import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  Search,
  Ticket,
  Upload,
  QrCode,
  Copy,
  Check,
  CreditCard,
  Eye,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { ChurchEvent, EventCategory, EventTicket } from '../types';

interface EventsScreenProps {
  selectedEventFromHome?: ChurchEvent | null;
  onClearSelectedEvent?: () => void;
}

type ViewMode = 'list' | 'week' | 'month';
type TimeFilter = 'upcoming' | 'this_week' | 'this_month' | 'free' | 'paid' | 'past';

const CATEGORIES: EventCategory[] = [
  'Church Services',
  'Youth',
  'Families',
  'Couples',
  'Conferences',
  'Bible Studies',
  'Special Events',
  'Evangelism',
  'Other',
];

export const EventsScreen: React.FC<EventsScreenProps> = ({
  selectedEventFromHome,
  onClearSelectedEvent,
}) => {
  const { user, openAuthModal } = useAuth();
  const { language, t } = useLanguage();
  const {
    events,
    bankingSettings,
    registerForEvent,
    reservePaidEvent,
    submitEventPaymentProof,
    cancelRegistration,
    myRegistrations,
    myTickets,
  } = useChurchData();

  // Controls
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected event modal
  const [activeModalEvent, setActiveModalEvent] = useState<ChurchEvent | null>(
    selectedEventFromHome || null
  );
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Paid event proof upload state in modal
  const [eventProofDataUrl, setEventProofDataUrl] = useState<string | null>(null);
  const [eventProofFileName, setEventProofFileName] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Digital Ticket view modal
  const [viewingTicket, setViewingTicket] = useState<EventTicket | null>(null);

  // Sync when prop changes
  React.useEffect(() => {
    if (selectedEventFromHome) {
      setActiveModalEvent(selectedEventFromHome);
    }
  }, [selectedEventFromHome]);

  const closeModal = () => {
    setActiveModalEvent(null);
    setActionMessage(null);
    setEventProofDataUrl(null);
    setEventProofFileName(null);
    if (onClearSelectedEvent) onClearSelectedEvent();
  };

  const getRegistration = (eventId: string) => {
    return myRegistrations.find(
      (r) =>
        r.eventId === eventId &&
        r.registrationStatus === 'CONFIRMED' &&
        r.paymentStatus !== 'Cancelled'
    );
  };

  const copyBankInfo = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(key);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  // Filtering logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
  const endOfWeekStr = endOfWeek.toISOString().slice(0, 10);

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (evt.status !== 'Published') return false;

      if (selectedCategory !== 'all' && evt.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesDesc = evt.description.toLowerCase().includes(q);
        const matchesLoc = evt.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }

      switch (timeFilter) {
        case 'upcoming':
          return evt.startDate >= todayStr;
        case 'this_week':
          return evt.startDate >= startOfWeekStr && evt.startDate <= endOfWeekStr;
        case 'this_month':
          return evt.startDate.startsWith(currentMonthStr) && evt.startDate >= todayStr;
        case 'free':
          return !evt.isPaid && evt.startDate >= todayStr;
        case 'paid':
          return evt.isPaid && evt.startDate >= todayStr;
        case 'past':
          return evt.startDate < todayStr;
        default:
          return true;
      }
    }).sort((a, b) => {
      if (timeFilter === 'past') {
        return b.startDate.localeCompare(a.startDate);
      }
      return a.startDate.localeCompare(b.startDate);
    });
  }, [events, selectedCategory, searchQuery, timeFilter, todayStr, startOfWeekStr, endOfWeekStr, currentMonthStr]);

  // Handle register / reserve
  const handleRegister = async (eventId: string, isPaid: boolean) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setIsRegistering(true);
    setActionMessage(null);

    const result = isPaid ? await reservePaidEvent(eventId) : await registerForEvent(eventId);
    setIsRegistering(false);

    if (result.success) {
      setActionMessage({
        type: 'success',
        text: isPaid ? t.financial.ticketReserved : t.events.regSuccess,
      });
    } else {
      setActionMessage({ type: 'error', text: result.message || t.common.error });
    }
  };

  // Submit payment proof for reserved event
  const handleSubmitProof = async (registrationId: string) => {
    if (!eventProofDataUrl) return;
    setIsSubmittingProof(true);
    setActionMessage(null);

    const res = await submitEventPaymentProof(registrationId, eventProofDataUrl);
    setIsSubmittingProof(false);

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setEventProofDataUrl(null);
      setEventProofFileName(null);
    } else {
      setActionMessage({ type: 'error', text: res.message || t.common.error });
    }
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventProofDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user) return;
    setIsRegistering(true);
    setActionMessage(null);
    const result = await cancelRegistration(eventId);
    setIsRegistering(false);

    if (result.success) {
      setActionMessage({ type: 'success', text: t.events.cancelSuccess });
    } else {
      setActionMessage({ type: 'error', text: result.message || t.common.error });
    }
  };

  const openGoogleMaps = (address: string) => {
    const encoded = encodeURIComponent(`${address}, Dublin, Ireland`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const bank = bankingSettings || {
    beneficiaryName: 'Assembly of God Ireland Ministry',
    bankName: 'Bank of Ireland (Dublin South)',
    iban: 'IE29 BOFI 9000 1712 3456 78',
    bicSwift: 'BOFIIE2D',
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            {t.events.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.events.subtitle}
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#0A192F] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.events.listView}
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-white text-[#0A192F] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.events.weekView}
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-white text-[#0A192F] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.events.monthView}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${t.common.search} ${t.nav.events}...`}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648] shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Time Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'upcoming', label: t.events.filterUpcoming },
          { id: 'this_week', label: t.events.filterThisWeek },
          { id: 'this_month', label: t.events.filterThisMonth },
          { id: 'free', label: t.events.filterFree },
          { id: 'paid', label: t.events.filterPaid },
          { id: 'past', label: t.events.filterPast },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setTimeFilter(f.id as TimeFilter)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-semibold transition-all ${
              timeFilter === f.id
                ? 'bg-[#0F2648] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category Segmented Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#D4AF37] text-[#0A192F] font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {t.events.allCategories}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[#D4AF37] text-[#0A192F] font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* EVENT LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium">{t.common.empty}</p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const userReg = getRegistration(evt.id);
              return (
                <div
                  key={evt.id}
                  onClick={() => setActiveModalEvent(evt)}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={evt.banner}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0A192F]/80 backdrop-blur-md text-[#D4AF37] border border-white/10">
                        {evt.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {userReg && (
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow ${
                              userReg.paymentStatus === 'Confirmed' || (!userReg.isPaidEvent)
                                ? 'bg-emerald-600 text-white'
                                : userReg.paymentStatus === 'Payment Under Review'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            {userReg.paymentStatus === 'Confirmed'
                              ? t.financial.statusConfirmed
                              : userReg.paymentStatus === 'Payment Under Review'
                              ? t.financial.statusPaymentUnderReview
                              : userReg.isPaidEvent
                              ? t.financial.statusAwaitingPayment
                              : t.events.alreadyRegistered}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-lg backdrop-blur-md border font-bold ${
                            evt.isPaid
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {evt.isPaid ? `€${evt.ticketPrice}` : t.common.free}
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-display font-bold text-base text-white line-clamp-2">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>
                          {evt.startDate} · {evt.startTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="text-slate-500">
                        {evt.maximumCapacity ? (
                          <span>
                            {evt.maximumCapacity - (evt.registeredCount || 0)}{' '}
                            {t.events.seatsLeft}
                          </span>
                        ) : (
                          <span>{t.events.unlimitedCapacity}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="font-semibold text-[#1E3A8A] hover:underline"
                      >
                        {evt.isPaid ? 'Reserve / Details →' : `${t.common.viewDetails} →`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          <div className="bg-slate-100 p-3 rounded-2xl text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Week: {startOfWeekStr} to {endOfWeekStr}
            </span>
            <span>{filteredEvents.length} events scheduled</span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setActiveModalEvent(evt)}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0F2648] text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase text-[#D4AF37]">
                      {new Date(evt.startDate).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-xs font-bold leading-none mt-0.5">
                      {evt.startDate.split('-')[2]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-slate-900 text-sm truncate">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {evt.startTime} · {evt.location}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                    evt.isPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {evt.isPaid ? `€${evt.ticketPrice}` : t.common.free}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY CALENDAR VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display font-bold text-base text-slate-900">
              {now.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-500">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setActiveModalEvent(evt)}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold text-[#b89326]">
                    {evt.startDate} ({evt.startTime})
                  </span>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    {evt.title}
                  </h4>
                  <span className="text-xs text-slate-500">{evt.location}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    evt.isPaid ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {evt.isPaid ? `€${evt.ticketPrice}` : t.common.free}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENT DETAILS & RESERVATION MODAL */}
      {activeModalEvent && (() => {
        const userReg = getRegistration(activeModalEvent.id);
        const ticket = myTickets.find((t) => t.eventId === activeModalEvent.id && t.ticketStatus === 'VALID');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Modal Hero Banner */}
              <div className="relative h-44 sm:h-52 w-full bg-slate-900 shrink-0">
                <img
                  src={activeModalEvent.banner}
                  alt={activeModalEvent.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                <button
                  onClick={closeModal}
                  className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-[#0A192F] text-[11px] font-bold uppercase tracking-wider mb-1 inline-block">
                    {activeModalEvent.category}
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-white leading-tight">
                    {activeModalEvent.title}
                  </h2>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                {/* Action feedback */}
                {actionMessage && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                      actionMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {actionMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Status Box for Existing Registration */}
                {userReg && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Registration Reference: <strong className="font-mono text-[#0F2648]">{userReg.registrationNumber}</strong></span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          userReg.paymentStatus === 'Confirmed' || (!userReg.isPaidEvent)
                            ? 'bg-emerald-100 text-emerald-800'
                            : userReg.paymentStatus === 'Payment Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : userReg.paymentStatus === 'Payment Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {userReg.isPaidEvent
                          ? userReg.paymentStatus
                          : t.events.alreadyRegistered}
                      </span>
                    </div>

                    {/* Digital Ticket button if confirmed */}
                    {(userReg.paymentStatus === 'Confirmed' || ticket) && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-emerald-700 font-semibold">
                          Digital Ticket Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingTicket(ticket || (userReg.ticket as any))}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{t.financial.viewTicket}</span>
                        </button>
                      </div>
                    )}

                    {/* Rejection reason banner */}
                    {userReg.paymentStatus === 'Payment Rejected' && userReg.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                        <strong>{t.financial.rejectionReason}:</strong> {userReg.rejectionReason}
                      </div>
                    )}

                    {/* Expiration warning for Awaiting Payment */}
                    {userReg.paymentStatus === 'Awaiting Payment' && userReg.reservationExpiration && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t.financial.expiresIn}:</span>
                        </span>
                        <span className="font-mono font-bold text-amber-800">
                          {new Date(userReg.reservationExpiration).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({userReg.reservationExpiration.slice(0, 10)})
                        </span>
                      </div>
                    )}

                    {/* Upload / Resubmit Proof Form */}
                    {(userReg.paymentStatus === 'Awaiting Payment' || userReg.paymentStatus === 'Payment Rejected') && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <strong className="block text-xs font-semibold text-slate-800">
                          {userReg.paymentStatus === 'Payment Rejected'
                            ? t.financial.resubmitProof
                            : t.financial.submitPaymentProof}
                        </strong>

                        {/* Proof upload file */}
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-2xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{eventProofFileName ? 'Change File' : 'Select Receipt'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleProofFileUpload}
                              className="hidden"
                            />
                          </label>
                          {eventProofFileName && (
                            <span className="text-xs text-emerald-700 font-semibold truncate max-w-[150px]">
                              {eventProofFileName}
                            </span>
                          )}
                        </div>

                        {eventProofDataUrl && (
                          <button
                            type="button"
                            onClick={() => handleSubmitProof(userReg.id)}
                            disabled={isSubmittingProof}
                            className="w-full py-2 px-3 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                          >
                            {isSubmittingProof ? t.common.loading : 'Send Proof to Church Admin'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cancel action */}
                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleCancelRegistration(activeModalEvent.id)}
                        disabled={isRegistering}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold underline disabled:opacity-50"
                      >
                        {t.events.cancelRegistration}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank transfer info for Paid events if reserving or awaiting payment */}
                {activeModalEvent.isPaid && (!userReg || userReg.paymentStatus === 'Awaiting Payment') && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        <span>Church Bank Transfer Information</span>
                      </span>
                      <span className="font-display font-bold text-sm text-slate-900">
                        €{activeModalEvent.ticketPrice} EUR
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Beneficiary:</span>
                        <span className="font-semibold">{bank.beneficiaryName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">IBAN:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-[#0F2648]">{bank.iban}</span>
                          <button
                            type="button"
                            onClick={() => copyBankInfo(bank.iban, 'modal-iban')}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            {copiedBankField === 'modal-iban' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">BIC:</span>
                        <span className="font-mono">{bank.bicSwift}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date and Location Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {t.common.date} & {t.common.time}
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>
                        {activeModalEvent.startDate} at {activeModalEvent.startTime}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {t.common.location}
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="truncate">{activeModalEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Open in Google Maps */}
                <button
                  onClick={() => openGoogleMaps(activeModalEvent.address)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
                >
                  <MapPin className="w-4 h-4 text-[#0F2648]" />
                  <span>{t.events.openInMaps}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
                    About this Event
                  </h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {activeModalEvent.description}
                  </p>
                </div>

                {/* Capacity info */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {activeModalEvent.maximumCapacity
                        ? `${activeModalEvent.maximumCapacity - (activeModalEvent.registeredCount || 0)} ${t.events.seatsLeft} (Cap: ${activeModalEvent.maximumCapacity})`
                        : t.events.unlimitedCapacity}
                    </span>
                  </div>
                  {activeModalEvent.registrationDeadline && (
                    <span>
                      Deadline: {activeModalEvent.registrationDeadline.slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Bottom CTA */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                {userReg ? (
                  userReg.paymentStatus === 'Confirmed' || (!userReg.isPaidEvent) ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-2xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-default"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t.events.alreadyRegistered}</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-600">
                      Reservation reference: <strong className="font-mono text-slate-900">{userReg.registrationNumber}</strong>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => handleRegister(activeModalEvent.id, activeModalEvent.isPaid)}
                    disabled={isRegistering}
                    className="w-full py-3.5 rounded-2xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#0F2648]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      t.common.loading
                    ) : user ? (
                      activeModalEvent.isPaid ? (
                        <>
                          <Ticket className="w-4 h-4 text-[#D4AF37]" />
                          <span>{t.financial.reserveTicket} (€{activeModalEvent.ticketPrice})</span>
                        </>
                      ) : (
                        t.events.confirmAttendance
                      )
                    ) : (
                      t.events.mustLoginToRegister
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* DIGITAL TICKET MODAL */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 overflow-hidden relative">
            <button
              onClick={() => setViewingTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ticket Header */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                Assembly of God Ireland Ministry
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                {viewingTicket.eventTitle || 'Church Event'}
              </h3>
            </div>

            {/* Ticket details badge */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Attendee:</span>
                <strong className="text-slate-900">{viewingTicket.userName || user?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-semibold">{viewingTicket.eventDate} · {viewingTicket.eventTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Number:</span>
                <strong className="font-mono text-[#0F2648]">{viewingTicket.ticketNumber}</strong>
              </div>
            </div>

            {/* Generated Ticket QR Code */}
            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border-2 border-[#0F2648] flex flex-col items-center justify-center shadow-inner relative">
              {/* Clean SVG visual QR pattern */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#0A192F]">
                <rect width="100" height="100" fill="white" />
                {/* Corner Position Targets */}
                <rect x="5" y="5" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="13" width="10" height="10" fill="#0A192F" rx="1" />

                <rect x="69" y="5" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="77" y="13" width="10" height="10" fill="#0A192F" rx="1" />

                <rect x="5" y="69" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="77" width="10" height="10" fill="#0A192F" rx="1" />

                {/* Data blocks */}
                <rect x="36" y="8" width="6" height="6" fill="#0A192F" />
                <rect x="46" y="8" width="8" height="6" fill="#0A192F" />
                <rect x="58" y="12" width="6" height="6" fill="#0A192F" />

                <rect x="8" y="36" width="6" height="6" fill="#0A192F" />
                <rect x="18" y="36" width="8" height="6" fill="#0A192F" />
                <rect x="8" y="48" width="6" height="12" fill="#0A192F" />

                {/* Center cross insignia */}
                <rect x="44" y="40" width="12" height="24" fill="#D4AF37" rx="1" />
                <rect x="38" y="46" width="24" height="8" fill="#D4AF37" rx="1" />

                <rect x="68" y="36" width="12" height="6" fill="#0A192F" />
                <rect x="84" y="36" width="8" height="12" fill="#0A192F" />
                <rect x="68" y="48" width="6" height="14" fill="#0A192F" />

                <rect x="36" y="68" width="6" height="8" fill="#0A192F" />
                <rect x="48" y="68" width="14" height="6" fill="#0A192F" />
                <rect x="36" y="80" width="12" height="6" fill="#0A192F" />
                <rect x="54" y="80" width="8" height="12" fill="#0A192F" />

                <rect x="68" y="68" width="8" height="8" fill="#0A192F" />
                <rect x="80" y="68" width="12" height="6" fill="#0A192F" />
                <rect x="74" y="80" width="18" height="12" fill="#0A192F" />
              </svg>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              {t.financial.checkInNotice}
            </p>

            <button
              onClick={() => setViewingTicket(null)}
              className="w-full py-2.5 rounded-xl bg-[#0F2648] text-white text-xs font-semibold"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
