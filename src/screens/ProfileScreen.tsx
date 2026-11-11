import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Globe,
  Calendar,
  Shield,
  KeyRound,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Camera,
  X,
  ExternalLink,
  Ticket,
  FileText,
  QrCode,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { EventTicket } from '../types';

interface ProfileScreenProps {
  onOpenAdminPanel?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenAdminPanel }) => {
  const {
    user,
    isAdmin,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    openAuthModal,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { myRegistrations, cancelRegistration, myTickets, myContributions } = useChurchData();

  // Modals / forms
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editCountry, setEditCountry] = useState(user?.countryOfOrigin || '');
  const [editPhoto, setEditPhoto] = useState(user?.profilePhoto || '');
  const [viewingTicket, setViewingTicket] = useState<EventTicket | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-slate-800">
          Sign In to Access Your Profile
        </h2>
        <p className="text-xs text-slate-500">
          Sign in or create an account to view your event registrations, update your profile, and manage your account.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 rounded-2xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-md transition-colors"
        >
          {t.auth.signIn} / {t.auth.signUp}
        </button>
      </div>
    );
  }

  // Handle Edit Profile
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    const res = await updateProfile({
      fullName: editName,
      countryOfOrigin: editCountry,
      profilePhoto: editPhoto || null,
    });
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', text: t.common.success });
      setIsEditingProfile(false);
    } else {
      setFeedback({ type: 'error', text: res.error || t.common.error });
    }
  };

  // Handle Password Change
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: t.auth.passwordPlaceholder });
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', text: t.auth.passwordChanged });
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setFeedback({ type: 'error', text: res.error || t.common.error });
    }
  };

  // Handle Photo upload simulation/convert
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Delete Account
  const handleDeleteAccountConfirm = async () => {
    setIsSubmitting(true);
    const res = await deleteAccount();
    setIsSubmitting(false);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || t.common.error });
      setIsDeletingAccount(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
          {t.profile.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assembly of God Ireland Ministry
        </p>
      </div>

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

      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F2648] to-[#1E3A8A] text-[#D4AF37] border-2 border-[#D4AF37]/50 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-inner">
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
          <button
            onClick={() => {
              setEditName(user.fullName);
              setEditCountry(user.countryOfOrigin);
              setEditPhoto(user.profilePhoto || '');
              setIsEditingProfile(true);
            }}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0F2648] text-white hover:bg-[#1E3A8A] shadow border border-white"
            title="Edit Photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="font-display font-bold text-lg text-slate-900 truncate">
              {user.fullName}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                user.role === 'ADMIN'
                  ? 'bg-[#D4AF37]/20 text-[#8a6a12] border border-[#D4AF37]/40'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {user.role === 'ADMIN' ? t.common.adminBadge : t.common.memberBadge}
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
          </p>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.countryOfOrigin}</span>
            <span aria-hidden="true">·</span>
            <span>{t.profile.memberSince} {formattedDate}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setEditName(user.fullName);
            setEditCountry(user.countryOfOrigin);
            setEditPhoto(user.profilePhoto || '');
            setIsEditingProfile(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors shrink-0"
        >
          {t.common.edit}
        </button>
      </div>

      {/* Admin Panel Quick Link if Admin */}
      {isAdmin && onOpenAdminPanel && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0A192F] to-[#1E3A8A] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D4AF37] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                {t.admin.title}
              </h3>
              <p className="text-xs text-slate-300">
                Manage church events, services, announcements, and members.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAdminPanel}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-[#0A192F] font-bold text-xs transition-colors shrink-0"
          >
            Open Panel →
          </button>
        </div>
      )}

      {/* MY TICKETS SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.financial.myTickets}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {myTickets.length} {myTickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>

        {myTickets.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            <p>{t.financial.noTickets}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-[#0F2648]/5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#0F2648] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {ticket.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {ticket.ticketStatus}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    {ticket.eventTitle || 'Church Event'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D4AF37]" />
                      {ticket.eventDate} · {ticket.eventTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {ticket.eventLocation}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setViewingTicket(ticket)}
                  className="px-4 py-2 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0 self-end sm:self-auto"
                >
                  <QrCode className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.financial.viewTicket}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MY EVENTS SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.profile.myEvents}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {myRegistrations.length} {myRegistrations.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {myRegistrations.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <p>{t.profile.noEventsRegistered}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRegistrations.map((reg) => (
              <div
                key={reg.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  reg.registrationStatus === 'CONFIRMED'
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-50/40 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      {reg.event?.title || 'Church Event'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D4AF37]" />
                        {reg.event?.startDate} · {reg.event?.startTime}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {reg.event?.location}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      reg.registrationStatus === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {reg.registrationStatus === 'CONFIRMED'
                      ? t.profile.confirmedStatus
                      : t.profile.cancelledStatus}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {t.profile.regNumber}:{' '}
                    <strong className="font-mono text-slate-800">
                      {reg.registrationNumber}
                    </strong>
                  </span>

                  {reg.registrationStatus === 'CONFIRMED' && (
                    <button
                      onClick={() => cancelRegistration(reg.eventId)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold underline"
                    >
                      {t.events.cancelRegistration}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MY CONTRIBUTIONS SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.giving.myContributions}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {myContributions.length} {myContributions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {myContributions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <p>{t.giving.noContributions}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myContributions.map((contrib) => {
              const statusColors: Record<string, string> = {
                Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                'Under Review': 'bg-amber-100 text-amber-800 border-amber-200',
                Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
                Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
              };

              return (
                <div
                  key={contrib.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0F2648] text-white">
                          {contrib.contributionType}
                        </span>
                        <strong className="font-display font-bold text-base text-slate-900">
                          €{Number(contrib.amount).toFixed(2)}
                        </strong>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        <span>Transfer Date: {contrib.transferDate}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-600">
                          Ref: {contrib.paymentReference}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        statusColors[contrib.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {contrib.status}
                    </span>
                  </div>

                  {/* Rejection Alert if Rejected */}
                  {contrib.status === 'Rejected' && contrib.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">
                          {t.financial.rejectionReason}:
                        </strong>
                        <p>{contrib.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Attached receipt trigger */}
                  {contrib.paymentProof && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        Payment proof attached
                      </span>
                      <button
                        onClick={() => setViewingProof(contrib.paymentProof!)}
                        className="text-xs font-semibold text-[#0F2648] hover:text-[#1E3A8A] flex items-center gap-1 underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.admin.viewProof}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings / Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-base text-slate-900">
          Account Settings
        </h2>

        {/* Language selector */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Globe className="w-4 h-4 text-slate-400" />
            <span>{t.profile.languageSelection}</span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                language === 'en' ? 'bg-[#0F2648] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('pt')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                language === 'pt' ? 'bg-[#0F2648] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Português
            </button>
          </div>
        </div>

        {/* Change password trigger */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>{t.profile.changePassword}</span>
          </div>
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            {t.profile.changePassword}
          </button>
        </div>

        {/* Logout */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>{t.auth.logout}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition-colors"
          >
            {t.auth.logout}
          </button>
        </div>

        {/* Delete account */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
            <Trash2 className="w-4 h-4" />
            <span>{t.profile.deleteAccount}</span>
          </div>
          <button
            onClick={() => setIsDeletingAccount(true)}
            className="text-xs text-rose-600 hover:underline font-semibold"
          >
            {t.profile.deleteAccount}
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                {t.profile.editProfile}
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Photo Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {editPhoto ? (
                      <img
                        src={editPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-400 m-3" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.auth.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.auth.countryOfOrigin} *
                </label>
                <input
                  type="text"
                  required
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0F2648] text-white text-xs font-semibold hover:bg-[#1E3A8A] disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                {t.profile.changePassword}
              </h3>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.profile.currentPassword}
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.profile.newPassword}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.profile.confirmNewPassword}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0F2648] text-white text-xs font-semibold hover:bg-[#1E3A8A] disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : t.profile.changePassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              {t.profile.deleteAccount}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.profile.deleteWarning}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t.common.loading : t.profile.confirmDelete}
              </button>
              <button
                onClick={() => setIsDeletingAccount(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-semibold">{viewingTicket.eventLocation}</span>
              </div>
            </div>

            {/* Generated Ticket QR Code */}
            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border-2 border-[#0F2648] flex flex-col items-center justify-center shadow-inner relative">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#0A192F]">
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="13" width="10" height="10" fill="#0A192F" rx="1" />

                <rect x="69" y="5" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="77" y="13" width="10" height="10" fill="#0A192F" rx="1" />

                <rect x="5" y="69" width="26" height="26" fill="#0A192F" rx="4" />
                <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="77" width="10" height="10" fill="#0A192F" rx="1" />

                <rect x="36" y="8" width="6" height="6" fill="#0A192F" />
                <rect x="46" y="8" width="8" height="6" fill="#0A192F" />
                <rect x="58" y="12" width="6" height="6" fill="#0A192F" />

                <rect x="8" y="36" width="6" height="6" fill="#0A192F" />
                <rect x="18" y="36" width="8" height="6" fill="#0A192F" />
                <rect x="8" y="48" width="6" height="12" fill="#0A192F" />

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

      {/* PAYMENT RECEIPT MODAL */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-sm text-white">
                {t.admin.viewProof}
              </h3>
              <button
                onClick={() => setViewingProof(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={viewingProof}
                alt="Payment Receipt"
                className="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-200 shadow-md"
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingProof(null)}
                className="px-5 py-2 rounded-xl bg-[#0F2648] text-white text-xs font-semibold"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
