import React, { useState } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Clock,
  Eye,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AdminDashboardTabProps {
  overviewStats: any;
  onNavigateTab: (tab: any) => void;
  onInspectEvent: (eventId: string) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  overviewStats,
  onNavigateTab,
  onInspectEvent,
}) => {
  const { t } = useLanguage();
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'month' | 'all'>('month');

  const members = overviewStats?.membersOverview || {
    totalUsers: overviewStats?.totalUsers || 0,
    newUsersThisMonth: 0,
    newUsersLast7Days: 0,
    countryDistribution: [],
    monthlySignups: [],
  };

  const eventsData = overviewStats?.eventsOverview || {
    totalEvents: overviewStats?.totalEvents || 0,
    upcomingEventsCount: overviewStats?.upcomingEventsCount || 0,
    finishedEventsCount: 0,
    cancelledEventsCount: 0,
    totalRegistrations: overviewStats?.totalRegistrations || 0,
    confirmedParticipants: 0,
    pendingPaymentsCount: 0,
    awaitingProofAnalysisCount: 0,
    upcomingEventsTable: [],
  };

  const finances = overviewStats?.financialOverview || {
    tithes: { approvedTotal: 0, count: 0 },
    offerings: { approvedTotal: 0, count: 0 },
    eventPayments: { approvedTotal: 0, confirmedCount: 0, byEvent: [] },
    pendingReview: {
      proofsAwaitingReview: 0,
      pendingContributionsCount: 0,
      pendingContributionsAmount: 0,
      pendingPaymentsCount: 0,
    },
  };

  // SVG Growth Chart Calculation
  const monthlyData: Array<{ month: string; count: number }> =
    members.monthlySignups && members.monthlySignups.length > 0
      ? members.monthlySignups
      : [
          { month: 'Jan', count: 2 },
          { month: 'Feb', count: 3 },
          { month: 'Mar', count: members.totalUsers || 4 },
        ];
  const maxMonthly = Math.max(...monthlyData.map((d) => d.count), 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner & Period Filter */}
      <div className="bg-gradient-to-br from-[#0A192F] via-[#0F2648] to-[#1E3A8A] text-white p-6 rounded-3xl shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A192F]">
              {t.dashboard?.registeredUsersBadge || 'Registered App Users'}
            </span>
            <span className="text-xs text-slate-300">
              {new Date().toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
            {t.dashboard?.title || 'Executive Church Overview'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {t.dashboard?.registeredUsersClarification ||
              'These metrics reflect digital accounts registered in this app, distinct from total Sunday congregational headcount.'}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl border border-white/15 self-start md:self-center shrink-0">
          <button
            onClick={() => setPeriodFilter('7d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              periodFilter === '7d'
                ? 'bg-[#D4AF37] text-[#0A192F] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.dashboard?.period7d || '7D'}
          </button>
          <button
            onClick={() => setPeriodFilter('30d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              periodFilter === '30d'
                ? 'bg-[#D4AF37] text-[#0A192F] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.dashboard?.period30d || '30D'}
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              periodFilter === 'month'
                ? 'bg-[#D4AF37] text-[#0A192F] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.dashboard?.periodMonth || 'This Month'}
          </button>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              periodFilter === 'all'
                ? 'bg-[#D4AF37] text-[#0A192F] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.dashboard?.periodAll || 'All Time'}
          </button>
        </div>
      </div>

      {/* 1.1 MEMBERS OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0A192F]" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              {t.dashboard?.membersOverview || 'Members Overview'}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>{t.common.viewAll}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Member KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {t.dashboard?.totalUsers || 'Total Registered Users'}
              </p>
              <h4 className="font-display font-bold text-2xl text-slate-900 mt-1">
                {members.totalUsers}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">App accounts created</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {t.dashboard?.newThisMonth || 'Signups This Month'}
              </p>
              <h4 className="font-display font-bold text-2xl text-emerald-600 mt-1">
                +{members.newUsersThisMonth}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">New community joiners</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {t.dashboard?.newLast7Days || 'Signups (Last 7 Days)'}
              </p>
              <h4 className="font-display font-bold text-2xl text-[#D4AF37] mt-1">
                +{members.newUsersLast7Days}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Recent momentum</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#b89326] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Member Charts: Monthly Growth & Country Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly Growth (SVG Bar Chart) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">
                  {t.dashboard?.monthlyGrowth || 'User Registration Growth'}
                </h4>
                <p className="text-xs text-slate-500">Monthly new accounts registered</p>
              </div>
              <span className="text-[11px] font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-1 rounded">
                Trend
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {monthlyData.map((d, idx) => {
                const heightPercent = Math.max(12, Math.round((d.count / maxMonthly) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-[#0A192F] to-[#1E3A8A] group-hover:to-[#D4AF37] rounded-t-lg transition-all"
                    />
                    <span className="text-[11px] font-medium text-slate-500 mt-1">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Active growth rate tracked across official registration records
            </p>
          </div>

          {/* Country of Origin Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">
                  {t.dashboard?.countryDistribution || 'Community by Country of Origin'}
                </h4>
                <p className="text-xs text-slate-500">Multi-national demographic distribution</p>
              </div>
              <Globe className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-48 pr-1">
              {members.countryDistribution && members.countryDistribution.length > 0 ? (
                members.countryDistribution.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{item.country}</span>
                      <span className="text-slate-500 font-normal">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-gradient-to-r from-[#0F2648] to-[#D4AF37] h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  No country records found yet.
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              A welcoming church for all nations in the heart of Dublin
            </p>
          </div>
        </div>
      </section>

      {/* 1.2 EVENTS OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0A192F]" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              {t.dashboard?.eventsOverview || 'Events Overview'}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>{t.common.viewAll}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Event Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard?.publishedEvents || 'Published Events'}
            </p>
            <h4 className="font-display font-bold text-xl text-slate-900 mt-1">
              {eventsData.totalEvents}
            </h4>
            <span className="text-[11px] text-slate-400">
              {eventsData.upcomingEventsCount} upcoming
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard?.totalRegistrations || 'Total Registrations'}
            </p>
            <h4 className="font-display font-bold text-xl text-slate-900 mt-1">
              {eventsData.totalRegistrations}
            </h4>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {eventsData.confirmedParticipants} confirmed
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard?.pendingPayments || 'Pending Payments'}
            </p>
            <h4 className="font-display font-bold text-xl text-amber-600 mt-1">
              {eventsData.pendingPaymentsCount}
            </h4>
            <span className="text-[11px] text-slate-400">Awaiting transfer</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard?.awaitingProofAnalysis || 'Proofs In Review'}
            </p>
            <h4 className="font-display font-bold text-xl text-[#0F2648] mt-1">
              {eventsData.awaitingProofAnalysisCount}
            </h4>
            <span className="text-[11px] text-slate-400">Requires audit</span>
          </div>
        </div>

        {/* Upcoming Events Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-slate-900">
              {t.dashboard?.upcomingEventsTable || 'Next Upcoming Events'}
            </h4>
            <button
              onClick={() => onNavigateTab('checkin')}
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Open Ticket Check-in →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">{t.dashboard?.colEvent || 'Event Name'}</th>
                  <th className="px-4 py-3">{t.dashboard?.colDate || 'Date & Time'}</th>
                  <th className="px-4 py-3">{t.dashboard?.colRegistrations || 'Registrations'}</th>
                  <th className="px-4 py-3">{t.dashboard?.colConfirmed || 'Confirmed'}</th>
                  <th className="px-4 py-3">{t.dashboard?.colPending || 'Pending'}</th>
                  <th className="px-4 py-3">{t.dashboard?.colAvailable || 'Available Spots'}</th>
                  <th className="px-4 py-3 text-right">{t.dashboard?.colActions || 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventsData.upcomingEventsTable && eventsData.upcomingEventsTable.length > 0 ? (
                  eventsData.upcomingEventsTable.map((evt: any) => (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{evt.title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {evt.startDate} · {evt.startTime}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {evt.totalRegistrations}
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">
                        {evt.confirmedParticipants}
                      </td>
                      <td className="px-4 py-3 text-amber-600 font-medium">
                        {evt.pendingPayments}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {evt.availableSpots !== null ? evt.availableSpots : 'Open capacity'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onInspectEvent(evt.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t.dashboard?.viewDeepDive || 'Deep Dive'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      No upcoming events scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 1.3 FINANCIAL OVERVIEW (Strict separation of confirmed vs pending) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0A192F]" />
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                {t.dashboard?.financialOverview || 'Financial Overview'}
              </h3>
              <p className="text-xs text-slate-500">
                {t.dashboard?.strictNotice ||
                  'Strict Accounting Rule: Only verified & approved transactions are counted in confirmed totals.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('financial')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>Manage Finances</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Main Approved Revenue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.dashboard?.tithesTotal || 'Approved Tithes'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="font-display font-bold text-2xl text-slate-900 mt-2">
              €{finances.tithes.approvedTotal.toFixed(2)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              {finances.tithes.count} verified tithe transactions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-l-4 border-blue-500 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.dashboard?.offeringsTotal || 'Approved Offerings'}</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <h4 className="font-display font-bold text-2xl text-slate-900 mt-2">
              €{finances.offerings.approvedTotal.toFixed(2)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              {finances.offerings.count} verified offering gifts
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-l-4 border-[#D4AF37] border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.dashboard?.eventRevenue || 'Approved Event Revenue'}</span>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <h4 className="font-display font-bold text-2xl text-slate-900 mt-2">
              €{finances.eventPayments.approvedTotal.toFixed(2)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              {finances.eventPayments.confirmedCount} paid event tickets
            </p>
          </div>
        </div>

        {/* Pending Review & Revenue by Event Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Review Alert Box */}
          <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-display font-bold text-sm text-amber-900">
                {t.dashboard?.pendingProofsToAnalyze || 'Items Awaiting Review / Pending'}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <span className="text-slate-500">Pending Tithes / Offerings</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {finances.pendingReview.pendingContributionsCount} items
                </p>
                <span className="text-[11px] text-amber-700 font-medium">
                  €{finances.pendingReview.pendingContributionsAmount.toFixed(2)}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <span className="text-slate-500">Pending Ticket Receipts</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {finances.pendingReview.pendingPaymentsCount} tickets
                </p>
                <span className="text-[11px] text-slate-500">Requires admin verification</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('financial')}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>Review Pending Receipts & Contributions</span>
            </button>
          </div>

          {/* Revenue by Event Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <h4 className="font-display font-bold text-sm text-slate-900 mb-3">
              {t.dashboard?.revenueByEvent || 'Confirmed Revenue by Event'}
            </h4>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-48 pr-1">
              {finances.eventPayments.byEvent && finances.eventPayments.byEvent.length > 0 ? (
                finances.eventPayments.byEvent.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <h5 className="font-semibold text-slate-900">{item.title}</h5>
                      <span className="text-[11px] text-slate-500">
                        {item.paidCount} paid tickets
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      €{item.approvedRevenue.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No paid event ticket records confirmed yet.
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Event payments verified via manual bank transfer review
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
