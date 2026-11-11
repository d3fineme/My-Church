import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Users,
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { EventOperationalSummary } from '../../types';

interface AdminEventDeepDiveModalProps {
  eventId: string | null;
  onClose: () => void;
  onOpenCheckin?: (eventId: string) => void;
}

export const AdminEventDeepDiveModal: React.FC<AdminEventDeepDiveModalProps> = ({
  eventId,
  onClose,
  onOpenCheckin,
}) => {
  const { t } = useLanguage();
  const { getEventOperationalSummary, getEventAttendeesDetailed } = useChurchData();

  const [summary, setSummary] = useState<EventOperationalSummary | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinFilter, setCheckinFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [sum, atts] = await Promise.all([
        getEventOperationalSummary(eventId),
        getEventAttendeesDetailed(eventId),
      ]);
      setSummary(sum);
      setAttendees(atts);
    } catch (err) {
      console.error('Failed to load event deep dive details', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, getEventAttendeesDetailed, getEventOperationalSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!eventId) return null;

  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      (a.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.ticket?.ticketCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (checkinFilter === 'present') return a.isCheckedIn;
    if (checkinFilter === 'absent') return !a.isCheckedIn;
    return true;
  });

  const handleExportCsv = () => {
    if (!summary) return;

    const headers = [
      'Attendee Name',
      'Email',
      'Country',
      'Registration Date',
      'Payment Status',
      'Ticket Code',
      'Check-in Status',
      'Checked-in Timestamp',
    ];

    const rows = attendees.map((a) => [
      `"${(a.fullName || '').replace(/"/g, '""')}"`,
      `"${(a.email || '').replace(/"/g, '""')}"`,
      `"${(a.countryOfOrigin || '').replace(/"/g, '""')}"`,
      `"${a.registeredAt || ''}"`,
      `"${a.paymentStatus || (a.isPaidEvent ? 'Pending' : 'Confirmed')}"`,
      `"${a.ticket?.ticketCode || 'N/A'}"`,
      `"${a.isCheckedIn ? 'PRESENT' : 'ABSENT'}"`,
      `"${a.checkedInAt || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees_${summary.event.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#0A192F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-[#D4AF37] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
                {summary?.event.title || 'Event Operational Deep Dive'}
              </h3>
              <p className="text-xs text-slate-300">
                {summary?.event.startDate} · {summary?.event.startTime} · {summary?.event.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {isLoading || !summary ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading operational metrics...
            </div>
          ) : (
            <>
              {/* Event Banner & Top KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {summary.event.banner && (
                  <div className="md:col-span-1 h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
                    <img
                      src={summary.event.banner}
                      alt={summary.event.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div
                  className={`${
                    summary.event.banner ? 'md:col-span-3' : 'md:col-span-4'
                  } grid grid-cols-2 sm:grid-cols-4 gap-3`}
                >
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Registrations</span>
                    <p className="font-display font-bold text-xl text-slate-900 mt-0.5">
                      {summary.metrics.totalRegistrations}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Capacity: {summary.metrics.capacity || 'Open'}
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 font-medium">Present (Checked In)</span>
                    <p className="font-display font-bold text-xl text-emerald-700 mt-0.5">
                      {summary.metrics.presentCount}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {summary.metrics.attendanceRate}% Attendance
                    </span>
                  </div>

                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                    <span className="text-[11px] text-amber-800 font-medium">Pending Payments</span>
                    <p className="font-display font-bold text-xl text-amber-700 mt-0.5">
                      {summary.metrics.pendingPayments}
                    </p>
                    <span className="text-[10px] text-amber-600">Awaiting verification</span>
                  </div>

                  <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
                    <span className="text-[11px] text-blue-800 font-medium">Approved Revenue</span>
                    <p className="font-display font-bold text-xl text-blue-900 mt-0.5">
                      €{summary.metrics.approvedRevenue.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-blue-600">
                      {summary.event.isPaid ? `€${summary.event.ticketPrice}/ticket` : 'Free Event'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons & Attendees Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search attendee by name, email, ticket..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 w-60 focus:outline-hidden focus:ring-2 focus:ring-[#0A192F]"
                    />
                  </div>

                  {/* Presence filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setCheckinFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        checkinFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      All ({attendees.length})
                    </button>
                    <button
                      onClick={() => setCheckinFilter('present')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        checkinFilter === 'present'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Present ({summary.metrics.presentCount})
                    </button>
                    <button
                      onClick={() => setCheckinFilter('absent')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        checkinFilter === 'absent'
                          ? 'bg-white text-slate-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Absent ({summary.metrics.absentCount})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenCheckin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCheckin(summary.event.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-[#D4AF37] font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Open Check-in Gate</span>
                    </button>
                  )}
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Attendees List Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Attendee</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Registered Date</th>
                        <th className="px-4 py-3">Ticket / Payment</th>
                        <th className="px-4 py-3">Check-in Status</th>
                        <th className="px-4 py-3">Admitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAttendees.length > 0 ? (
                        filteredAttendees.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 block">
                                {att.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500">{att.email}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{att.countryOfOrigin}</td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(att.registeredAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              {att.ticket ? (
                                <span className="font-mono text-[11px] text-slate-700 font-semibold block">
                                  {att.ticket.ticketCode}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Standard Spot</span>
                              )}
                              <span
                                className={`text-[10px] font-bold ${
                                  att.paymentStatus === 'Confirmed' || !att.isPaidEvent
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {att.paymentStatus || (att.isPaidEvent ? 'Pending' : 'Confirmed')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {att.isCheckedIn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PRESENT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  <Clock className="w-3 h-3" />
                                  ABSENT
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {att.checkedInAt
                                ? new Date(att.checkedInAt).toLocaleTimeString('en-IE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            No attendees found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
