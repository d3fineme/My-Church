import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  RefreshCw,
  UserCheck,
  Clock,
  User,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { ChurchEvent, EventCheckinStats } from '../../types';

interface AdminCheckinTabProps {
  events: ChurchEvent[];
  selectedEventId?: string | null;
}

export const AdminCheckinTab: React.FC<AdminCheckinTabProps> = ({
  events,
  selectedEventId: initialEventId,
}) => {
  const { t } = useLanguage();
  const { validateTicket, performCheckin, getEventCheckinStats } = useChurchData();

  // Selected event
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || (events.length > 0 ? events[0].id : '')
  );

  // Manual ticket input
  const [ticketInput, setTicketInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // Check-in action state
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'duplicate';
    title: string;
    message: string;
    timestamp?: string;
    checkedInBy?: string;
  } | null>(null);

  // Stats and live log
  const [stats, setStats] = useState<EventCheckinStats | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const activeEvent = events.find((e) => e.id === selectedEventId);

  const loadStats = useCallback(async () => {
    if (!selectedEventId) return;
    const res = await getEventCheckinStats(selectedEventId);
    if (res) {
      setStats(res);
    }
  }, [getEventCheckinStats, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      loadStats();
      setValidationResult(null);
      setActionFeedback(null);
      setTicketInput('');
    }
  }, [selectedEventId, loadStats]);

  const handleValidate = async (codeToTest?: string) => {
    const code = (codeToTest || ticketInput).trim();
    if (!code) return;
    setIsValidating(true);
    setActionFeedback(null);
    try {
      const res = await validateTicket(selectedEventId, code);
      setValidationResult(res);
      if (!res.valid) {
        if (res.reason === 'ALREADY_CHECKED_IN') {
          setActionFeedback({
            type: 'duplicate',
            title: t.checkin?.duplicateTitle || 'DUPLICATE CHECK-IN DETECTED',
            message:
              t.checkin?.duplicateAlert || 'This ticket was already checked in! Admission rejected.',
            timestamp: res.ticket?.checkedInAt,
            checkedInBy: res.ticket?.checkedInBy,
          });
        } else {
          setActionFeedback({
            type: 'error',
            title: 'Invalid Ticket',
            message: res.message || 'Ticket could not be verified for this event.',
          });
        }
      }
    } catch {
      setActionFeedback({
        type: 'error',
        title: 'Error',
        message: 'Network error validating ticket.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmAdmission = async (codeToAdmit?: string) => {
    const code = (codeToAdmit || ticketInput).trim();
    if (!code) return;
    setIsCheckingIn(true);
    try {
      const res = await performCheckin(selectedEventId, code);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          title: t.checkin?.successTitle || 'Admission Confirmed',
          message:
            t.checkin?.successMessage ||
            'Ticket verified successfully. Welcome to AOGIM Dublin!',
        });
        setValidationResult(null);
        setTicketInput('');
        await loadStats();
      } else {
        if (res.duplicateWarning) {
          setActionFeedback({
            type: 'duplicate',
            title: t.checkin?.duplicateTitle || 'DUPLICATE CHECK-IN DETECTED',
            message: res.message,
            timestamp: res.ticket?.checkedInAt,
            checkedInBy: res.ticket?.checkedInBy,
          });
        } else {
          setActionFeedback({
            type: 'error',
            title: 'Check-in Failed',
            message: res.message || 'Unable to record check-in.',
          });
        }
      }
    } catch {
      setActionFeedback({
        type: 'error',
        title: 'Error',
        message: 'Network error during check-in.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Quick simulate scan from active tickets for easy operational testing
  const handleSimulateScan = (ticketCode: string) => {
    setTicketInput(ticketCode);
    handleValidate(ticketCode);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Event Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A192F]">
              Gate Admission
            </span>
            <span className="text-xs text-slate-400">QR & Ticket Validation</span>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            {t.checkin?.title || 'Event Ticket & QR Check-in'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.checkin?.subtitle ||
              'Scan digital tickets or manually enter ticket codes to validate admission and prevent duplicate entries.'}
          </p>
        </div>

        {/* Event Picker */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.checkin?.selectEvent || 'Select Event for Admission'}
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0A192F]"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.startDate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Check-in Attendance Stats */}
      {stats && (
        <div className="bg-[#0A192F] text-white p-6 rounded-3xl shadow-lg border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-display font-bold text-base text-white">
                {t.checkin?.statsTitle || 'Real-time Check-in Attendance'}
              </h3>
            </div>
            <button
              onClick={loadStats}
              title="Refresh attendance stats"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-slate-300">
                {t.checkin?.confirmedExpected || 'Confirmed Expected'}
              </span>
              <p className="font-display font-bold text-xl text-white mt-1">
                {stats.totalExpected}
              </p>
            </div>

            <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300">
                {t.checkin?.presentCount || 'Present (Checked In)'}
              </span>
              <p className="font-display font-bold text-xl text-emerald-400 mt-1">
                {stats.totalCheckedIn}
              </p>
            </div>

            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-slate-300">
                {t.checkin?.absentCount || 'Absent (Pending)'}
              </span>
              <p className="font-display font-bold text-xl text-slate-200 mt-1">
                {stats.totalAbsent}
              </p>
            </div>

            <div className="bg-amber-950/60 p-3.5 rounded-2xl border border-amber-500/30">
              <span className="text-[11px] text-amber-300">
                {t.checkin?.attendanceRate || 'Attendance Rate'}
              </span>
              <p className="font-display font-bold text-xl text-[#D4AF37] mt-1">
                {stats.attendanceRate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Feedback Alerts */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : actionFeedback.type === 'duplicate'
              ? 'bg-red-50 border-red-300 text-red-900 shadow-sm'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : actionFeedback.type === 'duplicate' ? (
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm leading-tight">{actionFeedback.title}</h4>
            <p className="mt-1 leading-relaxed">{actionFeedback.message}</p>
            {actionFeedback.timestamp && (
              <div className="mt-2 pt-1 border-t border-red-200 text-[11px] font-semibold text-red-700 flex items-center gap-2">
                <span>
                  {t.checkin?.checkedInAt || 'Previously checked in at'}:{' '}
                  {new Date(actionFeedback.timestamp).toLocaleTimeString('en-IE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                {actionFeedback.checkedInBy && (
                  <span>· Staff: {actionFeedback.checkedInBy}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dual Scanner & Manual Lookup Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera Scanner Viewfinder simulation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0A192F]" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  {t.checkin?.viewfinderTitle || 'Camera QR Scanner'}
                </h4>
              </div>
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  isCameraActive
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : 'bg-[#0A192F] text-white hover:bg-[#1E3A8A]'
                }`}
              >
                {isCameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>

            {/* Viewfinder Box */}
            <div className="relative aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-slate-700">
              {isCameraActive ? (
                <>
                  <div className="w-44 h-44 rounded-2xl border-2 border-[#D4AF37] relative flex items-center justify-center animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />
                    <QrCode className="w-16 h-16 text-[#D4AF37]/50" />
                  </div>
                  <p className="text-xs text-slate-300 mt-3 font-medium">
                    {t.checkin?.scanNotice ||
                      'Point camera at the attendee digital ticket QR code'}
                  </p>
                </>
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs font-medium">Camera is currently in standby</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Start Camera" or enter ticket code manually on the right
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Integrates with mobile browser camera or barcode/QR scanner hardware
          </p>
        </div>

        {/* Right: Manual Ticket Lookup & Admission Form */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-[#0A192F]" />
              <h4 className="font-display font-bold text-sm text-slate-900">
                {t.checkin?.enterCodeManual || 'Manual Ticket Lookup'}
              </h4>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket Reference or QR Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder={
                      t.checkin?.ticketPlaceholder || 'e.g. AOG-TCK-XXXX or UUID token'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-[#0A192F]"
                  />
                  <button
                    type="submit"
                    disabled={isValidating || !ticketInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isValidating ? 'Checking...' : t.checkin?.validateBtn || 'Lookup'}
                  </button>
                </div>
              </div>
            </form>

            {/* Validation Result Details Card */}
            {validationResult && validationResult.valid && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Valid Confirmed Ticket
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-600">
                    {validationResult.ticket?.ticketCode}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-700 pt-1 border-t border-emerald-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendee:</span>
                    <span className="font-semibold text-slate-900">
                      {validationResult.attendee?.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span>{validationResult.attendee?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Country:</span>
                    <span>{validationResult.attendee?.countryOfOrigin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Event:</span>
                    <span className="truncate max-w-[200px]">{activeEvent?.title}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleConfirmAdmission()}
                  disabled={isCheckingIn}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {isCheckingIn
                      ? 'Admitting...'
                      : t.checkin?.admitBtn || 'Confirm & Admit Attendee'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick simulation helper for tester convenience */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Quick Test Tickets:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['AOG-TCK-LUCAS-01', 'AOG-TCK-DEMO-99', 'AOG-TCK-2026-CONF'].map((code) => (
                <button
                  key={code}
                  onClick={() => handleSimulateScan(code)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Admissions Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900">
              {t.checkin?.liveAdmissions || 'Live Admission Log'}
            </h4>
            <p className="text-xs text-slate-500">
              Chronological check-in activity for this event
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            {stats?.recentAdmissions?.length || 0} Admitted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">{t.checkin?.attendeeName || 'Attendee Name'}</th>
                <th className="px-5 py-3">{t.checkin?.ticketCode || 'Ticket Code'}</th>
                <th className="px-5 py-3">{t.checkin?.admitTime || 'Admission Timestamp'}</th>
                <th className="px-5 py-3">{t.checkin?.staffMember || 'Staff Member'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentAdmissions && stats.recentAdmissions.length > 0 ? (
                stats.recentAdmissions.map((adm: any) => (
                  <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{adm.attendeeName}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">{adm.ticketCode}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(adm.checkedInAt).toLocaleTimeString('en-IE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{adm.staffUserName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    {t.checkin?.noAdmissionsYet ||
                      'No attendees have checked in yet for this event.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
