import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Clock,
  Church,
  Users,
  Megaphone,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  ExternalLink,
  Wallet,
  CreditCard,
  Check,
  XCircle,
  Eye,
  QrCode,
  Upload,
  BarChart3,
  QrCode as ScanIcon,
  Bell,
  ShieldAlert,
  Menu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import {
  ChurchEvent,
  ServiceSchedule,
  Announcement,
  AnnouncementCategory,
  User,
  EventRegistration,
  DayOfWeek,
  EventCategory,
  EventStatus,
  Contribution,
  BankingSettings,
} from '../types';

import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminCheckinTab } from './admin/AdminCheckinTab';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { AdminAuditTab } from './admin/AdminAuditTab';
import { AdminNotificationsTab } from './admin/AdminNotificationsTab';
import { AdminMembersTab } from './admin/AdminMembersTab';
import { AdminEventDeepDiveModal } from './admin/AdminEventDeepDiveModal';

interface AdminPanelScreenProps {
  onBackToApp: () => void;
}

export type AdminTab =
  | 'overview'
  | 'checkin'
  | 'reports'
  | 'events'
  | 'members'
  | 'announcements'
  | 'services'
  | 'financial'
  | 'notifications'
  | 'audit'
  | 'church';

type FinancialSubTab = 'contributions' | 'eventPayments' | 'bankingSettings';

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

const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'General Announcements',
  'Church News',
  'Special Services',
  'Events',
  'Important Notices',
];

const DAYS: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({ onBackToApp }) => {
  const { user, token, isAdmin } = useAuth();
  const { t } = useLanguage();
  const {
    churchProfile,
    bankingSettings,
    events,
    services,
    announcements,
    updateChurchProfile,
    updateBankingSettings,
    reviewContribution,
    reviewEventPayment,
    createEvent,
    updateEvent,
    deleteEvent,
    createService,
    updateService,
    deleteService,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refreshData,
  } = useChurchData();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Overview stats from API
  const [overviewStats, setOverviewStats] = useState<any | null>(null);

  // Members list from API
  const [membersList, setMembersList] = useState<User[]>([]);

  // Deep dive & check-in routing
  const [deepDiveEventId, setDeepDiveEventId] = useState<string | null>(null);
  const [checkinEventId, setCheckinEventId] = useState<string | null>(null);

  // Modals for CRUD
  const [eventModalData, setEventModalData] = useState<Partial<ChurchEvent> | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // View attendees modal (free events)
  const [viewingAttendeesEventId, setViewingAttendeesEventId] = useState<string | null>(null);
  const [attendeesList, setAttendeesList] = useState<EventRegistration[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const [serviceModalData, setServiceModalData] = useState<Partial<ServiceSchedule> | null>(null);
  const [isEditingService, setIsEditingService] = useState(false);

  const [announcementModalData, setAnnouncementModalData] = useState<Partial<Announcement> | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  // Church Profile edit form state
  const [churchForm, setChurchForm] = useState(churchProfile ? { ...churchProfile } : null);

  // Financial Management state
  const [financialTab, setFinancialTab] = useState<FinancialSubTab>('contributions');
  const [contributionsList, setContributionsList] = useState<Contribution[]>([]);
  const [eventPaymentsList, setEventPaymentsList] = useState<any[]>([]);
  const [bankForm, setBankForm] = useState<BankingSettings | null>(bankingSettings ? { ...bankingSettings } : null);

  // Filters for financial
  const [contribTypeFilter, setContribTypeFilter] = useState<string>('all');
  const [contribStatusFilter, setContribStatusFilter] = useState<string>('all');
  const [contribSearch, setContribSearch] = useState<string>('');

  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  // Rejection modal
  const [rejectionModal, setRejectionModal] = useState<{
    open: boolean;
    type: 'contribution' | 'eventPayment';
    id: string;
    targetName: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Preview proof image modal
  const [previewProofModal, setPreviewProofModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (churchProfile) {
      setChurchForm({ ...churchProfile });
    }
  }, [churchProfile]);

  useEffect(() => {
    if (bankingSettings) {
      setBankForm({ ...bankingSettings });
    }
  }, [bankingSettings]);

  // Load Admin Data
  const loadAdminOverview = () => {
    if (!token || !isAdmin) return;
    fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOverviewStats)
      .catch(console.error);
  };

  const loadFinancialData = () => {
    if (!token || !isAdmin) return;
    fetch('/api/admin/contributions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContributionsList(data);
      })
      .catch(console.error);

    fetch('/api/admin/event-payments', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEventPaymentsList(data);
      })
      .catch(console.error);
  };

  const loadMembers = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch('/api/admin/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMembersList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadAdminOverview();
    loadFinancialData();
    loadMembers();
  }, [token, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-slate-800">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500">{t.auth.unauthorized}</p>
        <button
          onClick={onBackToApp}
          className="px-5 py-2.5 rounded-xl bg-[#0F2648] text-white font-semibold text-xs"
        >
          {t.common.back}
        </button>
      </div>
    );
  }

  // --- Handlers for Attendees ---
  const handleOpenAttendees = async (eventId: string) => {
    setViewingAttendeesEventId(eventId);
    setIsLoadingAttendees(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAttendeesList(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  // --- Church Form Save ---
  const handleChurchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchForm) return;
    const res = await updateChurchProfile(churchForm);
    if (res.success) {
      setFeedback({ type: 'success', text: t.common.success });
    } else {
      setFeedback({ type: 'error', text: res.error || t.common.error });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && churchForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChurchForm({ ...churchForm, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Event Save ---
  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventModalData) return;

    if (isEditingEvent && eventModalData.id) {
      const res = await updateEvent(eventModalData.id, eventModalData);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Event updated successfully.' });
        setEventModalData(null);
        loadAdminOverview();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    } else {
      const res = await createEvent(eventModalData as any);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Event created and published.' });
        setEventModalData(null);
        loadAdminOverview();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    }
  };

  // --- Service Save ---
  const handleServiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModalData) return;

    if (isEditingService && serviceModalData.id) {
      const res = await updateService(serviceModalData.id, serviceModalData);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Service schedule updated.' });
        setServiceModalData(null);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    } else {
      const res = await createService(serviceModalData as any);
      if (res.success) {
        setFeedback({ type: 'success', text: 'New service schedule added.' });
        setServiceModalData(null);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    }
  };

  // --- Announcement Save ---
  const handleAnnouncementFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementModalData) return;

    if (isEditingAnnouncement && announcementModalData.id) {
      const res = await updateAnnouncement(announcementModalData.id, announcementModalData);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Announcement updated.' });
        setAnnouncementModalData(null);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    } else {
      const res = await createAnnouncement(announcementModalData as any);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Announcement published.' });
        setAnnouncementModalData(null);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error' });
      }
    }
  };

  // --- Financial Actions ---
  const handleApproveContribution = async (id: string) => {
    const res = await reviewContribution(id, 'Approved');
    if (res.success) {
      setFeedback({ type: 'success', text: 'Contribution approved.' });
      loadFinancialData();
      loadAdminOverview();
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to approve contribution.' });
    }
  };

  const handleOpenRejection = (type: 'contribution' | 'eventPayment', id: string, targetName: string) => {
    setRejectionModal({ open: true, type, id, targetName });
    setRejectionReasonInput('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModal) return;
    if (!rejectionReasonInput.trim()) {
      setFeedback({ type: 'error', text: 'Rejection reason is required to notify the member.' });
      return;
    }

    if (rejectionModal.type === 'contribution') {
      const res = await reviewContribution(rejectionModal.id, 'Rejected', rejectionReasonInput.trim());
      if (res.success) {
        setFeedback({ type: 'success', text: 'Contribution rejected with reason recorded.' });
        loadFinancialData();
        loadAdminOverview();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to reject contribution.' });
      }
    } else {
      const res = await reviewEventPayment(rejectionModal.id, 'Payment Rejected', rejectionReasonInput.trim());
      if (res.success) {
        setFeedback({ type: 'success', text: 'Event payment rejected with reason recorded.' });
        loadFinancialData();
        loadAdminOverview();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to reject event payment.' });
      }
    }
    setRejectionModal(null);
    setRejectionReasonInput('');
  };

  const handleApproveEventPayment = async (regId: string) => {
    const res = await reviewEventPayment(regId, 'Confirmed');
    if (res.success) {
      setFeedback({ type: 'success', text: 'Payment confirmed & official digital ticket generated.' });
      loadFinancialData();
      loadAdminOverview();
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to approve event payment.' });
    }
  };

  const handleSaveBankingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm) return;
    const res = await updateBankingSettings(bankForm);
    if (res.success) {
      setFeedback({ type: 'success', text: 'Church bank details updated successfully.' });
      refreshData();
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to update bank details.' });
    }
  };

  const handleBankQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && bankForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setBankForm({
          ...bankForm,
          bankQrCode: dataUrl,
          bankQrCodeImage: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBankQr = () => {
    if (bankForm) {
      setBankForm({
        ...bankForm,
        bankQrCode: null,
        bankQrCodeImage: null,
      });
    }
  };

  // Nav Groups configuration
  const navSections = [
    {
      group: 'Overview',
      items: [
        { id: 'overview', label: t.admin.tabOverview || 'Dashboard', icon: LayoutDashboard },
        { id: 'checkin', label: t.admin.tabCheckin || 'Ticket Check-in', icon: ScanIcon },
        { id: 'reports', label: t.admin.tabReports || 'Reports & Analytics', icon: BarChart3 },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'events', label: t.admin.tabEvents, icon: Calendar },
        { id: 'members', label: t.admin.tabMembers, icon: Users },
        { id: 'announcements', label: t.admin.tabAnnouncements, icon: Megaphone },
        { id: 'services', label: t.admin.tabServices, icon: Clock },
      ],
    },
    {
      group: 'Finances',
      items: [
        { id: 'financial', label: t.admin.tabFinancial, icon: Wallet },
      ],
    },
    {
      group: 'Governance & Settings',
      items: [
        { id: 'notifications', label: t.admin.tabNotifications || 'Notifications', icon: Bell },
        { id: 'audit', label: t.admin.tabAudit || 'Audit Logs', icon: ShieldAlert },
        { id: 'church', label: t.admin.tabChurch, icon: Church },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#0A192F] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-lg sm:text-xl text-white truncate">
                {t.admin.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37] text-[#0A192F]">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              {churchProfile?.shortName || 'AOGIM Dublin'} · {user?.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
          >
            ← {t.common.back} to App
          </button>
        </div>
      </div>

      {/* Main Admin Layout: Responsive Left Sidebar + Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Left Sidebar (Desktop permanent, Mobile collapsible) */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block md:col-span-1 space-y-4`}
        >
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-5">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {section.group}
                </span>
                {section.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as AdminTab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all text-left ${
                        isActive
                          ? 'bg-[#0A192F] text-[#D4AF37] shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Content (3/4 on desktop, full on mobile) */}
        <main className="md:col-span-3 lg:col-span-4 space-y-6">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button onClick={() => setFeedback(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'overview' && (
            <AdminDashboardTab
              overviewStats={overviewStats}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onInspectEvent={(id) => setDeepDiveEventId(id)}
            />
          )}

          {/* TAB 2: TICKET CHECK-IN */}
          {activeTab === 'checkin' && (
            <AdminCheckinTab
              events={events}
              selectedEventId={checkinEventId}
            />
          )}

          {/* TAB 3: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && <AdminReportsTab />}

          {/* TAB 4: MEMBERS MANAGEMENT */}
          {activeTab === 'members' && (
            <AdminMembersTab
              members={membersList}
              onRefreshMembers={loadMembers}
            />
          )}

          {/* TAB 5: OPERATIONAL ALERTS & NOTIFICATIONS */}
          {activeTab === 'notifications' && <AdminNotificationsTab />}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && <AdminAuditTab />}

          {/* TAB 7: EVENTS CRUD MANAGEMENT */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {t.admin.tabEvents}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create, edit, cancel events, inspect attendees, and export attendee lists.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingEvent(false);
                    setEventModalData({
                      category: 'Church Services',
                      currency: 'EUR',
                      status: 'Published',
                      isPaid: false,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.admin.createEvent}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1E3A8A] border border-blue-100">
                          {evt.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              evt.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : evt.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {evt.status}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              evt.isPaid
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {evt.isPaid ? `€${evt.ticketPrice}` : 'Free'}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-display font-bold text-base text-slate-900 leading-tight">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {evt.startDate} · {evt.startTime} · {evt.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => setDeepDiveEventId(evt.id)}
                        className="font-bold text-[#1E3A8A] hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Attendees</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCheckinEventId(evt.id);
                            setActiveTab('checkin');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 text-[#7a5f15] font-semibold text-[11px] hover:bg-[#D4AF37]/30 transition-colors"
                        >
                          Check-in Gate
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingEvent(true);
                            setEventModalData({ ...evt });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete or cancel this event?')) {
                              await deleteEvent(evt.id);
                              loadAdminOverview();
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {t.admin.tabAnnouncements}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish church announcements, categorize news, and pin important updates to the home screen.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingAnnouncement(false);
                    setAnnouncementModalData({
                      status: 'PUBLISHED',
                      category: 'General Announcements',
                      isHighlighted: false,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.admin.createAnnouncement}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-3 ${
                      ann.isHighlighted ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A]">
                          {ann.category || 'General Announcements'}
                        </span>
                        {ann.isHighlighted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A192F]">
                            ★ Pinned on Home
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900 mt-1">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                        {ann.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {ann.publicationDate}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setIsEditingAnnouncement(true);
                            setAnnouncementModalData({ ...ann });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete announcement?')) {
                              await deleteAnnouncement(ann.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: SERVICES MANAGEMENT */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {t.admin.tabServices}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage weekly service schedules, locations, and translation information.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingService(false);
                    setServiceModalData({
                      dayOfWeek: 'Sunday',
                      mainLanguage: 'Portuguese',
                      hasSimultaneousTranslation: true,
                      translationLanguages: ['English'],
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.admin.createService}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-bold text-[#0F2648] uppercase tracking-wider">
                          {svc.dayOfWeek}
                        </span>
                        <span>
                          {svc.startTime} - {svc.endTime}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900">
                        {svc.serviceName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {svc.location} · {svc.mainLanguage}
                      </p>
                      {svc.temporaryNotice && (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                          Notice: {svc.temporaryNotice}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-1 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsEditingService(true);
                          setServiceModalData({ ...svc });
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this service?')) {
                            await deleteService(svc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: FINANCIAL MANAGEMENT */}
          {activeTab === 'financial' && (
            <div className="space-y-5">
              {/* Financial Subtab navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs overflow-x-auto">
                <button
                  onClick={() => setFinancialTab('contributions')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    financialTab === 'contributions'
                      ? 'bg-[#0A192F] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.admin.tabContributions || 'Tithes & Offerings'}
                </button>
                <button
                  onClick={() => setFinancialTab('eventPayments')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    financialTab === 'eventPayments'
                      ? 'bg-[#0A192F] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.admin.tabEventPayments || 'Event Payments'}
                </button>
                <button
                  onClick={() => setFinancialTab('bankingSettings')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    financialTab === 'bankingSettings'
                      ? 'bg-[#0A192F] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.admin.tabBankingSettings || 'Bank Settings'}
                </button>
              </div>

              {/* Subtab 1: Tithes & Offerings */}
              {financialTab === 'contributions' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={contribTypeFilter}
                        onChange={(e) => setContribTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                      >
                        <option value="all">All Types</option>
                        <option value="Tithe">Tithe</option>
                        <option value="Offering">Offering</option>
                      </select>
                      <select
                        value={contribStatusFilter}
                        onChange={(e) => setContribStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <input
                        type="text"
                        value={contribSearch}
                        onChange={(e) => setContribSearch(e.target.value)}
                        placeholder="Search member, ref, amount..."
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>
                    <span className="text-slate-400">
                      {contributionsList.length} total contributions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {contributionsList.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {c.contributionType}
                            </span>
                            <span className="font-bold text-emerald-600">
                              €{Number(c.amount).toFixed(2)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            Member: <strong className="text-slate-800">{c.userName || c.user?.fullName}</strong> · Ref: {c.paymentReference || 'None'} · Date: {c.transferDate}
                          </p>
                          {c.rejectionReason && (
                            <p className="text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                              Reason: {c.rejectionReason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.paymentProof && (
                            <button
                              onClick={() =>
                                setPreviewProofModal({
                                  url: c.paymentProof!,
                                  title: `Receipt - ${c.userName || 'Member'}`,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          {c.status !== 'Approved' && (
                            <button
                              onClick={() => handleApproveContribution(c.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.admin.approve}</span>
                            </button>
                          )}
                          {c.status !== 'Rejected' && (
                            <button
                              onClick={() =>
                                handleOpenRejection('contribution', c.id, `${c.contributionType} - €${c.amount}`)
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t.admin.reject}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 2: Event Payments */}
              {financialTab === 'eventPayments' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {eventPaymentsList.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {p.event?.title}
                            </span>
                            <span className="font-bold text-emerald-600">
                              €{p.event?.ticketPrice}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.paymentStatus === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.paymentStatus === 'Payment Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.paymentStatus}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            Member: <strong className="text-slate-800">{p.user?.fullName}</strong> ({p.user?.email}) · Ref: {p.registrationNumber}
                          </p>
                          {p.ticketNumber && (
                            <p className="font-mono text-emerald-700 font-semibold">
                              Ticket: {p.ticketNumber}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {p.paymentProof && (
                            <button
                              onClick={() =>
                                setPreviewProofModal({
                                  url: p.paymentProof!,
                                  title: `Ticket Payment Proof - ${p.user?.fullName}`,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          {p.paymentStatus !== 'Confirmed' && (
                            <button
                              onClick={() => handleApproveEventPayment(p.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Ticket</span>
                            </button>
                          )}
                          {p.paymentStatus !== 'Payment Rejected' && (
                            <button
                              onClick={() =>
                                handleOpenRejection('eventPayment', p.id, `${p.event?.title} - ${p.user?.fullName}`)
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 3: Bank Coordinates Settings */}
              {financialTab === 'bankingSettings' && bankForm && (
                <form
                  onSubmit={handleSaveBankingSettings}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
                >
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Official Church Bank Coordinates
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Beneficiary Name *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.beneficiaryName}
                        onChange={(e) => setBankForm({ ...bankForm, beneficiaryName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">IBAN *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.iban}
                        onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">BIC / SWIFT *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.bicSwift}
                        onChange={(e) => setBankForm({ ...bankForm, bicSwift: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Reference Pattern</label>
                    <input
                      type="text"
                      value={bankForm.paymentReferencePattern || ''}
                      onChange={(e) => setBankForm({ ...bankForm, paymentReferencePattern: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Additional Transfer Instructions</label>
                    <textarea
                      rows={3}
                      value={bankForm.instructions || ''}
                      onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* QR Code Upload */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-semibold text-slate-800 block">Official Bank QR Code</span>
                    {bankForm.bankQrCode ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={bankForm.bankQrCode}
                          alt="Bank QR"
                          className="w-20 h-20 rounded-xl border border-slate-300 object-contain bg-white p-1"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveBankQr}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100"
                        >
                          Remove QR
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBankQrUpload}
                        className="block text-slate-500 text-xs"
                      />
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold transition-colors"
                    >
                      Save Banking Coordinates
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 11: CHURCH INFO & LOGO */}
          {activeTab === 'church' && churchForm && (
            <form
              onSubmit={handleChurchFormSubmit}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h3 className="font-display font-bold text-base text-slate-900">
                {t.church.institutionalInfo}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Name *</label>
                  <input
                    type="text"
                    required
                    value={churchForm.name}
                    onChange={(e) => setChurchForm({ ...churchForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Name *</label>
                  <input
                    type="text"
                    required
                    value={churchForm.shortName}
                    onChange={(e) => setChurchForm({ ...churchForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Motto</label>
                <textarea
                  rows={3}
                  value={churchForm.description || ''}
                  onChange={(e) => setChurchForm({ ...churchForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={churchForm.email}
                    onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={churchForm.phone || ''}
                    onChange={(e) => setChurchForm({ ...churchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Official Logo Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-800 block">{t.admin.logoUploadTitle}</span>
                <p className="text-slate-500 text-[11px]">{t.admin.logoUploadDesc}</p>
                {churchForm.logo ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={churchForm.logo}
                      alt="Logo Preview"
                      className="w-16 h-16 rounded-xl border border-slate-300 object-cover"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block text-slate-500 text-xs"
                    />
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block text-slate-500 text-xs"
                  />
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold transition-colors"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* EVENT DEEP DIVE MODAL */}
      {deepDiveEventId && (
        <AdminEventDeepDiveModal
          eventId={deepDiveEventId}
          onClose={() => setDeepDiveEventId(null)}
          onOpenCheckin={(id) => {
            setDeepDiveEventId(null);
            setCheckinEventId(id);
            setActiveTab('checkin');
          }}
        />
      )}

      {/* MODAL: CREATE / EDIT EVENT */}
      {eventModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-base text-white">
                {isEditingEvent ? t.admin.editEvent : t.admin.createEvent}
              </h3>
              <button onClick={() => setEventModalData(null)}>
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleEventFormSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventModalData.title || ''}
                  onChange={(e) => setEventModalData({ ...eventModalData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={eventModalData.category || 'Church Services'}
                    onChange={(e) => setEventModalData({ ...eventModalData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={eventModalData.status || 'Published'}
                    onChange={(e) => setEventModalData({ ...eventModalData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Finished">Finished</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventModalData.startDate || ''}
                    onChange={(e) => setEventModalData({ ...eventModalData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={eventModalData.startTime || ''}
                    onChange={(e) => setEventModalData({ ...eventModalData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Sanctuary *</label>
                  <input
                    type="text"
                    required
                    value={eventModalData.location || ''}
                    onChange={(e) => setEventModalData({ ...eventModalData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={eventModalData.address || ''}
                    onChange={(e) => setEventModalData({ ...eventModalData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Capacity (Optional)</label>
                  <input
                    type="number"
                    value={eventModalData.maximumCapacity || ''}
                    onChange={(e) =>
                      setEventModalData({
                        ...eventModalData,
                        maximumCapacity: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={eventModalData.banner || ''}
                    onChange={(e) => setEventModalData({ ...eventModalData, banner: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Free vs Paid Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={eventModalData.isPaid || false}
                    onChange={(e) =>
                      setEventModalData({
                        ...eventModalData,
                        isPaid: e.target.checked,
                        ticketPrice: e.target.checked ? eventModalData.ticketPrice || 15 : undefined,
                      })
                    }
                  />
                  <span>Paid Event / Digital Ticket Required</span>
                </label>

                {eventModalData.isPaid && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ticket Price (EUR €) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={eventModalData.ticketPrice || ''}
                      onChange={(e) =>
                        setEventModalData({
                          ...eventModalData,
                          ticketPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEventModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2648] text-white font-semibold hover:bg-[#1E3A8A]"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ANNOUNCEMENT (Prompt 3 requirement: categories + isHighlighted pin) */}
      {announcementModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-base text-white">
                {isEditingAnnouncement ? t.admin.editAnnouncement : t.admin.createAnnouncement}
              </h3>
              <button onClick={() => setAnnouncementModalData(null)}>
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementFormSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={announcementModalData.title || ''}
                  onChange={(e) => setAnnouncementModalData({ ...announcementModalData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={announcementModalData.category || 'General Announcements'}
                  onChange={(e) =>
                    setAnnouncementModalData({
                      ...announcementModalData,
                      category: e.target.value as AnnouncementCategory,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pin / Highlight Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementModalData.isHighlighted || false}
                  onChange={(e) =>
                    setAnnouncementModalData({
                      ...announcementModalData,
                      isHighlighted: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#0A192F] rounded border-slate-300"
                />
                <span className="font-bold text-amber-900 text-xs">
                  ★ Pin Announcement to Home Screen
                </span>
              </label>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={announcementModalData.image || ''}
                  onChange={(e) => setAnnouncementModalData({ ...announcementModalData, image: e.target.value || null })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={announcementModalData.description || ''}
                  onChange={(e) => setAnnouncementModalData({ ...announcementModalData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2648] text-white font-semibold hover:bg-[#1E3A8A]"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT SERVICE */}
      {serviceModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-base text-white">
                {isEditingService ? t.admin.editService : t.admin.createService}
              </h3>
              <button onClick={() => setServiceModalData(null)}>
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleServiceFormSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceModalData.serviceName || ''}
                  onChange={(e) => setServiceModalData({ ...serviceModalData, serviceName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week *</label>
                  <select
                    value={serviceModalData.dayOfWeek || 'Sunday'}
                    onChange={(e) => setServiceModalData({ ...serviceModalData, dayOfWeek: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Main Language *</label>
                  <input
                    type="text"
                    required
                    value={serviceModalData.mainLanguage || ''}
                    onChange={(e) => setServiceModalData({ ...serviceModalData, mainLanguage: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={serviceModalData.startTime || ''}
                    onChange={(e) => setServiceModalData({ ...serviceModalData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={serviceModalData.endTime || ''}
                    onChange={(e) => setServiceModalData({ ...serviceModalData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room / Sanctuary *</label>
                <input
                  type="text"
                  required
                  value={serviceModalData.location || ''}
                  onChange={(e) => setServiceModalData({ ...serviceModalData, location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2648] text-white font-semibold hover:bg-[#1E3A8A]"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANDATORY REJECTION REASON */}
      {rejectionModal && rejectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  {t.admin.reject} {rejectionModal.type === 'contribution' ? 'Contribution' : 'Event Payment'}
                </h3>
              </div>
              <button onClick={() => setRejectionModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Target: <strong className="text-slate-900">{rejectionModal.targetName}</strong>
              </p>
              <p className="text-slate-500">
                A clear explanation must be provided to the member explaining why their payment or transfer could not be validated.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {t.admin.rejectionReasonPrompt} *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder={t.admin.rejectionReasonPlaceholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW PAYMENT PROOF IMAGE */}
      {previewProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-sm text-white truncate">
                {previewProofModal.title}
              </h3>
              <button onClick={() => setPreviewProofModal(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={previewProofModal.url}
                alt={previewProofModal.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-sm border border-slate-200 bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewProofModal(null)}
                className="px-4 py-1.5 rounded-xl bg-[#0F2648] text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
