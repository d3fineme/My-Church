import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ChurchProfile,
  ChurchEvent,
  ServiceSchedule,
  Announcement,
  EventRegistration,
  BankingSettings,
  Contribution,
  ContributionType,
  EventTicket,
  AppNotification,
  AuditLog,
  EventCheckinStats,
  EventOperationalSummary,
  MembersReport,
  EventsReport,
  FinancialReport,
  EventReminderSettings,
} from '../types';
import { useAuth } from './AuthContext';

interface ChurchDataContextType {
  churchProfile: ChurchProfile | null;
  bankingSettings: BankingSettings | null;
  events: ChurchEvent[];
  services: ServiceSchedule[];
  announcements: Announcement[];
  myRegistrations: EventRegistration[];
  myContributions: Contribution[];
  myTickets: EventTicket[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  registerForEvent: (eventId: string) => Promise<{ success: boolean; message: string; error?: string; registration?: EventRegistration }>;
  reservePaidEvent: (eventId: string) => Promise<{ success: boolean; message: string; error?: string; registration?: EventRegistration }>;
  submitEventPaymentProof: (registrationId: string, proofDataUrl: string) => Promise<{ success: boolean; message: string; error?: string }>;
  cancelRegistration: (eventId: string) => Promise<{ success: boolean; message: string; error?: string }>;
  // Financial contributions
  createContribution: (data: {
    contributionType: ContributionType;
    amount: number;
    transferDate: string;
    paymentReference: string;
    paymentProof?: string | null;
  }) => Promise<{ success: boolean; message: string; error?: string; contribution?: Contribution }>;
  // Admin & Operational helpers
  updateChurchProfile: (data: Partial<ChurchProfile>) => Promise<{ success: boolean; error?: string }>;
  updateBankingSettings: (data: Partial<BankingSettings>) => Promise<{ success: boolean; error?: string }>;
  createEvent: (data: Omit<ChurchEvent, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (id: string, data: Partial<ChurchEvent>) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  createService: (data: Omit<ServiceSchedule, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateService: (id: string, data: Partial<ServiceSchedule>) => Promise<{ success: boolean; error?: string }>;
  deleteService: (id: string) => Promise<{ success: boolean; error?: string }>;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdBy'>) => Promise<{ success: boolean; error?: string }>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<{ success: boolean; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;
  reviewContribution: (contributionId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => Promise<{ success: boolean; error?: string }>;
  reviewEventPayment: (registrationId: string, status: 'Confirmed' | 'Payment Rejected', rejectionReason?: string) => Promise<{ success: boolean; error?: string }>;
  // Prompt 3 Check-in, Reports, Role Management
  validateTicket: (eventId: string, ticketCode?: string, qrToken?: string) => Promise<any>;
  performCheckin: (eventId: string, ticketCode?: string, qrToken?: string) => Promise<any>;
  getEventCheckinStats: (eventId: string) => Promise<EventCheckinStats | null>;
  getEventAttendeesDetailed: (eventId: string) => Promise<any[]>;
  getEventOperationalSummary: (eventId: string) => Promise<EventOperationalSummary | null>;
  updateUserRole: (userId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  getMembersReport: (filter?: any) => Promise<MembersReport | null>;
  getEventsReport: (filter?: any) => Promise<EventsReport | null>;
  getFinancialReport: (filter?: any) => Promise<FinancialReport | null>;
  getAuditLogs: (filter?: any) => Promise<AuditLog[]>;
  getEventReminderSettings: () => Promise<EventReminderSettings | null>;
  updateEventReminderSettings: (settings: Partial<EventReminderSettings>) => Promise<boolean>;
}

const ChurchDataContext = createContext<ChurchDataContextType | undefined>(undefined);

export const ChurchDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [churchProfile, setChurchProfile] = useState<ChurchProfile | null>(null);
  const [bankingSettings, setBankingSettings] = useState<BankingSettings | null>(null);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [services, setServices] = useState<ServiceSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [myTickets, setMyTickets] = useState<EventTicket[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authHeaders = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const headers = authHeaders();
      const [listRes, countRes] = await Promise.all([
        fetch('/api/notifications/my', { headers }),
        fetch('/api/notifications/unread-count', { headers }),
      ]);
      if (listRes.ok) setNotifications(await listRes.json());
      if (countRes.ok) {
        const { unreadCount } = await countRes.json();
        setUnreadNotificationsCount(unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [authHeaders, token]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = authHeaders();

      const [churchRes, bankRes, eventsRes, servicesRes, annRes] = await Promise.all([
        fetch('/api/church'),
        fetch('/api/banking-settings'),
        fetch('/api/events', { headers }),
        fetch('/api/services'),
        fetch('/api/announcements', { headers }),
      ]);

      if (churchRes.ok) setChurchProfile(await churchRes.json());
      if (bankRes.ok) setBankingSettings(await bankRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());

      if (token && user) {
        const [regsRes, contribsRes, ticketsRes, notifsRes, countRes] = await Promise.all([
          fetch('/api/registrations/my', { headers }),
          fetch('/api/contributions/my', { headers }),
          fetch('/api/tickets/my', { headers }),
          fetch('/api/notifications/my', { headers }),
          fetch('/api/notifications/unread-count', { headers }),
        ]);

        if (regsRes.ok) setMyRegistrations(await regsRes.json());
        if (contribsRes.ok) setMyContributions(await contribsRes.json());
        if (ticketsRes.ok) setMyTickets(await ticketsRes.json());
        if (notifsRes.ok) setNotifications(await notifsRes.json());
        if (countRes.ok) {
          const { unreadCount } = await countRes.json();
          setUnreadNotificationsCount(unreadCount);
        }
      } else {
        setMyRegistrations([]);
        setMyContributions([]);
        setMyTickets([]);
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error('Failed to load church data', err);
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, token, user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Register for free event or redirect to paid reservation
  const registerForEvent = async (eventId: string) => {
    if (!token) {
      return { success: false, message: 'Must be logged in to register', error: 'Unauthorized' };
    }
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to register', error: data.error };
      }

      await refreshData();
      return { success: true, message: data.message || 'Attendance confirmed successfully!', registration: data.registration };
    } catch {
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  };

  // Reserve paid event ticket
  const reservePaidEvent = async (eventId: string) => {
    if (!token) {
      return { success: false, message: 'Must be logged in to reserve tickets', error: 'Unauthorized' };
    }
    try {
      const res = await fetch(`/api/events/${eventId}/reserve-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to reserve ticket', error: data.error };
      }

      await refreshData();
      return { success: true, message: data.message || 'Ticket reserved!', registration: data.registration };
    } catch {
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  };

  // Submit payment proof for paid event
  const submitEventPaymentProof = async (registrationId: string, proofDataUrl: string) => {
    if (!token) {
      return { success: false, message: 'Must be logged in', error: 'Unauthorized' };
    }
    try {
      const res = await fetch(`/api/registrations/${registrationId}/payment-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ paymentProof: proofDataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to submit proof', error: data.error };
      }

      await refreshData();
      return { success: true, message: data.message || 'Proof submitted successfully!' };
    } catch {
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  };

  const cancelRegistration = async (eventId: string) => {
    if (!token) {
      return { success: false, message: 'Must be logged in', error: 'Unauthorized' };
    }
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to cancel', error: data.error };
      }

      await refreshData();
      return { success: true, message: data.message || 'Registration cancelled.' };
    } catch {
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  };

  // Create Tithe or Offering contribution
  const createContribution = async (data: {
    contributionType: ContributionType;
    amount: number;
    transferDate: string;
    paymentReference: string;
    paymentProof?: string | null;
  }) => {
    if (!token) {
      return { success: false, message: 'Must be logged in to contribute', error: 'Unauthorized' };
    }
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Failed to register contribution', error: resData.error };
      }

      await refreshData();
      return { success: true, message: resData.message || 'Contribution submitted!', contribution: resData.contribution };
    } catch {
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  };

  const updateChurchProfile = async (data: Partial<ChurchProfile>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/church', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      setChurchProfile(resData.profile);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateBankingSettings = async (data: Partial<BankingSettings>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/banking-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      setBankingSettings(resData.settings);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const createEvent = async (data: Omit<ChurchEvent, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateEvent = async (id: string, data: Partial<ChurchEvent>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteEvent = async (id: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const createService = async (data: Omit<ServiceSchedule, 'id'>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateService = async (id: string, data: Partial<ServiceSchedule>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteService = async (id: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const createAnnouncement = async (data: Omit<Announcement, 'id' | 'createdBy'>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const reviewContribution = async (contributionId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/contributions/${contributionId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const reviewEventPayment = async (registrationId: string, status: 'Confirmed' | 'Payment Rejected', rejectionReason?: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/event-payments/${registrationId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error };
      await refreshData();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const markNotificationRead = async (id: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadNotificationsCount((c) => Math.max(0, c - 1));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const markAllNotificationsRead = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotificationsCount(0);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Ticket Check-in helpers
  const validateTicket = async (eventId: string, ticketCode?: string, qrToken?: string) => {
    if (!token) return { valid: false, message: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/events/${eventId}/validate-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ticketCode, qrToken }),
      });
      return await res.json();
    } catch {
      return { valid: false, message: 'Network error validating ticket.' };
    }
  };

  const performCheckin = async (eventId: string, ticketCode?: string, qrToken?: string) => {
    if (!token) return { success: false, message: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ticketCode, qrToken }),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Network error during check-in.' };
    }
  };

  const getEventCheckinStats = async (eventId: string): Promise<EventCheckinStats | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/admin/events/${eventId}/check-in-stats`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const getEventAttendeesDetailed = async (eventId: string): Promise<any[]> => {
    if (!token) return [];
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendees-detailed`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  };

  const getEventOperationalSummary = async (eventId: string): Promise<EventOperationalSummary | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/admin/events/${eventId}/details`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/members/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const getMembersReport = async (filter?: any): Promise<MembersReport | null> => {
    if (!token) return null;
    try {
      const params = new URLSearchParams(filter || {}).toString();
      const res = await fetch(`/api/admin/reports/members?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const getEventsReport = async (filter?: any): Promise<EventsReport | null> => {
    if (!token) return null;
    try {
      const params = new URLSearchParams(filter || {}).toString();
      const res = await fetch(`/api/admin/reports/events?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const getFinancialReport = async (filter?: any): Promise<FinancialReport | null> => {
    if (!token) return null;
    try {
      const params = new URLSearchParams(filter || {}).toString();
      const res = await fetch(`/api/admin/reports/financial?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const getAuditLogs = async (filter?: any): Promise<AuditLog[]> => {
    if (!token) return [];
    try {
      const params = new URLSearchParams(filter || {}).toString();
      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  };

  const getEventReminderSettings = async (): Promise<EventReminderSettings | null> => {
    if (!token) return null;
    try {
      const res = await fetch('/api/admin/event-reminders', {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const updateEventReminderSettings = async (settings: Partial<EventReminderSettings>): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/event-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return (
    <ChurchDataContext.Provider
      value={{
        churchProfile,
        bankingSettings,
        events,
        services,
        announcements,
        myRegistrations,
        myContributions,
        myTickets,
        notifications,
        unreadNotificationsCount,
        isLoading,
        refreshData,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        registerForEvent,
        reservePaidEvent,
        submitEventPaymentProof,
        cancelRegistration,
        createContribution,
        updateChurchProfile,
        updateBankingSettings,
        createEvent,
        updateEvent,
        deleteEvent,
        createService,
        updateService,
        deleteService,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        reviewContribution,
        reviewEventPayment,
        validateTicket,
        performCheckin,
        getEventCheckinStats,
        getEventAttendeesDetailed,
        getEventOperationalSummary,
        updateUserRole,
        getMembersReport,
        getEventsReport,
        getFinancialReport,
        getAuditLogs,
        getEventReminderSettings,
        updateEventReminderSettings,
      }}
    >
      {children}
    </ChurchDataContext.Provider>
  );
};

export function useChurchData() {
  const context = useContext(ChurchDataContext);
  if (!context) {
    throw new Error('useChurchData must be used within a ChurchDataProvider');
  }
  return context;
}
