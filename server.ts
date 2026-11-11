import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with generous limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth middleware helper
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EVENT_MANAGER' | 'FINANCE_MANAGER' | 'MEMBER';
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = db.validateToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  const user = db.getUserById(session.userId);
  if (!user || user.accountStatus === 'DISABLED') {
    return res.status(403).json({ error: 'Account is disabled or does not exist' });
  }

  req.user = { id: session.userId, role: user.role as any };
  next();
}

function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const session = db.validateToken(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user && user.accountStatus !== 'DISABLED') {
        req.user = { id: session.userId, role: user.role as any };
      }
    }
  }
  next();
}

// RBAC Permissions
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'FINANCE_MANAGER'];

function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Administrative or operational staff access required.' });
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  next();
}

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Administrator access required to modify user roles.' });
  }
  next();
}

function requireEventStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Event management access required.' });
  }
  next();
}

function requireFinanceStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Finance management access required.' });
  }
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// --- Auth Endpoints ---

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, password, countryOfOrigin } = req.body;

  if (!fullName || !email || !password || !countryOfOrigin) {
    return res.status(400).json({ error: 'All fields (name, email, password, country) are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Security rule: public registration ALWAYS creates MEMBER
  const newUser = db.createUser({
    fullName,
    email,
    password,
    countryOfOrigin,
    role: 'MEMBER',
  });

  // Operational notification to admin
  db.createNotification({
    title: 'New Member Registered',
    message: `${newUser.fullName} (${newUser.countryOfOrigin}) created a new account.`,
    type: 'ADMIN_ALERT',
    targetAudience: 'ALL_ADMINS',
    link: '/admin',
  });

  const token = db.createSessionToken(newUser.id, newUser.role);
  return res.status(201).json({
    user: newUser,
    token,
    message: 'Account created successfully!',
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.validateCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.accountStatus === 'DISABLED') {
    return res.status(403).json({ error: 'This account has been disabled. Please contact church administration.' });
  }

  const token = db.createSessionToken(user.id, user.role);
  return res.json({
    user,
    token,
    message: 'Signed in successfully!',
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    db.revokeToken(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { fullName, countryOfOrigin, profilePhoto } = req.body;
  const updated = db.updateUserProfile(req.user!.id, {
    fullName,
    countryOfOrigin,
    profilePhoto,
  });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user: updated, message: 'Profile updated successfully.' });
});

// PUT /api/auth/change-password
app.put('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const success = db.changePassword(req.user!.id, oldPassword, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }
  return res.json({ success: true, message: 'Password updated successfully.' });
});

// DELETE /api/auth/account
app.delete('/api/auth/account', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const token = extractToken(req);
  if (token) db.revokeToken(token);
  db.deleteUser(userId);
  return res.json({ success: true, message: 'Account deleted successfully.' });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    // Return friendly generic response to avoid user enumeration
    return res.json({ success: true, message: 'If an account exists, a recovery code has been generated.' });
  }
  const code = db.createPasswordReset(email);
  return res.json({
    success: true,
    message: 'Password reset code generated.',
    // Returning code for easy verification in development/testing
    demoResetCode: code,
  });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { resetCode, newPassword } = req.body;
  if (!resetCode || !newPassword) {
    return res.status(400).json({ error: 'Reset code and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const success = db.resetPasswordWithToken(resetCode, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired recovery code.' });
  }
  return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// POST /api/auth/bootstrap-admin (Secure mechanism for church administration)
app.post('/api/auth/bootstrap-admin', (req: Request, res: Response) => {
  const { secretKey, email } = req.body;
  if (!secretKey || !email) {
    return res.status(400).json({ error: 'Secret bootstrap key and email are required.' });
  }

  const success = db.bootstrapAdmin(secretKey, email);
  if (!success) {
    return res.status(403).json({ error: 'Invalid church bootstrap key or email not found.' });
  }
  return res.json({ success: true, message: 'Administrator role successfully configured!' });
});

// --- Church Profile Endpoints ---

// GET /api/church
app.get('/api/church', (_req: Request, res: Response) => {
  const profile = db.getChurchProfile();
  return res.json(profile);
});

// PUT /api/church (Admin only)
app.put('/api/church', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateChurchProfile(req.body);
  return res.json({ profile: updated, message: 'Church profile updated successfully.' });
});

// --- Service Times Endpoints ---

// GET /api/services
app.get('/api/services', (_req: Request, res: Response) => {
  const services = db.getServiceSchedules();
  return res.json(services);
});

// POST /api/services (Admin only)
app.post('/api/services', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { serviceName, dayOfWeek, startTime, endTime, mainLanguage, location } = req.body;
  if (!serviceName || !dayOfWeek || !startTime || !endTime || !mainLanguage || !location) {
    return res.status(400).json({ error: 'Required service fields are missing.' });
  }
  const created = db.createServiceSchedule(req.body);
  return res.status(201).json(created);
});

// PUT /api/services/:id (Admin only)
app.put('/api/services/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateServiceSchedule(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Service schedule not found' });
  }
  return res.json(updated);
});

// DELETE /api/services/:id (Admin only)
app.delete('/api/services/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteServiceSchedule(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Service schedule not found' });
  }
  return res.json({ success: true, message: 'Service removed.' });
});

// --- Events Endpoints ---

// GET /api/events
app.get('/api/events', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role || 'MEMBER';
  const events = db.getEvents(role);
  return res.json(events);
});

// GET /api/events/:id
app.get('/api/events/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const event = db.getEventById(req.params.id, req.user?.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  return res.json(event);
});

// POST /api/events (Event staff)
app.post('/api/events', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, startDate, startTime, location, address } = req.body;
  if (!title || !category || !startDate || !startTime || !location || !address) {
    return res.status(400).json({ error: 'Missing required event fields.' });
  }

  const newEvent = db.createEvent({
    ...req.body,
    currency: 'EUR',
    createdBy: req.user!.id,
    status: req.body.status || 'Published',
  });

  db.createAuditLog(
    req.user!.id,
    'EVENT_CREATE',
    'Event',
    newEvent.id,
    `Created event: ${newEvent.title}`,
    null,
    { title: newEvent.title, date: newEvent.startDate, capacity: newEvent.maximumCapacity }
  );

  // Send notification to all members about new event
  db.createNotification({
    title: `New Church Event: ${newEvent.title}`,
    message: `Join us on ${newEvent.startDate} at ${newEvent.location}. Registrations are open!`,
    type: 'EVENT_UPDATE',
    targetAudience: 'ALL_MEMBERS',
    link: '/events',
  });

  return res.status(201).json(newEvent);
});

// PUT /api/events/:id (Event staff)
app.put('/api/events/:id', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const before = db.getEventById(req.params.id);
  const updated = db.updateEvent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.createAuditLog(
    req.user!.id,
    'EVENT_UPDATE',
    'Event',
    updated.id,
    `Updated event: ${updated.title}`,
    before,
    updated
  );

  return res.json(updated);
});

// DELETE /api/events/:id (Event staff)
app.delete('/api/events/:id', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const before = db.getEventById(req.params.id);
  const success = db.deleteEvent(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.createAuditLog(
    req.user!.id,
    'EVENT_CANCEL',
    'Event',
    req.params.id,
    `Deleted/cancelled event: ${before?.title || req.params.id}`,
    before,
    null
  );

  return res.json({ success: true, message: 'Event deleted.' });
});

// POST /api/events/:id/register (Confirm attendance - Free events)
app.post('/api/events/:id/register', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const result = db.registerForEvent(req.params.id, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message, registration: result.registration });
  }

  const event = db.getEventById(req.params.id);
  db.createNotification({
    userId: req.user!.id,
    title: 'Registration Confirmed',
    message: `Your spot for ${event?.title || 'the event'} has been confirmed!`,
    type: 'REGISTRATION_CONFIRMATION',
    targetAudience: 'INDIVIDUAL',
    link: '/events',
  });

  // Admin notification & capacity check
  db.createNotification({
    title: 'New Event Registration',
    message: `A member registered for "${event?.title || 'an event'}".`,
    type: 'ADMIN_ALERT',
    targetAudience: 'ALL_ADMINS',
    link: '/admin',
  });

  if (event?.maximumCapacity) {
    const attendeesCount = db.getEventAttendees(event.id).length;
    if (attendeesCount >= event.maximumCapacity * 0.8) {
      db.createNotification({
        title: 'Event Capacity Alert',
        message: `"${event.title}" reached ${attendeesCount}/${event.maximumCapacity} capacity (${Math.round((attendeesCount / event.maximumCapacity) * 100)}%).`,
        type: 'CAPACITY_WARNING',
        targetAudience: 'ALL_ADMINS',
        link: '/admin',
      });
    }
  }

  return res.status(201).json(result);
});

// DELETE /api/events/:id/register (Cancel attendance)
app.delete('/api/events/:id/register', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const success = db.cancelRegistration(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'No active registration found to cancel.' });
  }
  return res.json({ success: true, message: 'Registration cancelled.' });
});

// GET /api/events/:id/attendees (Event staff)
app.get('/api/events/:id/attendees', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const attendees = db.getEventAttendees(req.params.id);
  return res.json(attendees);
});

// GET /api/registrations/my (Member's registered events)
app.get('/api/registrations/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const regs = db.getUserRegistrations(req.user!.id);
  return res.json(regs);
});

// POST /api/events/:id/reserve-ticket (Paid event reservation)
app.post('/api/events/:id/reserve-ticket', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const result = db.reservePaidEvent(req.params.id, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message, registration: result.registration });
  }
  return res.status(201).json(result);
});

// POST /api/registrations/:id/payment-proof (Member submits bank payment proof)
app.post('/api/registrations/:id/payment-proof', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { paymentProof } = req.body;
  if (!paymentProof) {
    return res.status(400).json({ error: 'Payment proof is required.' });
  }
  const result = db.submitEventPaymentProof(req.params.id, req.user!.id, paymentProof);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  db.createNotification({
    title: 'New Payment Proof Uploaded',
    message: 'A member submitted a payment receipt for event registration review.',
    type: 'ADMIN_ALERT',
    targetAudience: 'ALL_ADMINS',
    link: '/admin',
  });

  return res.json(result);
});

// GET /api/tickets/my (Member's active digital tickets)
app.get('/api/tickets/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const tickets = db.getUserTickets(req.user!.id);
  return res.json(tickets);
});

// GET /api/admin/event-payments (Finance / Staff view paid reservations)
app.get('/api/admin/event-payments', authMiddleware, requireFinanceStaff, (_req: AuthenticatedRequest, res: Response) => {
  const payments = db.getAllEventPayments();
  return res.json(payments);
});

// PUT /api/admin/event-payments/:id/review (Finance staff approves or rejects event payment)
app.put('/api/admin/event-payments/:id/review', authMiddleware, requireFinanceStaff, (req: AuthenticatedRequest, res: Response) => {
  const { status, rejectionReason } = req.body;
  if (status !== 'Confirmed' && status !== 'Payment Rejected') {
    return res.status(400).json({ error: 'Status must be Confirmed or Payment Rejected.' });
  }
  const result = db.reviewEventPayment(req.params.id, req.user!.id, status, rejectionReason);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  db.createAuditLog(
    req.user!.id,
    status === 'Confirmed' ? 'PAYMENT_APPROVE' : 'PAYMENT_REJECT',
    'EventPayment',
    req.params.id,
    `Event payment review: marked as ${status}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
    null,
    { status, rejectionReason }
  );

  const reg = db.data.eventRegistrations.find((r) => r.id === req.params.id);
  if (reg) {
    const event = db.getEventById(reg.eventId);
    db.createNotification({
      userId: reg.userId,
      title: status === 'Confirmed' ? 'Event Ticket Confirmed!' : 'Ticket Payment Issue',
      message: status === 'Confirmed'
        ? `Your payment for "${event?.title || 'the event'}" has been verified! Your digital ticket with QR code is ready.`
        : `Your payment for "${event?.title || 'the event'}" was rejected: ${rejectionReason || 'Please review your bank transfer.'}`,
      type: status === 'Confirmed' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
      targetAudience: 'INDIVIDUAL',
      link: '/events',
    });
  }

  return res.json(result);
});

// --- Check-in & Event Operations Endpoints ---

// POST /api/admin/events/:id/validate-ticket
app.post('/api/admin/events/:id/validate-ticket', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const { ticketCode, qrToken } = req.body;
  const lookup = (ticketCode || qrToken || '').trim();
  const result = db.validateTicket(lookup);

  if (result.success && req.params.id && req.params.id !== 'all' && result.registration?.eventId !== req.params.id) {
    return res.json({
      valid: false,
      success: false,
      message: `Ticket belongs to "${result.event?.title || 'another event'}", not the selected event.`,
      ticket: result.ticket,
      registration: result.registration,
      attendee: result.attendee,
      event: result.event,
    });
  }

  return res.json({
    ...result,
    valid: result.success,
    duplicateWarning: Boolean(result.alreadyCheckedIn),
    reason: result.alreadyCheckedIn ? 'ALREADY_CHECKED_IN' : undefined,
  });
});

// POST /api/admin/events/:id/check-in
app.post('/api/admin/events/:id/check-in', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const { ticketCode, qrToken } = req.body;
  const lookup = (ticketCode || qrToken || '').trim();

  // Validate event matching first if specific eventId provided
  if (req.params.id && req.params.id !== 'all') {
    const preview = db.validateTicket(lookup);
    if (preview.success && preview.registration?.eventId !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: `Ticket belongs to "${preview.event?.title || 'another event'}", not the selected event.`,
      });
    }
  }

  const result = db.performCheckin(lookup, req.user!.id);
  if (!result.success) {
    const isDup = result.message?.includes('ALREADY CHECKED IN') || Boolean(result.alreadyCheckedIn) || Boolean(result.duplicateWarning);
    return res.status(400).json({
      ...result,
      duplicateWarning: isDup,
      reason: isDup ? 'ALREADY_CHECKED_IN' : undefined,
    });
  }
  return res.json(result);
});

// GET /api/admin/events/:id/check-in-stats
app.get('/api/admin/events/:id/check-in-stats', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getEventCheckinStats(req.params.id);
  return res.json(stats);
});

// GET /api/admin/events/:id/attendees-detailed
app.get('/api/admin/events/:id/attendees-detailed', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const attendees = db.getEventAttendeesDetailed(req.params.id);
  return res.json(attendees);
});

// GET /api/admin/events/:id/details
app.get('/api/admin/events/:id/details', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const summary = db.getEventOperationalSummary(req.params.id);
  if (!summary) {
    return res.status(404).json({ error: 'Event not found.' });
  }
  return res.json(summary);
});

// GET /api/admin/events/:id/export-csv
app.get('/api/admin/events/:id/export-csv', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }
  const attendees = db.getEventAttendeesDetailed(req.params.id);

  // Build CSV with UTF-8 BOM
  const headers = ['Attendee Name', 'Email', 'Country', 'Registration Date', 'Payment Status', 'Ticket Code', 'Check-in Status', 'Checked-in At'];
  const rows = attendees.map((a: any) => [
    `"${(a.user?.fullName || a.fullName || 'Attendee').replace(/"/g, '""')}"`,
    `"${(a.user?.email || a.email || '').replace(/"/g, '""')}"`,
    `"${(a.user?.countryOfOrigin || a.countryOfOrigin || 'Ireland').replace(/"/g, '""')}"`,
    `"${a.createdAt || a.registeredAt || ''}"`,
    `"${a.paymentStatus || (a.isPaidEvent ? 'Pending' : 'Confirmed')}"`,
    `"${a.ticket?.ticketNumber || a.ticket?.ticketCode || a.registrationNumber || 'N/A'}"`,
    `"${a.checkInStatus === 'CHECKED_IN' || a.isCheckedIn ? 'PRESENT' : 'ABSENT'}"`,
    `"${a.checkin?.checkedInAt || a.checkInAt || a.checkedInAt || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `attendees_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvContent);
});

// --- Banking Settings Endpoints ---

// GET /api/banking-settings (Public or authenticated)
app.get('/api/banking-settings', (_req: Request, res: Response) => {
  const settings = db.getBankingSettings();
  return res.json(settings);
});

// PUT /api/banking-settings (Finance staff)
app.put('/api/banking-settings', authMiddleware, requireFinanceStaff, (req: AuthenticatedRequest, res: Response) => {
  const before = db.getBankingSettings();
  const updated = db.updateBankingSettings(req.body, req.user!.id);

  db.createAuditLog(
    req.user!.id,
    'BANK_SETTINGS_UPDATE',
    'BankingSettings',
    'bank_settings_default',
    'Church bank transfer details updated',
    before,
    updated
  );

  return res.json({ ...updated, settings: updated, message: 'Banking settings updated successfully.' });
});

// --- Contributions Endpoints ---

// POST /api/contributions (Member registers Tithe or Offering)
app.post('/api/contributions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { contributionType, amount, transferDate, paymentReference, paymentProof } = req.body;
  if (contributionType !== 'Tithe' && contributionType !== 'Offering') {
    return res.status(400).json({ error: 'Contribution type must be Tithe or Offering.' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive contribution amount.' });
  }

  const created = db.createContribution(req.user!.id, {
    contributionType,
    amount: numAmount,
    transferDate: transferDate || new Date().toISOString().slice(0, 10),
    paymentReference: paymentReference || '',
    paymentProof: paymentProof || null,
  });

  db.createNotification({
    title: `New ${contributionType} Registered`,
    message: `A member submitted a ${contributionType.toLowerCase()} of €${numAmount.toFixed(2)} for verification.`,
    type: 'ADMIN_ALERT',
    targetAudience: 'ALL_ADMINS',
    link: '/admin',
  });

  return res.status(201).json({
    contribution: created,
    message: 'Contribution registered successfully! Track status in My Contributions.',
  });
});

// GET /api/contributions/my (Member only gets own contributions)
app.get('/api/contributions/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const contributions = db.getUserContributions(req.user!.id);
  return res.json(contributions);
});

// GET /api/admin/contributions (Finance staff - all contributions)
app.get('/api/admin/contributions', authMiddleware, requireFinanceStaff, (_req: AuthenticatedRequest, res: Response) => {
  const allContributions = db.getAllContributions();
  return res.json(allContributions);
});

// PUT /api/admin/contributions/:id/review (Finance staff approves or rejects contribution)
app.put('/api/admin/contributions/:id/review', authMiddleware, requireFinanceStaff, (req: AuthenticatedRequest, res: Response) => {
  const { status, rejectionReason } = req.body;
  if (status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
  }

  if (status === 'Rejected' && !rejectionReason?.trim()) {
    return res.status(400).json({ error: 'A rejection reason is required when rejecting a contribution.' });
  }

  const reviewed = db.reviewContribution(req.params.id, req.user!.id, status, rejectionReason);
  if (!reviewed) {
    return res.status(404).json({ error: 'Contribution not found.' });
  }

  db.createAuditLog(
    req.user!.id,
    status === 'Approved' ? 'CONTRIBUTION_APPROVE' : 'CONTRIBUTION_REJECT',
    'Contribution',
    reviewed.id,
    `${reviewed.contributionType} marked as ${status}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
    null,
    { status, rejectionReason, amount: reviewed.amount }
  );

  db.createNotification({
    userId: reviewed.userId,
    title: status === 'Approved' ? 'Contribution Approved' : 'Contribution Issue',
    message: status === 'Approved'
      ? `Your ${reviewed.contributionType} of €${reviewed.amount.toFixed(2)} has been verified. Thank you for supporting AOGIM Dublin!`
      : `Your ${reviewed.contributionType} submission was not verified: ${rejectionReason || 'Please contact the church office.'}`,
    type: status === 'Approved' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
    targetAudience: 'INDIVIDUAL',
    link: '/giving',
  });

  return res.json({
    contribution: reviewed,
    message: `Contribution marked as ${status}.`,
  });
});

// --- Announcements Endpoints ---

// GET /api/announcements
app.get('/api/announcements', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role || 'MEMBER';
  const announcements = db.getAnnouncements(role);
  return res.json(announcements);
});

// POST /api/announcements (Staff only)
app.post('/api/announcements', authMiddleware, requireStaff, (req: AuthenticatedRequest, res: Response) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }
  const created = db.createAnnouncement({
    ...req.body,
    publicationDate: req.body.publicationDate || new Date().toISOString().slice(0, 10),
    status: req.body.status || 'PUBLISHED',
    createdBy: req.user!.id,
  });

  db.createNotification({
    title: `Announcement: ${created.title}`,
    message: created.description.slice(0, 120) + (created.description.length > 120 ? '...' : ''),
    type: 'ANNOUNCEMENT',
    targetAudience: 'ALL_MEMBERS',
    link: '/',
  });

  return res.status(201).json(created);
});

// PUT /api/announcements/:id (Staff only)
app.put('/api/announcements/:id', authMiddleware, requireStaff, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateAnnouncement(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  return res.json(updated);
});

// DELETE /api/announcements/:id (Staff only)
app.delete('/api/announcements/:id', authMiddleware, requireStaff, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteAnnouncement(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  return res.json({ success: true, message: 'Announcement deleted.' });
});

// --- Admin Overview & Members Endpoints ---

// GET /api/admin/overview (Staff)
app.get('/api/admin/overview', authMiddleware, requireStaff, (_req: AuthenticatedRequest, res: Response) => {
  const overview = db.getAdminOverview();
  return res.json(overview);
});

// GET /api/admin/members (Staff)
app.get('/api/admin/members', authMiddleware, requireStaff, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  return res.json(users);
});

// PUT /api/admin/members/:id/status (Admin only)
app.put('/api/admin/members/:id/status', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const targetId = req.params.id;

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'You cannot disable your own administrator account.' });
  }

  if (status !== 'ACTIVE' && status !== 'DISABLED') {
    return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or DISABLED.' });
  }

  const success = db.setUserStatus(targetId, status);
  if (!success) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  db.createAuditLog(
    req.user!.id,
    'ACCOUNT_STATUS_CHANGE',
    'User',
    targetId,
    `Account status updated to ${status}`,
    null,
    { status }
  );

  return res.json({ success: true, message: `Account status updated to ${status}.` });
});

// PUT /api/admin/members/:id/role (Super Admin ONLY)
app.put('/api/admin/members/:id/role', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  const targetId = req.params.id;

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'FINANCE_MANAGER', 'MEMBER'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  const result = db.updateUserRole(targetId, role as any, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  return res.json({ success: true, user: result.user, message: result.message });
});

// --- Reports Endpoints ---

// GET /api/admin/reports/members (Staff)
app.get('/api/admin/reports/members', authMiddleware, requireStaff, (req: AuthenticatedRequest, res: Response) => {
  const { period, startDate, endDate } = req.query;
  const report = db.getMembersReport({
    period: (period as any) || 'this_month',
    startDate: startDate as string,
    endDate: endDate as string,
  });
  return res.json(report);
});

// GET /api/admin/reports/events (Event Staff)
app.get('/api/admin/reports/events', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const { period, startDate, endDate, eventId } = req.query;
  const report = db.getEventsReport({
    period: (period as any) || 'this_month',
    startDate: startDate as string,
    endDate: endDate as string,
    eventId: eventId as string,
  });
  return res.json(report);
});

// GET /api/admin/reports/financial (Finance Staff)
app.get('/api/admin/reports/financial', authMiddleware, requireFinanceStaff, (req: AuthenticatedRequest, res: Response) => {
  const { period, startDate, endDate } = req.query;
  const report = db.getFinancialReport({
    period: (period as any) || 'this_month',
    startDate: startDate as string,
    endDate: endDate as string,
  });
  return res.json(report);
});

// --- Audit Logs Endpoint ---

// GET /api/admin/audit-logs (Admin)
app.get('/api/admin/audit-logs', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { action, entityType, limit } = req.query;
  const logs = db.getAuditLogs({
    action: action as any,
    entityType: entityType as string,
    limit: limit ? parseInt(limit as string, 10) : 100,
  });
  return res.json(logs);
});

// --- Notifications Endpoints ---

// GET /api/notifications/my
app.get('/api/notifications/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.getUserNotifications(req.user!.id);
  return res.json(notifs);
});

// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'FINANCE_MANAGER'].includes(req.user?.role || '');
  const counts = db.getUnreadNotificationCount(req.user!.id, isStaff);
  const unreadCount = counts.memberUnread;
  return res.json({
    unreadCount,
    memberUnread: counts.memberUnread,
    adminUnread: counts.adminUnread,
    totalUnread: counts.memberUnread + (isStaff ? counts.adminUnread : 0),
  });
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const success = db.markNotificationRead(req.params.id, req.user!.id);
  return res.json({ success });
});

// PUT /api/notifications/read-all
app.put('/api/notifications/read-all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const count = db.markAllNotificationsRead(req.user!.id);
  return res.json({ success: true, count });
});

// GET /api/admin/notifications (Staff)
app.get('/api/admin/notifications', authMiddleware, requireStaff, (_req: AuthenticatedRequest, res: Response) => {
  const notifs = db.getAdminNotifications();
  return res.json(notifs);
});

// GET /api/admin/event-reminders (Event Staff)
app.get('/api/admin/event-reminders', authMiddleware, requireEventStaff, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getEventReminderSettings();
  return res.json(settings);
});

// PUT /api/admin/event-reminders (Event Staff)
app.put('/api/admin/event-reminders', authMiddleware, requireEventStaff, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateEventReminderSettings(req.body);
  return res.json({ success: true, settings: updated });
});

// POST /api/upload (Logo & Image storage endpoint)
app.post('/api/upload', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'Image data URL is required' });
  }
  return res.json({ url: dataUrl });
});

// ==========================================
// STATIC FILES & VITE MIDDLEWARE
// ==========================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AOGIM Dublin App Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
