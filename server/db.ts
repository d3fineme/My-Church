import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  UserRole,
  ChurchProfile,
  ChurchEvent,
  EventRegistration,
  ServiceSchedule,
  Announcement,
  AnnouncementCategory,
  Contribution,
  ContributionType,
  ContributionStatus,
  BankingSettings,
  EventTicket,
  EventPaymentStatus,
  AppNotification,
  AuditLog,
  EventCheckin,
  NotificationPreferences,
  EventReminderSettings,
  ReportFilter,
  EventCheckinStats,
} from '../src/types/index';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  churchProfile: ChurchProfile;
  bankingSettings: BankingSettings;
  contributions: Contribution[];
  events: ChurchEvent[];
  eventRegistrations: EventRegistration[];
  eventTickets: EventTicket[];
  eventCheckins: EventCheckin[];
  serviceSchedule: ServiceSchedule[];
  announcements: Announcement[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  notificationPreferences: NotificationPreferences[];
  eventReminderSettings: EventReminderSettings;
  tokens: Record<string, { userId: string; role: UserRole; expiresAt: number }>;
  passwordResetTokens: Record<string, { email: string; expiresAt: number }>;
  bootstrapKey: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

const DEFAULT_CHURCH_PROFILE: ChurchProfile = {
  id: 'default',
  churchName: 'Assembly of God Ireland Ministry - AOGIM Dublin',
  shortName: 'AOGIM Dublin',
  logo: '',
  description:
    'Welcome to AOGIM Dublin! We are a Christ-centered, multicultural, and vibrant Pentecostal community serving families, students, and workers in Dublin, Ireland. Our mission is to declare the gospel of Jesus Christ, make disciples, and foster authentic Christian fellowship.',
  address: 'Unit 12, Park West Enterprise Centre, Nangor Road',
  city: 'Dublin 12',
  country: 'Ireland',
  postalCode: 'D12 X2P4',
  phone: '+353 (0) 1 456 7890',
  email: 'contact@aogimdublin.org',
  website: 'https://aogimdublin.org',
  socialLinks: {
    instagram: 'https://instagram.com/aogimdublin',
    facebook: 'https://facebook.com/aogimdublin',
    youtube: 'https://youtube.com/@aogimdublin',
    whatsapp: 'https://wa.me/35314567890',
  },
  updatedAt: new Date().toISOString(),
};

const DEFAULT_BANKING_SETTINGS: BankingSettings = {
  id: 'default',
  beneficiaryName: 'Assembly of God Ireland Ministry',
  bankName: 'Bank of Ireland (Dublin South)',
  iban: 'IE29 BOFI 9000 1712 3456 78',
  bicSwift: 'BOFIIE2D',
  paymentReference: 'AOGIM-DUBLIN',
  additionalInstructions:
    'Please include your Full Name and purpose (e.g. "Tithe - [Name]", "Offering - [Name]", or "Event - [Ref]") in the transfer description.',
  bankQrCodeImage: null,
  reservationExpiryHours: 24,
  updatedAt: new Date().toISOString(),
  updatedBy: 'usr_admin',
};

const DEFAULT_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'cnt_init_1',
    userId: 'usr_member1',
    contributionType: 'Tithe',
    amount: 150,
    currency: 'EUR',
    transferDate: '2026-11-01',
    paymentReference: 'Tithe - Lucas Silva',
    paymentProof: null,
    proofSubmittedAt: null,
    status: 'Approved',
    reviewedBy: 'Pastor & Admin AOGIM',
    reviewedAt: '2026-11-02T10:00:00Z',
    rejectionReason: null,
    createdAt: '2026-11-01T15:30:00Z',
  },
  {
    id: 'cnt_init_2',
    userId: 'usr_member1',
    contributionType: 'Offering',
    amount: 50,
    currency: 'EUR',
    transferDate: '2026-11-08',
    paymentReference: 'Offering - Sunday Celebration',
    paymentProof: null,
    proofSubmittedAt: null,
    status: 'Under Review',
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: '2026-11-08T12:00:00Z',
  },
];

const DEFAULT_SERVICES: ServiceSchedule[] = [
  {
    id: 'srv_1',
    serviceName: 'Sunday Celebration & Family Worship (Culto da Família)',
    dayOfWeek: 'Sunday',
    startTime: '10:30',
    endTime: '12:30',
    mainLanguage: 'Portuguese',
    hasSimultaneousTranslation: true,
    translationLanguages: ['English', 'Spanish'],
    location: 'Main Sanctuary & AOGIM Kids Hall',
    description: 'Sunday morning worship, inspirational sermon, and specialized Sunday School classes for children and toddlers.',
    status: 'ACTIVE',
    temporaryNotice: null,
  },
  {
    id: 'srv_2',
    serviceName: 'Sunday International Evening Service',
    dayOfWeek: 'Sunday',
    startTime: '18:30',
    endTime: '20:15',
    mainLanguage: 'English',
    hasSimultaneousTranslation: true,
    translationLanguages: ['Portuguese'],
    location: 'Main Sanctuary',
    description: 'Dynamic evening praise and preaching welcoming people of all nationalities living in Dublin.',
    status: 'ACTIVE',
    temporaryNotice: null,
  },
  {
    id: 'srv_3',
    serviceName: 'Midweek Bible Study & Prayer (Culto de Doutrina e Oração)',
    dayOfWeek: 'Wednesday',
    startTime: '19:30',
    endTime: '21:00',
    mainLanguage: 'Portuguese',
    hasSimultaneousTranslation: true,
    translationLanguages: ['English'],
    location: 'Main Sanctuary / Hybrid Stream',
    description: 'In-depth systematic study of the Holy Scriptures, corporate intercessory prayer, and spiritual renewal.',
    status: 'ACTIVE',
    temporaryNotice: null,
  },
  {
    id: 'srv_4',
    serviceName: 'Youth Alive Fellowship (Jovens AOGIM)',
    dayOfWeek: 'Saturday',
    startTime: '19:00',
    endTime: '21:30',
    mainLanguage: 'Bilingual (English / Portuguese)',
    hasSimultaneousTranslation: true,
    translationLanguages: ['English', 'Portuguese'],
    location: 'Youth Hall',
    description: 'Vibrant youth praise, real conversations, fellowship, acoustic music, and social connection for teens and young adults.',
    status: 'ACTIVE',
    temporaryNotice: null,
  },
];

const DEFAULT_EVENTS: ChurchEvent[] = [
  {
    id: 'evt_1',
    title: 'Ignite Dublin 2026: Youth & Young Adults Conference',
    banner: '/src/assets/images/youth_conference_banner_1794307702391.jpg',
    description:
      'Join hundreds of young people from across Ireland and Europe for Ignite Dublin 2026. Two unforgettable days with guest speakers, worship bands, breakout seminars, and divine empowerment.',
    category: 'Youth',
    startDate: '2026-11-21',
    startTime: '18:30',
    endDate: '2026-11-22',
    endTime: '21:30',
    location: 'AOGIM Main Sanctuary, Dublin',
    address: 'Unit 12, Park West Enterprise Centre, Nangor Road, Dublin 12',
    isPaid: false,
    ticketPrice: null,
    currency: 'EUR',
    maximumCapacity: 250,
    registrationDeadline: '2026-11-20T23:59',
    additionalInfo: 'Free admission with seat reservation. Coffee and light refreshments served at reception. Parking available on site.',
    status: 'Published',
    createdAt: '2026-11-01T10:00:00Z',
    createdBy: 'admin@aogimdublin.org',
  },
  {
    id: 'evt_2',
    title: 'Couples Fellowship Gala & Seminar',
    banner: '/src/assets/images/couples_fellowship_banner_1794307703019.jpg',
    description:
      'An inspiring and romantic evening dedicated to building strong, biblical marriages. Includes dinner, marriage workshop with guest counselors, and live acoustic music.',
    category: 'Couples',
    startDate: '2026-11-28',
    startTime: '19:00',
    endDate: '2026-11-28',
    endTime: '22:30',
    location: 'Grand Ballroom, Dublin Centre',
    address: 'Grand Canal Dock, Dublin 2',
    isPaid: true,
    ticketPrice: 25,
    currency: 'EUR',
    maximumCapacity: 45,
    registrationDeadline: '2026-11-25T18:00',
    additionalInfo: 'Ticket price covers a 3-course dinner per couple. Online booking & payment will launch in our next release; tickets can be booked with the welcoming team at church.',
    status: 'Published',
    createdAt: '2026-11-02T12:00:00Z',
    createdBy: 'admin@aogimdublin.org',
  },
  {
    id: 'evt_3',
    title: 'Thanksgiving & Praise Night: United in Dublin',
    banner: '/src/assets/images/aogim_worship_banner_1794307702148.jpg',
    description:
      'A citywide evening of gratitude, unity, and worship gathering all ministries, choir, and guest worship leaders to celebrate what God has done throughout Ireland this year.',
    category: 'Special Events',
    startDate: '2026-12-05',
    startTime: '19:00',
    endDate: '2026-12-05',
    endTime: '21:30',
    location: 'AOGIM Main Sanctuary, Dublin',
    address: 'Unit 12, Park West Enterprise Centre, Nangor Road, Dublin 12',
    isPaid: false,
    ticketPrice: null,
    currency: 'EUR',
    maximumCapacity: 300,
    registrationDeadline: '2026-12-04T23:59',
    additionalInfo: 'Free event for the whole family. Simultaneous translation available in English and Portuguese.',
    status: 'Published',
    createdAt: '2026-11-03T15:00:00Z',
    createdBy: 'admin@aogimdublin.org',
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Welcome to the AOGIM Dublin Official Mobile App!',
    description:
      'We are delighted to release our mobile-first application to help our church members, visitors, and families stay updated with church life, conferences, service times, and registrations.',
    image: '/src/assets/images/dublin_church_building_1794307703454.jpg',
    category: 'Important Notices',
    publicationDate: '2026-11-09',
    status: 'PUBLISHED',
    isHighlighted: true,
    createdBy: 'admin@aogimdublin.org',
    createdAt: '2026-11-09T10:00:00Z',
  },
  {
    id: 'ann_2',
    title: 'Simultaneous Translation Available at Every Sunday Service',
    description:
      'Did you know our services are accessible to non-Portuguese and non-English speakers? Headsets with live translation channels are available at the Welcome Desk in the lobby before each service.',
    image: null,
    category: 'Special Services',
    publicationDate: '2026-11-06',
    status: 'PUBLISHED',
    isHighlighted: false,
    createdBy: 'admin@aogimdublin.org',
    createdAt: '2026-11-06T12:00:00Z',
  },
  {
    id: 'ann_3',
    title: 'Monthly Fasting & Prayer Vigil — Next Friday Night',
    description:
      'Join us for our monthly night vigil at the Main Sanctuary from 22:00 to 02:00. We will pray for revival across Ireland, our families, and community evangelism outreach.',
    image: null,
    category: 'Church News',
    publicationDate: '2026-11-04',
    status: 'PUBLISHED',
    isHighlighted: false,
    createdBy: 'admin@aogimdublin.org',
    createdAt: '2026-11-04T09:00:00Z',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        let changed = false;
        if (!parsed.bankingSettings) {
          parsed.bankingSettings = DEFAULT_BANKING_SETTINGS;
          changed = true;
        }
        if (!parsed.contributions) {
          parsed.contributions = DEFAULT_CONTRIBUTIONS;
          changed = true;
        }
        if (!parsed.eventTickets) {
          parsed.eventTickets = [];
          changed = true;
        }
        if (!parsed.eventCheckins) {
          parsed.eventCheckins = [];
          changed = true;
        }
        if (!parsed.notifications) {
          parsed.notifications = [];
          changed = true;
        }
        if (!parsed.auditLogs) {
          parsed.auditLogs = [];
          changed = true;
        }
        if (!parsed.notificationPreferences) {
          parsed.notificationPreferences = [];
          changed = true;
        }
        if (!parsed.eventReminderSettings) {
          parsed.eventReminderSettings = { reminder24hEnabled: true, reminder2hEnabled: true };
          changed = true;
        }
        // Upgrade admin user role to SUPER_ADMIN if needed
        if (parsed.users) {
          for (const u of parsed.users) {
            if (u.id === 'usr_admin' && (u.role === 'ADMIN' || !u.role)) {
              u.role = 'SUPER_ADMIN';
              changed = true;
            }
          }
        }
        // Ensure announcements have categories
        if (parsed.announcements) {
          for (const a of parsed.announcements) {
            if (!a.category) {
              a.category = a.id === 'ann_1' ? 'Important Notices' : 'Church News';
              changed = true;
            }
            if (a.isHighlighted === undefined) {
              a.isHighlighted = a.id === 'ann_1';
              changed = true;
            }
          }
        }

        if (changed) {
          fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return parsed;
      } catch (err) {
        console.error('Error loading database, resetting to default seeds:', err);
      }
    }

    // Initialize initial default seeds
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const memberSalt = crypto.randomBytes(16).toString('hex');

    const adminUser: User & { passwordHash: string; salt: string } = {
      id: 'usr_admin',
      fullName: 'Pastor & Admin AOGIM',
      email: 'admin@aogimdublin.org',
      countryOfOrigin: 'Ireland',
      profilePhoto: null,
      role: 'SUPER_ADMIN',
      accountStatus: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00Z',
      salt: adminSalt,
      passwordHash: hashPassword('adminAogim2026!', adminSalt),
    };

    const memberUser: User & { passwordHash: string; salt: string } = {
      id: 'usr_member1',
      fullName: 'Lucas Silva',
      email: 'lucas.silva@example.com',
      countryOfOrigin: 'Brazil',
      profilePhoto: null,
      role: 'MEMBER',
      accountStatus: 'ACTIVE',
      createdAt: '2026-10-15T10:00:00Z',
      salt: memberSalt,
      passwordHash: hashPassword('member2026!', memberSalt),
    };

    // Initial registration for memberUser on Ignite Conference
    const initialReg: EventRegistration = {
      id: 'reg_init_1',
      eventId: 'evt_1',
      userId: 'usr_member1',
      registrationNumber: 'AOG-2026-8842',
      registrationStatus: 'CONFIRMED',
      createdAt: '2026-11-05T14:20:00Z',
    };

    const initialAudit: AuditLog = {
      id: 'log_init_1',
      userId: 'usr_admin',
      userName: 'Pastor & Admin AOGIM',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'ACCOUNT',
      entityId: 'usr_admin',
      details: 'Initial church system bootstrap and security parameters configured.',
      createdAt: '2026-10-01T08:00:00Z',
    };

    const initialNotification: AppNotification = {
      id: 'notif_init_1',
      userId: 'usr_member1',
      title: 'Welcome to AOGIM Dublin',
      message: 'Thank you for joining our church app! Explore upcoming conferences, Sunday service schedules, and connect with our community.',
      notificationType: 'ANNOUNCEMENT_NEW',
      category: 'System',
      readStatus: false,
      createdAt: '2026-11-05T14:25:00Z',
    };

    const initialDb: DatabaseSchema = {
      users: [adminUser, memberUser],
      churchProfile: DEFAULT_CHURCH_PROFILE,
      bankingSettings: DEFAULT_BANKING_SETTINGS,
      contributions: DEFAULT_CONTRIBUTIONS,
      events: DEFAULT_EVENTS,
      eventRegistrations: [initialReg],
      eventTickets: [],
      eventCheckins: [],
      serviceSchedule: DEFAULT_SERVICES,
      announcements: DEFAULT_ANNOUNCEMENTS,
      notifications: [initialNotification],
      auditLogs: [initialAudit],
      notificationPreferences: [],
      eventReminderSettings: { reminder24hEnabled: true, reminder2hEnabled: true },
      tokens: {},
      passwordResetTokens: {},
      bootstrapKey: 'AOGIM2026ADMIN',
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  // --- Auth & Users ---
  getUserByEmail(email: string) {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
  }

  getUserById(id: string): User | undefined {
    const u = this.data.users.find((user) => user.id === id);
    if (!u) return undefined;
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser;
  }

  validateCredentials(email: string, password: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return null;
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser;
  }

  createUser(params: {
    fullName: string;
    email: string;
    password: string;
    countryOfOrigin: string;
    role?: 'ADMIN' | 'MEMBER';
  }): User {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);
    const newUser = {
      id: generateId('usr'),
      fullName: params.fullName.trim(),
      email: params.email.toLowerCase().trim(),
      countryOfOrigin: params.countryOfOrigin.trim(),
      profilePhoto: null,
      role: params.role || 'MEMBER', // Default is strictly MEMBER
      accountStatus: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser;
  }

  updateUserProfile(
    userId: string,
    updates: { fullName?: string; countryOfOrigin?: string; profilePhoto?: string | null }
  ): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (updates.fullName !== undefined) user.fullName = updates.fullName.trim();
    if (updates.countryOfOrigin !== undefined)
      user.countryOfOrigin = updates.countryOfOrigin.trim();
    if (updates.profilePhoto !== undefined) user.profilePhoto = updates.profilePhoto;
    this.save();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    const oldHash = hashPassword(oldPassword, user.salt);
    if (oldHash !== user.passwordHash) return false;

    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);
    this.save();
    return true;
  }

  setUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED'): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.accountStatus = status;
    this.save();
    return true;
  }

  deleteUser(userId: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === userId);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    // Also remove registrations
    this.data.eventRegistrations = this.data.eventRegistrations.filter(
      (r) => r.userId !== userId
    );
    this.save();
    return true;
  }

  getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...u }) => u);
  }

  createSessionToken(userId: string, role: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    this.data.tokens[token] = { userId, role: role as any, expiresAt };
    this.save();
    return token;
  }

  validateToken(token: string): { userId: string; role: any } | null {
    const session = this.data.tokens[token];
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      delete this.data.tokens[token];
      this.save();
      return null;
    }
    return session;
  }

  revokeToken(token: string): void {
    if (this.data.tokens[token]) {
      delete this.data.tokens[token];
      this.save();
    }
  }

  createPasswordReset(email: string): string {
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    this.data.passwordResetTokens[token] = {
      email: email.toLowerCase().trim(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };
    this.save();
    return token;
  }

  resetPasswordWithToken(code: string, newPassword: string): boolean {
    const item = this.data.passwordResetTokens[code];
    if (!item || item.expiresAt < Date.now()) return false;
    const user = this.getUserByEmail(item.email);
    if (!user) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    delete this.data.passwordResetTokens[code];
    this.save();
    return true;
  }

  bootstrapAdmin(secretKey: string, email: string): boolean {
    if (secretKey !== this.data.bootstrapKey) return false;
    const user = this.getUserByEmail(email);
    if (!user) return false;
    user.role = 'ADMIN';
    this.save();
    return true;
  }

  // --- Church Profile ---
  getChurchProfile(): ChurchProfile {
    return this.data.churchProfile;
  }

  updateChurchProfile(updates: Partial<ChurchProfile>): ChurchProfile {
    this.data.churchProfile = {
      ...this.data.churchProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.churchProfile;
  }

  // --- Events ---
  getEvents(filterRole: 'ADMIN' | 'MEMBER' = 'MEMBER'): ChurchEvent[] {
    let list = this.data.events;
    if (filterRole === 'MEMBER') {
      list = list.filter((e) => e.status === 'Published');
    }
    // Attach registered count
    return list.map((evt) => {
      const registeredCount = this.data.eventRegistrations.filter(
        (r) => r.eventId === evt.id && r.registrationStatus === 'CONFIRMED'
      ).length;
      return {
        ...evt,
        registeredCount,
      };
    });
  }

  getEventById(id: string, userId?: string): (ChurchEvent & { registeredCount: number; isUserRegistered: boolean }) | null {
    const evt = this.data.events.find((e) => e.id === id);
    if (!evt) return null;
    const registrations = this.data.eventRegistrations.filter(
      (r) => r.eventId === id && r.registrationStatus === 'CONFIRMED'
    );
    const isUserRegistered = userId
      ? registrations.some((r) => r.userId === userId)
      : false;
    return {
      ...evt,
      registeredCount: registrations.length,
      isUserRegistered,
    };
  }

  createEvent(eventData: Omit<ChurchEvent, 'id' | 'createdAt'>): ChurchEvent {
    const newEvent: ChurchEvent = {
      ...eventData,
      id: generateId('evt'),
      createdAt: new Date().toISOString(),
    };
    this.data.events.push(newEvent);
    this.save();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<ChurchEvent>): ChurchEvent | null {
    const index = this.data.events.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.data.events[index] = {
      ...this.data.events[index],
      ...updates,
    };
    this.save();
    return this.data.events[index];
  }

  deleteEvent(id: string): boolean {
    const index = this.data.events.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.data.events.splice(index, 1);
    this.data.eventRegistrations = this.data.eventRegistrations.filter(
      (r) => r.eventId !== id
    );
    this.save();
    return true;
  }

  // --- Registrations ---
  registerForEvent(
    eventId: string,
    userId: string
  ): { success: boolean; message: string; registration?: EventRegistration; ticket?: EventTicket } {
    const evt = this.data.events.find((e) => e.id === eventId);
    if (!evt) return { success: false, message: 'Event not found.' };

    if (evt.status !== 'Published') {
      return { success: false, message: 'This event is not open for registration.' };
    }

    if (evt.isPaid) {
      return this.reservePaidEvent(eventId, userId);
    }

    // Check deadline
    if (evt.registrationDeadline) {
      const deadline = new Date(evt.registrationDeadline);
      if (new Date() > deadline) {
        return { success: false, message: 'Registration deadline has passed.' };
      }
    }

    // Check duplicate
    const existing = this.data.eventRegistrations.find(
      (r) => r.eventId === eventId && r.userId === userId && r.registrationStatus === 'CONFIRMED'
    );
    if (existing) {
      return {
        success: false,
        message: 'You have already confirmed your attendance for this event.',
        registration: existing,
      };
    }

    // Check capacity
    if (evt.maximumCapacity && evt.maximumCapacity > 0) {
      const currentCount = this.data.eventRegistrations.filter(
        (r) => r.eventId === eventId && r.registrationStatus === 'CONFIRMED'
      ).length;
      if (currentCount >= evt.maximumCapacity) {
        return { success: false, message: 'This event has reached full capacity.' };
      }
    }

    const regNumber = `AOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketNumber = `AOG-TCK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrCodeToken = `AOGIM:TCK:FREE:${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const attendee = this.data.users.find((u) => u.id === userId);

    const regId = generateId('reg');
    const newTicket: EventTicket = {
      id: generateId('tck'),
      registrationId: regId,
      eventId,
      userId,
      ticketNumber,
      qrCodeToken,
      ticketStatus: 'VALID',
      checkInStatus: 'NOT_CHECKED_IN',
      createdAt: new Date().toISOString(),
      eventTitle: evt.title,
      eventDate: evt.startDate,
      eventTime: evt.startTime,
      userName: attendee?.fullName || 'Attendee',
    };

    const newReg: EventRegistration = {
      id: regId,
      eventId,
      userId,
      registrationNumber: regNumber,
      registrationStatus: 'CONFIRMED',
      isPaidEvent: false,
      ticket: newTicket,
      createdAt: new Date().toISOString(),
    };

    if (!this.data.eventTickets) this.data.eventTickets = [];
    this.data.eventTickets.push(newTicket);
    this.data.eventRegistrations.push(newReg);
    this.save();
    return { success: true, message: 'Attendance confirmed successfully!', registration: newReg, ticket: newTicket };
  }

  // --- Paid Event Ticket Reservation ---
  reservePaidEvent(
    eventId: string,
    userId: string
  ): { success: boolean; message: string; registration?: EventRegistration } {
    const evt = this.data.events.find((e) => e.id === eventId);
    if (!evt) return { success: false, message: 'Event not found.' };

    if (evt.status !== 'Published') {
      return { success: false, message: 'This event is not currently open for reservations.' };
    }

    // Check deadline
    if (evt.registrationDeadline) {
      const deadline = new Date(evt.registrationDeadline);
      if (new Date() > deadline) {
        return { success: false, message: 'Registration deadline has passed for this event.' };
      }
    }

    // Check duplicate reservation
    const now = new Date();
    const existing = this.data.eventRegistrations.find(
      (r) =>
        r.eventId === eventId &&
        r.userId === userId &&
        r.registrationStatus === 'CONFIRMED' &&
        r.paymentStatus !== 'Cancelled' &&
        r.paymentStatus !== 'Expired'
    );

    if (existing) {
      return {
        success: false,
        message: 'You already have an active reservation or ticket for this event.',
        registration: existing,
      };
    }

    // Check capacity (counting Confirmed, Awaiting Payment unexpired, and Payment Under Review)
    if (evt.maximumCapacity && evt.maximumCapacity > 0) {
      const activeReservations = this.data.eventRegistrations.filter((r) => {
        if (r.eventId !== eventId || r.registrationStatus !== 'CONFIRMED') return false;
        if (!r.isPaidEvent) return true;
        if (r.paymentStatus === 'Confirmed' || r.paymentStatus === 'Payment Under Review') return true;
        if (r.paymentStatus === 'Awaiting Payment' || r.paymentStatus === 'Payment Rejected') {
          if (r.reservationExpiration && new Date(r.reservationExpiration) > now) return true;
        }
        return false;
      }).length;

      if (activeReservations >= evt.maximumCapacity) {
        return { success: false, message: 'All seats and ticket reservations for this event are currently filled.' };
      }
    }

    const expiryHours = this.data.bankingSettings?.reservationExpiryHours || 24;
    const reservationExpiration = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
    const regNumber = `AOG-RES-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newReg: EventRegistration = {
      id: generateId('reg'),
      eventId,
      userId,
      registrationNumber: regNumber,
      registrationStatus: 'CONFIRMED',
      isPaidEvent: true,
      paymentAmount: evt.ticketPrice || 0,
      paymentCurrency: evt.currency || 'EUR',
      paymentProof: null,
      paymentSubmittedAt: null,
      paymentStatus: 'Awaiting Payment',
      reservationExpiration,
      createdAt: new Date().toISOString(),
    };

    this.data.eventRegistrations.push(newReg);
    this.save();

    return {
      success: true,
      message: 'Ticket reservation created! Please submit your bank payment proof within 24 hours.',
      registration: newReg,
    };
  }

  submitEventPaymentProof(
    registrationId: string,
    userId: string,
    paymentProof: string
  ): { success: boolean; message: string; registration?: EventRegistration } {
    const reg = this.data.eventRegistrations.find(
      (r) => r.id === registrationId && r.userId === userId
    );

    if (!reg) {
      return { success: false, message: 'Reservation not found or unauthorized.' };
    }

    if (reg.paymentStatus === 'Confirmed') {
      return { success: false, message: 'Payment is already confirmed and your ticket is active.' };
    }

    if (reg.reservationExpiration && new Date() > new Date(reg.reservationExpiration)) {
      reg.paymentStatus = 'Expired';
      this.save();
      return { success: false, message: 'Your reservation hold has expired. Please create a new ticket reservation if seats are open.' };
    }

    reg.paymentProof = paymentProof;
    reg.paymentSubmittedAt = new Date().toISOString();
    reg.paymentStatus = 'Payment Under Review';
    this.save();

    return {
      success: true,
      message: 'Payment proof submitted successfully! It is now under administrative review.',
      registration: reg,
    };
  }

  getAllEventPayments(): EventRegistration[] {
    const paidRegs = this.data.eventRegistrations.filter((r) => r.isPaidEvent);
    return paidRegs.map((r) => {
      const u = this.data.users.find((user) => user.id === r.userId);
      const evt = this.data.events.find((e) => e.id === r.eventId);
      const ticket = this.data.eventTickets.find((t) => t.registrationId === r.id);
      return {
        ...r,
        event: evt,
        ticket: ticket || null,
        user: u
          ? {
              fullName: u.fullName,
              email: u.email,
              countryOfOrigin: u.countryOfOrigin,
            }
          : { fullName: 'Unknown', email: '', countryOfOrigin: '' },
      };
    });
  }

  reviewEventPayment(
    registrationId: string,
    adminId: string,
    status: 'Confirmed' | 'Payment Rejected',
    rejectionReason?: string
  ): { success: boolean; message: string; registration?: EventRegistration; ticket?: EventTicket } {
    const reg = this.data.eventRegistrations.find((r) => r.id === registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };

    const reviewer = this.data.users.find((u) => u.id === adminId);
    const reviewerName = reviewer ? reviewer.fullName : 'Administrator';

    reg.reviewedBy = reviewerName;
    reg.reviewedAt = new Date().toISOString();

    if (status === 'Confirmed') {
      reg.paymentStatus = 'Confirmed';
      reg.registrationStatus = 'CONFIRMED';
      reg.rejectionReason = null;

      // Generate digital ticket
      const evt = this.data.events.find((e) => e.id === reg.eventId);
      const attendee = this.data.users.find((u) => u.id === reg.userId);
      const ticketNumber = `AOG-TCK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const qrCodeToken = `AOGIM:TCK:${reg.id}:${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      // Check if ticket already exists for this registration
      let ticket = this.data.eventTickets.find((t) => t.registrationId === reg.id);
      if (!ticket) {
        ticket = {
          id: generateId('tck'),
          registrationId: reg.id,
          eventId: reg.eventId,
          userId: reg.userId,
          ticketNumber,
          qrCodeToken,
          ticketStatus: 'VALID',
          checkInStatus: 'NOT_CHECKED_IN',
          createdAt: new Date().toISOString(),
          eventTitle: evt?.title || 'AOGIM Event',
          eventDate: evt?.startDate || '',
          eventTime: evt?.startTime || '',
          userName: attendee?.fullName || 'Attendee',
        };
        this.data.eventTickets.push(ticket);
      } else {
        ticket.ticketStatus = 'VALID';
      }

      reg.ticket = ticket;
      this.save();
      return { success: true, message: 'Payment approved and digital ticket generated!', registration: reg, ticket };
    } else {
      reg.paymentStatus = 'Payment Rejected';
      reg.rejectionReason = rejectionReason || 'Payment proof could not be verified with church bank records.';
      this.save();
      return { success: true, message: 'Payment marked as rejected. Member may re-submit proof.', registration: reg };
    }
  }

  getUserTickets(userId: string): EventTicket[] {
    const userTickets = this.data.eventTickets.filter(
      (t) => t.userId === userId && t.ticketStatus === 'VALID'
    );
    return userTickets.map((t) => {
      const evt = this.data.events.find((e) => e.id === t.eventId);
      const user = this.data.users.find((u) => u.id === t.userId);
      return {
        ...t,
        eventTitle: evt?.title || t.eventTitle,
        eventDate: evt?.startDate || t.eventDate,
        eventTime: evt?.startTime || t.eventTime,
        userName: user?.fullName || t.userName,
      };
    });
  }

  cancelRegistration(eventId: string, userId: string): boolean {
    const reg = this.data.eventRegistrations.find(
      (r) =>
        r.eventId === eventId &&
        r.userId === userId &&
        r.registrationStatus === 'CONFIRMED' &&
        r.paymentStatus !== 'Cancelled'
    );
    if (!reg) return false;
    reg.registrationStatus = 'CANCELLED';
    if (reg.isPaidEvent) {
      reg.paymentStatus = 'Cancelled';
    }
    // Invalidate ticket if one existed
    const ticket = this.data.eventTickets.find((t) => t.registrationId === reg.id);
    if (ticket) {
      ticket.ticketStatus = 'CANCELLED';
    }
    this.save();
    return true;
  }

  getUserRegistrations(userId: string): EventRegistration[] {
    const regs = this.data.eventRegistrations.filter((r) => r.userId === userId);
    return regs.map((r) => {
      const event = this.data.events.find((e) => e.id === r.eventId);
      const ticket = this.data.eventTickets.find((t) => t.registrationId === r.id);
      return {
        ...r,
        event,
        ticket: ticket || null,
      };
    });
  }

  getEventAttendees(eventId: string): EventRegistration[] {
    const regs = this.data.eventRegistrations.filter((r) => r.eventId === eventId);
    return regs.map((r) => {
      const u = this.data.users.find((user) => user.id === r.userId);
      const ticket = this.data.eventTickets.find((t) => t.registrationId === r.id);
      return {
        ...r,
        ticket: ticket || null,
        user: u
          ? {
              fullName: u.fullName,
              email: u.email,
              countryOfOrigin: u.countryOfOrigin,
            }
          : { fullName: 'Unknown', email: '', countryOfOrigin: '' },
      };
    });
  }

  // --- Banking Settings ---
  getBankingSettings(): BankingSettings {
    if (!this.data.bankingSettings) {
      this.data.bankingSettings = DEFAULT_BANKING_SETTINGS;
      this.save();
    }
    return this.data.bankingSettings;
  }

  updateBankingSettings(updates: Partial<BankingSettings>, adminId: string): BankingSettings {
    const reviewer = this.data.users.find((u) => u.id === adminId);
    const updatedBy = reviewer ? reviewer.fullName : adminId;

    this.data.bankingSettings = {
      ...this.getBankingSettings(),
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    this.save();
    return this.data.bankingSettings;
  }

  // --- Contributions ---
  createContribution(
    userId: string,
    params: {
      contributionType: ContributionType;
      amount: number;
      transferDate: string;
      paymentReference: string;
      paymentProof?: string | null;
    }
  ): Contribution {
    const user = this.data.users.find((u) => u.id === userId);
    const hasProof = !!params.paymentProof;

    const newContribution: Contribution = {
      id: generateId('cnt'),
      userId,
      contributionType: params.contributionType,
      amount: Number(params.amount),
      currency: 'EUR',
      transferDate: params.transferDate || new Date().toISOString().slice(0, 10),
      paymentReference: params.paymentReference || `${params.contributionType} - ${user?.fullName || 'Member'}`,
      paymentProof: params.paymentProof || null,
      proofSubmittedAt: hasProof ? new Date().toISOString() : null,
      status: hasProof ? 'Under Review' : 'Submitted',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    };

    if (!this.data.contributions) {
      this.data.contributions = [];
    }
    this.data.contributions.push(newContribution);
    this.save();

    return newContribution;
  }

  getUserContributions(userId: string): Contribution[] {
    if (!this.data.contributions) return [];
    return this.data.contributions
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllContributions(): Array<Contribution & { user: { fullName: string; email: string; countryOfOrigin: string } }> {
    if (!this.data.contributions) return [];
    return this.data.contributions
      .map((c) => {
        const u = this.data.users.find((user) => user.id === c.userId);
        return {
          ...c,
          userName: u?.fullName || 'Member',
          userEmail: u?.email || '',
          user: u
            ? {
                fullName: u.fullName,
                email: u.email,
                countryOfOrigin: u.countryOfOrigin,
              }
            : { fullName: 'Unknown', email: '', countryOfOrigin: '' },
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  reviewContribution(
    contributionId: string,
    adminId: string,
    status: 'Approved' | 'Rejected',
    rejectionReason?: string
  ): Contribution | null {
    if (!this.data.contributions) return null;
    const item = this.data.contributions.find((c) => c.id === contributionId);
    if (!item) return null;

    const reviewer = this.data.users.find((u) => u.id === adminId);
    item.reviewedBy = reviewer ? reviewer.fullName : 'Administrator';
    item.reviewedAt = new Date().toISOString();
    item.status = status;
    item.rejectionReason = status === 'Rejected' ? (rejectionReason || 'Transfer could not be verified with church bank records.') : null;

    this.save();
    return item;
  }

  // --- Service Schedules ---
  getServiceSchedules(): ServiceSchedule[] {
    return this.data.serviceSchedule;
  }

  createServiceSchedule(service: Omit<ServiceSchedule, 'id'>): ServiceSchedule {
    const newSvc: ServiceSchedule = {
      ...service,
      id: generateId('srv'),
    };
    this.data.serviceSchedule.push(newSvc);
    this.save();
    return newSvc;
  }

  updateServiceSchedule(id: string, updates: Partial<ServiceSchedule>): ServiceSchedule | null {
    const index = this.data.serviceSchedule.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.data.serviceSchedule[index] = {
      ...this.data.serviceSchedule[index],
      ...updates,
    };
    this.save();
    return this.data.serviceSchedule[index];
  }

  deleteServiceSchedule(id: string): boolean {
    const index = this.data.serviceSchedule.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.data.serviceSchedule.splice(index, 1);
    this.save();
    return true;
  }

  // --- Announcements ---
  getAnnouncements(filterRole: UserRole | 'ADMIN' | 'MEMBER' = 'MEMBER'): Announcement[] {
    let list = this.data.announcements;
    if (filterRole === 'MEMBER') {
      list = list.filter((a) => a.status === 'PUBLISHED');
    }
    // Sort descending by publication date
    return [...list].sort(
      (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }

  createAnnouncement(announcement: Omit<Announcement, 'id'>): Announcement {
    const newAnn: Announcement = {
      ...announcement,
      id: generateId('ann'),
    };
    this.data.announcements.push(newAnn);
    this.save();
    return newAnn;
  }

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const index = this.data.announcements.findIndex((a) => a.id === id);
    if (index === -1) return null;
    this.data.announcements[index] = {
      ...this.data.announcements[index],
      ...updates,
    };
    this.save();
    return this.data.announcements[index];
  }

  deleteAnnouncement(id: string): boolean {
    const index = this.data.announcements.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.data.announcements.splice(index, 1);
    this.save();
    return true;
  }

  // --- Audit Logs ---
  createAuditLog(
    entryOrUserId: Omit<AuditLog, 'id' | 'createdAt'> | string,
    action?: any,
    entityType?: any,
    entityId?: string,
    details?: string,
    previousValue?: any,
    newValue?: any
  ): AuditLog {
    if (!this.data.auditLogs) this.data.auditLogs = [];

    let entry: Omit<AuditLog, 'id' | 'createdAt'>;

    if (typeof entryOrUserId === 'object') {
      entry = entryOrUserId;
    } else {
      const user = this.data.users.find((u) => u.id === entryOrUserId);
      entry = {
        userId: entryOrUserId,
        userName: user?.fullName || 'Staff Administrator',
        userRole: user?.role || 'ADMIN',
        action: action || 'ACTION',
        entityType: entityType || 'SYSTEM',
        entityId: entityId || '',
        details: details || '',
        previousValue: previousValue ? (typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue)) : null,
        newValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
      };
    }

    const newLog: AuditLog = {
      ...entry,
      id: generateId('log'),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
    return newLog;
  }

  getAuditLogs(filters?: { action?: string; entityType?: string; userId?: string; limit?: number }): AuditLog[] {
    let list = this.data.auditLogs || [];
    if (filters?.action && filters.action !== 'all') {
      list = list.filter((l) => l.action === filters.action);
    }
    if (filters?.entityType && filters.entityType !== 'all') {
      list = list.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.userId && filters.userId !== 'all') {
      list = list.filter((l) => l.userId === filters.userId);
    }
    const limit = filters?.limit || 100;
    return list.slice(0, limit);
  }

  // --- Notifications ---
  createNotification(entry: any): AppNotification {
    if (!this.data.notifications) this.data.notifications = [];
    const notif: AppNotification = {
      id: generateId('notif'),
      userId: entry.userId || entry.targetAudience || 'ALL_MEMBERS',
      title: entry.title,
      message: entry.message,
      notificationType: entry.notificationType || entry.type || 'ANNOUNCEMENT_NEW',
      type: entry.type || entry.notificationType || 'ANNOUNCEMENT',
      category: entry.category || 'Announcements',
      relatedRecordId: entry.relatedRecordId || entry.link || null,
      relatedRecordType: entry.relatedRecordType || null,
      readStatus: false,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: entry.linkUrl || entry.link || null,
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  getUserNotifications(userId: string): AppNotification[] {
    if (!this.data.notifications) return [];
    return this.data.notifications
      .filter((n) => n.userId === userId || n.userId === 'ALL_MEMBERS')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAdminNotifications(): AppNotification[] {
    if (!this.data.notifications) return [];
    return this.data.notifications
      .filter((n) => n.userId === 'ADMIN_GROUP' || n.category === 'System')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationRead(notificationId: string, userId: string): boolean {
    if (!this.data.notifications) return false;
    const item = this.data.notifications.find((n) => n.id === notificationId && (n.userId === userId || n.userId === 'ADMIN_GROUP' || n.userId === 'ALL_MEMBERS'));
    if (!item) return false;
    item.readStatus = true;
    this.save();
    return true;
  }

  markAllNotificationsRead(userId: string, isAdminGroup: boolean = false): boolean {
    if (!this.data.notifications) return false;
    let changed = false;
    for (const n of this.data.notifications) {
      if (isAdminGroup ? (n.userId === 'ADMIN_GROUP' || n.category === 'System') : (n.userId === userId || n.userId === 'ALL_MEMBERS')) {
        if (!n.readStatus) {
          n.readStatus = true;
          changed = true;
        }
      }
    }
    if (changed) this.save();
    return true;
  }

  getUnreadNotificationCount(userId: string, isAdmin: boolean = false): { memberUnread: number; adminUnread: number } {
    if (!this.data.notifications) return { memberUnread: 0, adminUnread: 0 };
    const memberUnread = this.data.notifications.filter(
      (n) => (n.userId === userId || n.userId === 'ALL_MEMBERS') && !n.readStatus
    ).length;
    const adminUnread = isAdmin
      ? this.data.notifications.filter((n) => (n.userId === 'ADMIN_GROUP' || n.category === 'System') && !n.readStatus).length
      : 0;
    return { memberUnread, adminUnread };
  }

  // --- Event Reminder Settings ---
  getEventReminderSettings(): EventReminderSettings {
    return this.data.eventReminderSettings || { reminder24hEnabled: true, reminder2hEnabled: true };
  }

  updateEventReminderSettings(settings: Partial<EventReminderSettings>): EventReminderSettings {
    this.data.eventReminderSettings = {
      ...this.getEventReminderSettings(),
      ...settings,
    };
    this.save();
    return this.data.eventReminderSettings;
  }

  // --- Check-in System with QR Code ---
  validateTicket(lookupStr: string): {
    success: boolean;
    message: string;
    ticket?: EventTicket;
    registration?: EventRegistration;
    attendee?: User;
    event?: ChurchEvent;
    alreadyCheckedIn?: boolean;
    duplicateWarning?: boolean;
    reason?: string;
    checkinRecord?: EventCheckin;
  } {
    const cleanLookup = lookupStr.trim();
    if (!cleanLookup) {
      return { success: false, message: 'Please provide a ticket number or QR Code token.' };
    }

    const tickets = this.data.eventTickets || [];
    const regs = this.data.eventRegistrations || [];

    // Search by ticketNumber, qrCodeToken, or registrationNumber
    let ticket = tickets.find(
      (t) =>
        t.ticketNumber.toUpperCase() === cleanLookup.toUpperCase() ||
        t.qrCodeToken === cleanLookup ||
        t.id === cleanLookup
    );

    let registration: EventRegistration | undefined;

    if (ticket) {
      registration = regs.find((r) => r.id === ticket!.registrationId);
    } else {
      // Lookup by registration number directly
      registration = regs.find(
        (r) =>
          r.registrationNumber.toUpperCase() === cleanLookup.toUpperCase() ||
          r.id === cleanLookup
      );
      if (registration) {
        ticket = tickets.find((t) => t.registrationId === registration!.id);
      }
    }

    if (!registration) {
      return { success: false, message: 'Ticket / Registration not found. Please verify the code.' };
    }

    const event = this.data.events.find((e) => e.id === registration!.eventId);
    const attendee = this.data.users.find((u) => u.id === registration!.userId);

    // Validation rules
    if (registration.registrationStatus === 'CANCELLED') {
      return {
        success: false,
        message: 'This registration has been cancelled and cannot be used for admission.',
        registration,
        attendee,
        event,
      };
    }

    if (registration.isPaidEvent) {
      if (registration.paymentStatus !== 'Confirmed') {
        return {
          success: false,
          message: `Payment not confirmed. Current status: ${registration.paymentStatus}. Payment must be approved before admission.`,
          registration,
          attendee,
          event,
        };
      }
    }

    if (ticket && ticket.ticketStatus !== 'VALID') {
      return {
        success: false,
        message: `This ticket has status '${ticket.ticketStatus}' and cannot be used for admission.`,
        ticket,
        registration,
        attendee,
        event,
      };
    }

    // Check if already checked in
    const checkinRecord = (this.data.eventCheckins || []).find(
      (c) =>
        c.registrationId === registration!.id ||
        (ticket && c.ticketId === ticket.id)
    );

    if (checkinRecord || registration.checkInStatus === 'CHECKED_IN' || (ticket && ticket.checkInStatus === 'CHECKED_IN')) {
      return {
        success: false,
        alreadyCheckedIn: true,
        duplicateWarning: true,
        reason: 'ALREADY_CHECKED_IN',
        message: `ALREADY CHECKED IN: This ticket was already admitted on ${new Date(checkinRecord?.checkedInAt || registration.checkInAt || '').toLocaleString('en-IE')}.`,
        ticket,
        registration,
        attendee,
        event,
        checkinRecord,
      };
    }

    return {
      success: true,
      message: 'Ticket valid! Ready for entry confirmation.',
      ticket,
      registration,
      attendee,
      event,
    };
  }

  performCheckin(
    lookupStr: string,
    adminUserId: string
  ): {
    success: boolean;
    message: string;
    alreadyCheckedIn?: boolean;
    duplicateWarning?: boolean;
    reason?: string;
    checkin?: EventCheckin;
    ticket?: EventTicket;
    registration?: EventRegistration;
  } {
    const validation = this.validateTicket(lookupStr);
    if (!validation.success) {
      return {
        success: false,
        message: validation.message,
        ticket: validation.ticket,
        registration: validation.registration,
        alreadyCheckedIn: validation.alreadyCheckedIn,
        duplicateWarning: Boolean(validation.alreadyCheckedIn),
        reason: validation.alreadyCheckedIn ? 'ALREADY_CHECKED_IN' : undefined,
      };
    }

    const { registration, ticket, attendee, event } = validation;
    const admin = this.data.users.find((u) => u.id === adminUserId);
    const nowIso = new Date().toISOString();

    if (!this.data.eventCheckins) this.data.eventCheckins = [];

    const newCheckin: EventCheckin = {
      id: generateId('chk'),
      eventId: registration!.eventId,
      registrationId: registration!.id,
      ticketId: ticket?.id || registration!.id,
      ticketNumber: ticket?.ticketNumber || registration!.registrationNumber,
      attendeeName: attendee?.fullName || 'Attendee',
      attendeeEmail: attendee?.email || '',
      checkedInBy: adminUserId,
      checkedInByName: admin?.fullName || 'Staff Administrator',
      checkedInAt: nowIso,
      status: 'CHECKED_IN',
    };

    this.data.eventCheckins.push(newCheckin);

    // Update registration & ticket in database
    registration!.checkInStatus = 'CHECKED_IN';
    registration!.checkInAt = nowIso;
    registration!.checkedInBy = admin?.fullName || 'Staff';

    if (ticket) {
      ticket.checkInStatus = 'CHECKED_IN';
      ticket.checkInAt = nowIso;
      ticket.checkedInBy = admin?.fullName || 'Staff';
    }

    // Record audit log
    this.createAuditLog({
      userId: adminUserId,
      userName: admin?.fullName || 'Staff Administrator',
      userRole: admin?.role || 'ADMIN',
      action: 'CHECKIN_RECORD',
      entityType: 'CHECKIN',
      entityId: newCheckin.id,
      details: `Admitted ${attendee?.fullName} (Ticket: ${newCheckin.ticketNumber}) for event '${event?.title}'.`,
    });

    this.save();
    return {
      success: true,
      message: `Admission confirmed for ${attendee?.fullName}!`,
      checkin: newCheckin,
      ticket,
      registration,
    };
  }

  getEventCheckinStats(eventId: string): EventCheckinStats {
    const regs = (this.data.eventRegistrations || []).filter(
      (r) =>
        r.eventId === eventId &&
        r.registrationStatus === 'CONFIRMED' &&
        (!r.isPaidEvent || r.paymentStatus === 'Confirmed')
    );

    const totalConfirmed = regs.length;
    const checkins = (this.data.eventCheckins || []).filter((c) => c.eventId === eventId);
    const totalPresent = checkins.length;
    const totalAbsent = Math.max(0, totalConfirmed - totalPresent);
    const attendanceRate = totalConfirmed > 0 ? Math.round((totalPresent / totalConfirmed) * 100) : 0;

    return {
      totalConfirmed,
      totalExpected: totalConfirmed,
      totalPresent,
      totalCheckedIn: totalPresent,
      totalAbsent,
      attendanceRate,
      checkins: [...checkins].sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()),
    };
  }

  getEventAttendeesDetailed(eventId: string) {
    const regs = (this.data.eventRegistrations || []).filter((r) => r.eventId === eventId);
    const users = this.data.users || [];
    const tickets = this.data.eventTickets || [];
    const checkins = this.data.eventCheckins || [];

    return regs.map((r) => {
      const user = users.find((u) => u.id === r.userId) || {
        id: r.userId,
        fullName: 'Unknown Member',
        email: 'unknown@example.com',
        countryOfOrigin: 'Ireland',
        role: 'MEMBER' as UserRole,
        accountStatus: 'ACTIVE' as const,
        createdAt: r.createdAt,
      };
      const ticket = tickets.find((t) => t.registrationId === r.id);
      const checkin = checkins.find((c) => c.registrationId === r.id);

      return {
        ...r,
        user,
        ticket,
        checkin,
        checkInStatus: checkin ? ('CHECKED_IN' as const) : ('NOT_CHECKED_IN' as const),
      };
    });
  }

  getEventOperationalSummary(eventId: string) {
    const evt = this.data.events.find((e) => e.id === eventId);
    if (!evt) return null;

    const attendees = this.getEventAttendeesDetailed(eventId);
    const totalRegistrations = attendees.length;
    const confirmedParticipants = attendees.filter(
      (a) => a.registrationStatus === 'CONFIRMED' && (!a.isPaidEvent || a.paymentStatus === 'Confirmed')
    ).length;
    const pendingPayments = attendees.filter(
      (a) => a.isPaidEvent && (a.paymentStatus === 'Awaiting Payment' || a.paymentStatus === 'Payment Under Review')
    ).length;
    const approvedRevenue = attendees
      .filter((a) => a.isPaidEvent && a.paymentStatus === 'Confirmed')
      .reduce((sum, a) => sum + (evt.ticketPrice || 0), 0);
    const rejectedPayments = attendees.filter(
      (a) => a.isPaidEvent && a.paymentStatus === 'Payment Rejected'
    ).length;
    const checkinStats = this.getEventCheckinStats(eventId);

    const metrics = {
      totalRegistrations,
      confirmedParticipants,
      presentCount: checkinStats.totalPresent,
      pendingPayments,
      approvedRevenue,
      rejectedPayments,
      totalPresent: checkinStats.totalPresent,
      totalAbsent: checkinStats.totalAbsent,
      attendanceRate: checkinStats.attendanceRate,
      capacity: evt.maximumCapacity || null,
    };

    return {
      event: evt,
      metrics,
      totalRegistrations,
      confirmedParticipants,
      pendingPayments,
      approvedRevenue,
      rejectedPayments,
      totalPresent: checkinStats.totalPresent,
      totalAbsent: checkinStats.totalAbsent,
      attendanceRate: checkinStats.attendanceRate,
    };
  }

  // --- User Roles Management ---
  updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUserId: string
  ): { success: boolean; message: string; user?: User } {
    const admin = this.data.users.find((u) => u.id === adminUserId);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only a SUPER_ADMIN can grant or modify administrative roles.' };
    }

    const target = this.data.users.find((u) => u.id === targetUserId);
    if (!target) {
      return { success: false, message: 'User not found.' };
    }

    if (target.id === adminUserId && newRole !== 'SUPER_ADMIN') {
      return { success: false, message: 'You cannot demote yourself from SUPER_ADMIN.' };
    }

    const oldRole = target.role;
    target.role = newRole;

    this.createAuditLog({
      userId: adminUserId,
      userName: admin.fullName,
      userRole: admin.role,
      action: 'USER_ROLE_CHANGE',
      entityType: 'USER_ROLE',
      entityId: targetUserId,
      details: `Changed role of ${target.fullName} (${target.email}) from ${oldRole} to ${newRole}.`,
      previousValue: oldRole,
      newValue: newRole,
    });

    this.save();
    return { success: true, message: `Role updated to ${newRole} for ${target.fullName}.`, user: target };
  }

  // --- Reports & Analytics Engine (Powered strictly by actual database data) ---
  private filterByDateRange<T extends { createdAt: string }>(items: T[], filter: ReportFilter): T[] {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (filter.period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = filter.startDate ? new Date(filter.startDate) : new Date(0);
        endDate = filter.endDate ? new Date(filter.endDate) : new Date();
        break;
      default:
        startDate = new Date(0);
    }

    return items.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  getMembersReport(filter: ReportFilter) {
    const allUsers = this.data.users || [];
    const filteredUsers = this.filterByDateRange(allUsers, filter);

    // Country distribution
    const countryMap: Record<string, number> = {};
    for (const u of allUsers) {
      const c = u.countryOfOrigin || 'Other';
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    const countryDistribution = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly signups (past 6 months)
    const monthsMap: Record<string, number> = {};
    for (const u of allUsers) {
      const key = u.createdAt.slice(0, 7); // YYYY-MM
      monthsMap[key] = (monthsMap[key] || 0) + 1;
    }
    const sortedMonthKeys = Object.keys(monthsMap).sort();
    let cumulative = 0;
    const monthlyGrowth = sortedMonthKeys.map((month) => {
      const count = monthsMap[month];
      cumulative += count;
      const dateObj = new Date(`${month}-01T00:00:00Z`);
      const label = dateObj.toLocaleDateString('en-IE', { month: 'short', year: 'numeric' });
      return { month, label, count, cumulative };
    });

    const summary = {
      totalUsersCount: allUsers.length,
      newRegistrationsCount: filteredUsers.length,
      activeAccountsCount: allUsers.filter((u) => u.accountStatus === 'ACTIVE').length,
      disabledAccountsCount: allUsers.filter((u) => u.accountStatus === 'DISABLED').length,
    };

    return {
      period: filter.period,
      summary,
      totalRegisteredAppUsers: allUsers.length,
      newRegistrationsInPeriod: filteredUsers.length,
      activeAccountsCount: allUsers.filter((u) => u.accountStatus === 'ACTIVE').length,
      disabledAccountsCount: allUsers.filter((u) => u.accountStatus === 'DISABLED').length,
      countryDistribution,
      monthlyGrowth,
      membersList: filteredUsers.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        countryOfOrigin: u.countryOfOrigin,
        role: u.role,
        accountStatus: u.accountStatus,
        createdAt: u.createdAt,
      })),
    };
  }

  getEventsReport(filter: ReportFilter) {
    const events = this.data.events || [];
    const regs = this.data.eventRegistrations || [];
    const checkins = this.data.eventCheckins || [];
    const now = new Date();

    const upcomingEvents = events.filter((e) => new Date(e.startDate) >= new Date(now.toISOString().slice(0, 10)));
    const pastEvents = events.filter((e) => new Date(e.startDate) < new Date(now.toISOString().slice(0, 10)));

    // Event attendance rankings
    const eventStatsList = events.map((evt) => {
      const evtRegs = regs.filter((r) => r.eventId === evt.id && r.registrationStatus === 'CONFIRMED');
      const evtCheckins = checkins.filter((c) => c.eventId === evt.id);
      const rate = evtRegs.length > 0 ? Math.round((evtCheckins.length / evtRegs.length) * 100) : 0;
      return {
        id: evt.id,
        title: evt.title,
        startDate: evt.startDate,
        category: evt.category,
        isPaid: evt.isPaid,
        ticketPrice: evt.ticketPrice || 0,
        registeredCount: evtRegs.length,
        checkedInCount: evtCheckins.length,
        attendanceRate: rate,
      };
    }).sort((a, b) => b.registeredCount - a.registeredCount);

    const totalRegistrations = regs.filter((r) => r.registrationStatus === 'CONFIRMED').length;
    const totalCheckins = checkins.length;
    const overallAttendanceRate = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

    const summary = {
      totalEventsCount: events.length,
      upcomingEventsCount: upcomingEvents.length,
      pastEventsCount: pastEvents.length,
      totalRegistrations,
      totalCheckins,
      overallAttendanceRate,
    };

    return {
      period: filter.period,
      summary,
      totalEvents: events.length,
      upcomingEventsCount: upcomingEvents.length,
      pastEventsCount: pastEvents.length,
      totalRegistrations,
      totalCheckins,
      overallAttendanceRate,
      topAttendedEvents: eventStatsList.slice(0, 5),
      allEventsStats: eventStatsList,
    };
  }

  getFinancialReport(filter: ReportFilter) {
    const allContribs = this.data.contributions || [];
    const filteredContribs = this.filterByDateRange(allContribs, filter);

    // Tithes (Approved only for revenue)
    const approvedTithes = filteredContribs.filter((c) => c.contributionType === 'Tithe' && c.status === 'Approved');
    const totalApprovedTithes = approvedTithes.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const avgTithe = approvedTithes.length > 0 ? totalApprovedTithes / approvedTithes.length : 0;

    // Offerings (Approved only for revenue)
    const approvedOfferings = filteredContribs.filter((c) => c.contributionType === 'Offering' && c.status === 'Approved');
    const totalApprovedOfferings = approvedOfferings.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const avgOffering = approvedOfferings.length > 0 ? totalApprovedOfferings / approvedOfferings.length : 0;

    // Monthly evolution of approved contributions
    const monthlyFinancialMap: Record<string, { tithes: number; offerings: number; count: number }> = {};
    for (const c of allContribs.filter((c) => c.status === 'Approved')) {
      const month = c.transferDate ? c.transferDate.slice(0, 7) : c.createdAt.slice(0, 7);
      if (!monthlyFinancialMap[month]) {
        monthlyFinancialMap[month] = { tithes: 0, offerings: 0, count: 0 };
      }
      if (c.contributionType === 'Tithe') {
        monthlyFinancialMap[month].tithes += Number(c.amount || 0);
      } else {
        monthlyFinancialMap[month].offerings += Number(c.amount || 0);
      }
      monthlyFinancialMap[month].count += 1;
    }

    const monthlyFinancialEvolution = Object.keys(monthlyFinancialMap).sort().map((month) => {
      const dateObj = new Date(`${month}-01T00:00:00Z`);
      const label = dateObj.toLocaleDateString('en-IE', { month: 'short', year: 'numeric' });
      return {
        month,
        label,
        ...monthlyFinancialMap[month],
        total: monthlyFinancialMap[month].tithes + monthlyFinancialMap[month].offerings,
      };
    });

    // Event payments
    const paidRegistrations = (this.data.eventRegistrations || []).filter((r) => r.isPaidEvent);
    const confirmedEventPayments = paidRegistrations.filter((r) => r.paymentStatus === 'Confirmed');
    const pendingEventPayments = paidRegistrations.filter(
      (r) => r.paymentStatus === 'Awaiting Payment' || r.paymentStatus === 'Payment Under Review'
    );
    const rejectedEventPayments = paidRegistrations.filter((r) => r.paymentStatus === 'Payment Rejected');

    // Revenue by event
    const eventRevenueMap: Record<string, { eventId: string; title: string; price: number; confirmedRevenue: number; paidCount: number; pendingCount: number }> = {};
    for (const r of paidRegistrations) {
      const evt = this.data.events.find((e) => e.id === r.eventId);
      const price = evt?.ticketPrice || 0;
      if (!eventRevenueMap[r.eventId]) {
        eventRevenueMap[r.eventId] = {
          eventId: r.eventId,
          title: evt?.title || 'Paid Event',
          price,
          confirmedRevenue: 0,
          paidCount: 0,
          pendingCount: 0,
        };
      }
      if (r.paymentStatus === 'Confirmed') {
        eventRevenueMap[r.eventId].confirmedRevenue += price;
        eventRevenueMap[r.eventId].paidCount += 1;
      } else if (r.paymentStatus === 'Awaiting Payment' || r.paymentStatus === 'Payment Under Review') {
        eventRevenueMap[r.eventId].pendingCount += 1;
      }
    }

    const totalApprovedEventPayments = confirmedEventPayments.reduce((sum, r) => {
      const evt = this.data.events.find((e) => e.id === r.eventId);
      return sum + (evt?.ticketPrice || 0);
    }, 0);

    const pendingReviewContribs = filteredContribs.filter((c) => c.status === 'Submitted' || c.status === 'Under Review');
    const pendingContributionsAmount = pendingReviewContribs.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    return {
      period: filter.period,
      tithes: {
        totalApproved: totalApprovedTithes,
        contributionsCount: approvedTithes.length,
        averageAmount: avgTithe,
      },
      offerings: {
        totalApproved: totalApprovedOfferings,
        contributionsCount: approvedOfferings.length,
        averageAmount: avgOffering,
      },
      eventPayments: {
        totalApprovedRevenue: totalApprovedEventPayments,
        confirmedPaidTicketsCount: confirmedEventPayments.length,
        pendingTicketsCount: pendingEventPayments.length,
        rejectedTicketsCount: rejectedEventPayments.length,
        byEvent: Object.values(eventRevenueMap),
      },
      totalApprovedRevenue: totalApprovedTithes + totalApprovedOfferings + totalApprovedEventPayments,
      pendingSeparation: {
        pendingContributionsCount: pendingReviewContribs.length,
        pendingContributionsAmount,
        pendingEventPaymentsCount: pendingEventPayments.length,
        notice: 'Pending amounts are strictly reported separately from confirmed received revenues.',
      },
      pendingAmounts: {
        pendingContributionsCount: pendingReviewContribs.length,
        pendingContributionsAmount,
        pendingEventPaymentsCount: pendingEventPayments.length,
        notice: 'Pending amounts are strictly reported separately from confirmed received revenues.',
      },
      monthlyFinancialEvolution,
    };
  }

  // --- Admin Overview (Unified modern dashboard) ---
  getAdminOverview() {
    const totalUsers = this.data.users.length;
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newUsersThisMonth = this.data.users.filter((u) => u.createdAt.slice(0, 7) === currentMonthKey).length;
    const newUsersLast7Days = this.data.users.filter((u) => new Date(u.createdAt) >= sevenDaysAgo).length;

    // Country distribution
    const countryMap: Record<string, number> = {};
    for (const u of this.data.users) {
      const c = u.countryOfOrigin || 'Ireland';
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    const countryDistribution = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly signups
    const monthsMap: Record<string, number> = {};
    for (const u of this.data.users) {
      const key = u.createdAt.slice(0, 7);
      monthsMap[key] = (monthsMap[key] || 0) + 1;
    }
    let cumulative = 0;
    const monthlySignups = Object.keys(monthsMap).sort().map((m) => {
      const c = monthsMap[m];
      cumulative += c;
      const d = new Date(`${m}-01T00:00:00Z`);
      return {
        month: m,
        label: d.toLocaleDateString('en-IE', { month: 'short', year: 'numeric' }),
        count: c,
        cumulative,
      };
    });

    // Events Overview
    const allEvents = this.data.events || [];
    const totalEvents = allEvents.filter((e) => e.status === 'Published').length;
    const upcomingEvents = allEvents.filter(
      (e) => e.status === 'Published' && new Date(e.startDate) >= new Date(now.toISOString().slice(0, 10))
    );
    const finishedEvents = allEvents.filter(
      (e) => e.status === 'Finished' || (e.status === 'Published' && new Date(e.startDate) < new Date(now.toISOString().slice(0, 10)))
    );
    const cancelledEvents = allEvents.filter((e) => e.status === 'Cancelled');

    const regs = this.data.eventRegistrations || [];
    const totalRegistrations = regs.filter((r) => r.registrationStatus === 'CONFIRMED').length;
    const confirmedParticipants = regs.filter(
      (r) => r.registrationStatus === 'CONFIRMED' && (!r.isPaidEvent || r.paymentStatus === 'Confirmed')
    ).length;
    const pendingPaymentsCount = regs.filter(
      (r) => r.isPaidEvent && r.paymentStatus === 'Awaiting Payment'
    ).length;
    const awaitingProofAnalysisCount = regs.filter(
      (r) => r.isPaidEvent && r.paymentStatus === 'Payment Under Review'
    ).length;

    // Upcoming events table for dashboard
    const upcomingEventsTable = upcomingEvents.slice(0, 5).map((evt) => {
      const evtRegs = regs.filter((r) => r.eventId === evt.id && r.registrationStatus === 'CONFIRMED');
      const evtConfirmed = evtRegs.filter((r) => !evt.isPaid || r.paymentStatus === 'Confirmed').length;
      const evtPending = evtRegs.filter((r) => evt.isPaid && (r.paymentStatus === 'Awaiting Payment' || r.paymentStatus === 'Payment Under Review')).length;
      const availableSpots = evt.maximumCapacity ? Math.max(0, evt.maximumCapacity - evtRegs.length) : null;
      return {
        id: evt.id,
        title: evt.title,
        startDate: evt.startDate,
        startTime: evt.startTime,
        location: evt.location,
        totalRegistrations: evtRegs.length,
        confirmedParticipants: evtConfirmed,
        pendingPayments: evtPending,
        availableSpots,
      };
    });

    // Financial Overview (Approved vs Pending strictly separate)
    const contributions = this.data.contributions || [];
    const approvedTithes = contributions.filter((c) => c.contributionType === 'Tithe' && c.status === 'Approved');
    const approvedOfferings = contributions.filter((c) => c.contributionType === 'Offering' && c.status === 'Approved');

    const totalApprovedTithes = approvedTithes.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalApprovedOfferings = approvedOfferings.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const paidRegs = regs.filter((r) => r.isPaidEvent);
    const confirmedPaidRegs = paidRegs.filter((r) => r.paymentStatus === 'Confirmed');
    const totalApprovedEventPayments = confirmedPaidRegs.reduce((sum, r) => {
      const evt = allEvents.find((e) => e.id === r.eventId);
      return sum + (evt?.ticketPrice || 0);
    }, 0);

    // Event payments by event
    const eventPaymentsMap: Record<string, { eventId: string; title: string; approvedRevenue: number; paidCount: number }> = {};
    for (const r of confirmedPaidRegs) {
      const evt = allEvents.find((e) => e.id === r.eventId);
      if (!eventPaymentsMap[r.eventId]) {
        eventPaymentsMap[r.eventId] = {
          eventId: r.eventId,
          title: evt?.title || 'Event',
          approvedRevenue: 0,
          paidCount: 0,
        };
      }
      eventPaymentsMap[r.eventId].approvedRevenue += evt?.ticketPrice || 0;
      eventPaymentsMap[r.eventId].paidCount += 1;
    }

    const pendingContributions = contributions.filter((c) => c.status === 'Submitted' || c.status === 'Under Review');
    const pendingContributionsTotal = pendingContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const totalTicketsCount = (this.data.eventTickets || []).filter((t) => t.ticketStatus === 'VALID').length;

    return {
      membersOverview: {
        totalUsers,
        newUsersThisMonth,
        newUsersLast7Days,
        countryDistribution,
        monthlySignups,
      },
      eventsOverview: {
        totalEvents,
        upcomingEventsCount: upcomingEvents.length,
        finishedEventsCount: finishedEvents.length,
        cancelledEventsCount: cancelledEvents.length,
        totalRegistrations,
        confirmedParticipants,
        pendingPaymentsCount,
        awaitingProofAnalysisCount,
        upcomingEventsTable,
      },
      financialOverview: {
        tithes: {
          approvedTotal: totalApprovedTithes,
          count: approvedTithes.length,
        },
        offerings: {
          approvedTotal: totalApprovedOfferings,
          count: approvedOfferings.length,
        },
        eventPayments: {
          approvedTotal: totalApprovedEventPayments,
          confirmedCount: confirmedPaidRegs.length,
          byEvent: Object.values(eventPaymentsMap),
        },
        pendingReview: {
          proofsAwaitingReview: awaitingProofAnalysisCount + contributions.filter((c) => c.status === 'Under Review').length,
          pendingContributionsCount: pendingContributions.length,
          pendingContributionsAmount: pendingContributionsTotal,
          pendingPaymentsCount: pendingPaymentsCount + awaitingProofAnalysisCount,
        },
      },
      // Flat compatibility properties
      totalUsers,
      totalEvents,
      upcomingEventsCount: upcomingEvents.length,
      totalRegistrations,
      totalContributionsCount: contributions.length,
      approvedContributionsTotal: totalApprovedTithes + totalApprovedOfferings,
      pendingContributionsCount: pendingContributions.length,
      pendingEventPaymentsCount: awaitingProofAnalysisCount,
      totalTicketsCount,
    };
  }
}

export const db = new Database();
