export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EVENT_MANAGER' | 'FINANCE_MANAGER' | 'MEMBER';
export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  countryOfOrigin: string;
  profilePhoto?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface ChurchProfile {
  id: string;
  churchName: string;
  name?: string;
  shortName: string;
  logo: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
    whatsapp: string;
  };
  updatedAt: string;
}

export type EventCategory =
  | 'Church Services'
  | 'Youth'
  | 'Families'
  | 'Couples'
  | 'Conferences'
  | 'Bible Studies'
  | 'Special Events'
  | 'Evangelism'
  | 'Other';

export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Finished';

export interface ChurchEvent {
  id: string;
  title: string;
  banner: string;
  description: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate?: string | null;
  endTime?: string | null;
  location: string;
  address: string;
  isPaid: boolean;
  ticketPrice?: number | null;
  currency: string; // 'EUR'
  maximumCapacity?: number | null;
  registrationDeadline?: string | null; // ISO or YYYY-MM-DDTHH:mm
  additionalInfo?: string | null;
  status: EventStatus;
  createdAt: string;
  createdBy: string;
  registeredCount?: number;
  isUserRegistered?: boolean;
}

export type ContributionType = 'Tithe' | 'Offering';

export type ContributionStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';

export interface Contribution {
  id: string;
  userId: string;
  contributionType: ContributionType;
  amount: number;
  currency: string;
  transferDate: string;
  paymentReference: string;
  paymentProof?: string | null;
  proofSubmittedAt?: string | null;
  status: ContributionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  user?: {
    fullName: string;
    email: string;
    countryOfOrigin: string;
  };
}

export type EventPaymentStatus =
  | 'Awaiting Payment'
  | 'Payment Under Review'
  | 'Confirmed'
  | 'Payment Rejected'
  | 'Cancelled'
  | 'Expired';

export interface EventTicket {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  ticketCode?: string;
  qrCodeToken: string;
  ticketStatus: 'VALID' | 'USED' | 'CANCELLED';
  checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  checkInAt?: string | null;
  checkedInBy?: string | null;
  checkedInByName?: string | null;
  createdAt: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  userName?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registrationNumber: string;
  registrationStatus: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  isPaidEvent?: boolean;
  paymentAmount?: number | null;
  paymentCurrency?: string;
  paymentProof?: string | null;
  paymentSubmittedAt?: string | null;
  paymentStatus?: EventPaymentStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reservationExpiration?: string | null;
  ticket?: EventTicket | null;
  checkInStatus?: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  checkInAt?: string | null;
  checkedInBy?: string | null;
  user?: {
    fullName: string;
    email: string;
    countryOfOrigin: string;
  };
  event?: ChurchEvent;
}

export interface BankingSettings {
  id: string;
  beneficiaryName: string;
  bankName: string;
  iban: string;
  bicSwift: string;
  paymentReference: string;
  paymentReferencePattern?: string;
  instructions?: string;
  additionalInstructions: string;
  additionalInfo?: string;
  bankQrCodeImage: string | null;
  bankQrCode?: string | null;
  reservationExpiryHours: number;
  updatedAt: string;
  updatedBy: string;
}


export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface ServiceSchedule {
  id: string;
  serviceName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  mainLanguage: string;
  hasSimultaneousTranslation: boolean;
  translationLanguages: string[];
  location: string;
  description?: string;
  status: 'ACTIVE' | 'TEMPORARY_CHANGE' | 'SUSPENDED';
  temporaryNotice?: string | null;
}

export type AnnouncementCategory =
  | 'General Announcements'
  | 'Church News'
  | 'Special Services'
  | 'Events'
  | 'Important Notices';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  category?: AnnouncementCategory;
  publicationDate: string;
  expirationDate?: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
  isHighlighted?: boolean;
  createdBy: string;
  createdAt?: string;
}

export type NotificationType =
  | 'EVENT_NEW'
  | 'EVENT_UPDATE'
  | 'EVENT_CANCEL'
  | 'EVENT_REMINDER'
  | 'REGISTRATION_CONFIRMED'
  | 'PROOF_RECEIVED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'TICKET_AVAILABLE'
  | 'ANNOUNCEMENT_NEW'
  | 'ADMIN_NEW_USER'
  | 'ADMIN_NEW_REGISTRATION'
  | 'ADMIN_NEW_PROOF'
  | 'ADMIN_NEW_CONTRIBUTION'
  | 'ADMIN_PENDING_PAYMENT'
  | 'ADMIN_CAPACITY_ALERT';

export interface AppNotification {
  id: string;
  userId: string; // specific user ID or 'ADMIN_GROUP'
  title: string;
  message: string;
  notificationType: NotificationType;
  type?: string;
  category: 'Events' | 'Registrations' | 'Finance' | 'Announcements' | 'System';
  relatedRecordId?: string | null;
  relatedRecordType?: string | null;
  readStatus: boolean;
  isRead?: boolean;
  createdAt: string;
  linkUrl?: string | null;
}

export type AuditAction =
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_CANCEL'
  | 'BANK_SETTINGS_UPDATE'
  | 'CONTRIBUTION_APPROVE'
  | 'CONTRIBUTION_REJECT'
  | 'PAYMENT_APPROVE'
  | 'PAYMENT_REJECT'
  | 'USER_ROLE_CHANGE'
  | 'ACCOUNT_STATUS_CHANGE'
  | 'CHECKIN_RECORD'
  | 'ANNOUNCEMENT_CREATE'
  | 'ANNOUNCEMENT_UPDATE'
  | 'ANNOUNCEMENT_DELETE'
  | string;

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: 'EVENT' | 'BANKING' | 'CONTRIBUTION' | 'PAYMENT' | 'USER_ROLE' | 'ACCOUNT' | 'CHECKIN' | 'ANNOUNCEMENT' | string;
  entityId: string;
  details: string;
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  timestamp?: string;
}

export interface EventCheckin {
  id: string;
  eventId: string;
  registrationId: string;
  ticketId: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInBy: string;
  checkedInByName: string;
  checkedInAt: string;
  status: 'CHECKED_IN';
}

export interface EventCheckinStats {
  totalConfirmed: number;
  totalExpected?: number;
  totalPresent: number;
  totalCheckedIn?: number;
  totalAbsent: number;
  attendanceRate: number;
  checkins: EventCheckin[];
}

export interface EventOperationalSummary {
  event: ChurchEvent;
  metrics: {
    totalRegistrations: number;
    confirmedParticipants: number;
    presentCount: number;
    pendingPayments: number;
    approvedRevenue: number;
    rejectedPayments: number;
    totalPresent: number;
    totalAbsent: number;
    attendanceRate: number;
    capacity?: number | null;
  };
  totalRegistrations: number;
  confirmedParticipants: number;
  pendingPayments: number;
  approvedRevenue: number;
  rejectedPayments: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  eventUpdates: boolean;
  eventReminders: boolean;
  churchAnnouncements: boolean;
  financialUpdates: boolean;
  pushEnabled: boolean;
  updatedAt: string;
}

export interface EventReminderSettings {
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
  send24hReminder?: boolean;
  send2hReminder?: boolean;
}

export type ReportPeriod = '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom' | string;

export interface ReportFilter {
  period: '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom' | string;
  startDate?: string;
  endDate?: string;
  eventId?: string;
}

export interface MembersReport {
  period: string;
  summary: {
    totalUsersCount: number;
    newRegistrationsCount: number;
    activeAccountsCount: number;
    disabledAccountsCount: number;
  };
  totalRegisteredAppUsers: number;
  newRegistrationsInPeriod: number;
  activeAccountsCount: number;
  disabledAccountsCount: number;
  countryDistribution: Array<{ country: string; count: number; percentage: number }>;
  monthlyGrowth: Array<{ month: string; label: string; count: number; cumulative: number }>;
  membersList: Array<{
    id: string;
    fullName: string;
    email: string;
    countryOfOrigin: string;
    role: UserRole;
    accountStatus: AccountStatus;
    createdAt: string;
  }>;
}

export interface EventsReport {
  period: string;
  summary: {
    totalEventsCount: number;
    upcomingEventsCount: number;
    pastEventsCount: number;
    totalRegistrations: number;
    totalCheckins: number;
    overallAttendanceRate: number;
  };
  totalEvents: number;
  upcomingEventsCount: number;
  pastEventsCount: number;
  totalRegistrations: number;
  totalCheckins: number;
  overallAttendanceRate: number;
  topAttendedEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    category: string;
    isPaid: boolean;
    ticketPrice: number;
    registeredCount: number;
    checkedInCount: number;
    attendanceRate: number;
  }>;
  allEventsStats: Array<any>;
}

export interface FinancialReport {
  period: string;
  totalApprovedRevenue: number;
  tithes: {
    totalApproved: number;
    contributionsCount: number;
    averageAmount: number;
  };
  offerings: {
    totalApproved: number;
    contributionsCount: number;
    averageAmount: number;
  };
  eventPayments: {
    totalApprovedRevenue: number;
    confirmedPaidTicketsCount: number;
    pendingTicketsCount: number;
    rejectedTicketsCount: number;
    byEvent: Array<any>;
  };
  pendingSeparation: {
    pendingContributionsCount: number;
    pendingContributionsAmount: number;
    pendingEventPaymentsCount: number;
    notice: string;
  };
  pendingAmounts?: {
    pendingContributionsCount: number;
    pendingContributionsAmount: number;
    pendingEventPaymentsCount: number;
    notice: string;
  };
  monthlyFinancialEvolution: Array<{
    month: string;
    label: string;
    tithes: number;
    offerings: number;
    count: number;
    total: number;
  }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type Language = 'en' | 'pt';
