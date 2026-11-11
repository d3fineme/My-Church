import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Globe,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { ReportFilter, ReportPeriod } from '../../types';

export const AdminReportsTab: React.FC = () => {
  const { t } = useLanguage();
  const { getMembersReport, getEventsReport, getFinancialReport } = useChurchData();

  const [reportType, setReportType] = useState<'members' | 'events' | 'financial'>('financial');
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    const filter: ReportFilter = {
      period,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
    };

    try {
      if (reportType === 'members') {
        const data = await getMembersReport(filter);
        setReportData(data);
      } else if (reportType === 'events') {
        const data = await getEventsReport(filter);
        setReportData(data);
      } else {
        const data = await getFinancialReport(filter);
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setIsLoading(false);
    }
  }, [getEventsReport, getFinancialReport, getMembersReport, period, reportType, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `aogim_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'members') {
      headers = ['Country', 'User Count', 'Percentage (%)'];
      rows = (reportData.countryDistribution || []).map((c: any) => [
        `"${c.country}"`,
        c.count,
        `${c.percentage}%`,
      ]);
    } else if (reportType === 'events') {
      headers = ['Event Title', 'Date', 'Type', 'Capacity', 'Registrations', 'Checked-in', 'Attendance Rate (%)'];
      rows = (reportData.eventsBreakdown || []).map((e: any) => [
        `"${e.title}"`,
        e.date,
        e.isPaid ? 'Paid' : 'Free',
        e.capacity || 'Open',
        e.registrationsCount,
        e.presentCount,
        `${e.attendanceRate}%`,
      ]);
    } else {
      headers = ['Financial Category', 'Approved Revenue (EUR)', 'Transaction Count', 'Pending / Notes'];
      rows = [
        ['Tithes', reportData.tithes?.approvedTotal || 0, reportData.tithes?.count || 0, 'Verified'],
        ['Offerings', reportData.offerings?.approvedTotal || 0, reportData.offerings?.count || 0, 'Verified'],
        ['Event Tickets', reportData.eventRevenue?.approvedTotal || 0, reportData.eventRevenue?.ticketsCount || 0, 'Verified'],
        ['Pending Contributions', reportData.pendingAmounts?.contributions || 0, '-', 'Pending Review'],
        ['Pending Event Tickets', reportData.pendingAmounts?.ticketPayments || 0, '-', 'Pending Review'],
      ];
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A192F]">
              Official Analytics
            </span>
            <span className="text-xs text-slate-400">Reports Center</span>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            {t.reports?.title || 'Reports & Analytics Center'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.reports?.subtitle ||
              'Generate and export comprehensive operational, financial, and attendance reports.'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!reportData || isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{t.reports?.exportCsv || 'Export CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!reportData || isLoading}
            className="px-3.5 py-2 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.reports?.printReport || 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Report Type Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
          <button
            onClick={() => setReportType('financial')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              reportType === 'financial'
                ? 'bg-[#0A192F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.reports?.tabFinancial || 'Financial & Giving Report'}</span>
          </button>

          <button
            onClick={() => setReportType('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              reportType === 'events'
                ? 'bg-[#0A192F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t.reports?.tabEvents || 'Events & Attendance Report'}</span>
          </button>

          <button
            onClick={() => setReportType('members')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              reportType === 'members'
                ? 'bg-[#0A192F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.reports?.tabMembers || 'Members Growth Report'}</span>
          </button>
        </div>

        {/* Period Selector Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {t.reports?.filterPeriod || 'Period'}:
            </span>
            {[
              { id: '7d', label: t.reports?.period7d || '7 Days' },
              { id: '30d', label: t.reports?.period30d || '30 Days' },
              { id: 'this_month', label: t.reports?.periodThisMonth || 'Current Month' },
              { id: 'last_month', label: t.reports?.periodLastMonth || 'Last Month' },
              { id: 'this_year', label: t.reports?.periodThisYear || 'Current Year' },
              { id: 'custom', label: t.reports?.periodCustom || 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as ReportPeriod)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  period === p.id
                    ? 'bg-[#1E3A8A] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if Custom selected */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 bg-slate-50"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 bg-slate-50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Content Display */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          Generating report data...
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* FINANCIAL REPORT VIEW */}
          {reportType === 'financial' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                    {t.reports?.approvedRevenue || 'Total Approved Revenue'}
                  </span>
                  <h3 className="font-display font-bold text-2xl text-slate-900 mt-1">
                    €{(reportData.totalApprovedRevenue || 0).toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    {reportData.summary?.totalApprovedTransactions} verified contributions & payments
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border-l-4 border-amber-500 border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                    {t.reports?.pendingReviewValue || 'Pending Review Value'}
                  </span>
                  <h3 className="font-display font-bold text-2xl text-amber-700 mt-1">
                    €{(reportData.pendingAmounts?.totalPending || 0).toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-amber-600 mt-1">
                    Separated from confirmed revenue
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border-l-4 border-blue-500 border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                    Reporting Currency
                  </span>
                  <h3 className="font-display font-bold text-2xl text-blue-900 mt-1">
                    EUR (€)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dublin, Ireland Jurisdiction
                  </p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Detailed Financial Statement
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Strict separation of approved vs. pending amounts
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Approved Revenue</th>
                      <th className="px-5 py-3">Count</th>
                      <th className="px-5 py-3">Status / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-5 py-3 font-semibold text-slate-900">Tithes</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">
                        €{(reportData.tithes?.approvedTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{reportData.tithes?.count}</td>
                      <td className="px-5 py-3 text-slate-500">Confirmed church stewardship</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-slate-900">Offerings</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">
                        €{(reportData.offerings?.approvedTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{reportData.offerings?.count}</td>
                      <td className="px-5 py-3 text-slate-500">Generosity & ministry gifts</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-slate-900">Event Tickets</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">
                        €{(reportData.eventRevenue?.approvedTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {reportData.eventRevenue?.ticketsCount}
                      </td>
                      <td className="px-5 py-3 text-slate-500">Verified ticket reservations</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="px-5 py-3 font-semibold text-amber-900">
                        Pending Tithes & Offerings
                      </td>
                      <td className="px-5 py-3 font-bold text-amber-700">
                        €{(reportData.pendingAmounts?.contributions || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-amber-800">
                        {reportData.pendingAmounts?.contributionsCount}
                      </td>
                      <td className="px-5 py-3 text-amber-700">Awaiting bank verification</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="px-5 py-3 font-semibold text-amber-900">
                        Pending Event Tickets
                      </td>
                      <td className="px-5 py-3 font-bold text-amber-700">
                        €{(reportData.pendingAmounts?.ticketPayments || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-amber-800">
                        {reportData.pendingAmounts?.ticketPaymentsCount}
                      </td>
                      <td className="px-5 py-3 text-amber-700">Receipts under review</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EVENTS REPORT VIEW */}
          {reportType === 'events' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Events</span>
                  <h3 className="font-display font-bold text-2xl text-slate-900 mt-1">
                    {reportData.summary?.totalEventsCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">In selected period</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Registrations</span>
                  <h3 className="font-display font-bold text-2xl text-blue-900 mt-1">
                    {reportData.summary?.totalRegistrationsCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">All participants</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Checked-in (Present)</span>
                  <h3 className="font-display font-bold text-2xl text-emerald-600 mt-1">
                    {reportData.summary?.totalCheckedInCount}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {reportData.summary?.overallAttendanceRate}% attendance rate
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Event Revenue</span>
                  <h3 className="font-display font-bold text-2xl text-[#D4AF37] mt-1">
                    €{(reportData.summary?.totalEventRevenue || 0).toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Approved ticket fees</p>
                </div>
              </div>

              {/* Event Rankings Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    {t.reports?.eventRankings || 'Events by Attendance & Revenue'}
                  </h4>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Event Name</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Capacity</th>
                      <th className="px-5 py-3">Registrations</th>
                      <th className="px-5 py-3">Present</th>
                      <th className="px-5 py-3">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.eventsBreakdown && reportData.eventsBreakdown.length > 0 ? (
                      reportData.eventsBreakdown.map((evt: any) => (
                        <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{evt.title}</td>
                          <td className="px-5 py-3 text-slate-600">{evt.date}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                evt.isPaid
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {evt.isPaid ? 'Paid' : 'Free'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {evt.capacity || 'Open capacity'}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {evt.registrationsCount}
                          </td>
                          <td className="px-5 py-3 text-emerald-600 font-bold">
                            {evt.presentCount}
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">
                            {evt.attendanceRate}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          No events in selected timeframe.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MEMBERS REPORT VIEW */}
          {reportType === 'members' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Registered</span>
                  <h3 className="font-display font-bold text-2xl text-slate-900 mt-1">
                    {reportData.summary?.totalUsersCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Cumulative registered app users</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">New in Period</span>
                  <h3 className="font-display font-bold text-2xl text-emerald-600 mt-1">
                    +{reportData.summary?.periodRegistrationsCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">New accounts created</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Nationalities</span>
                  <h3 className="font-display font-bold text-2xl text-[#1E3A8A] mt-1">
                    {reportData.countryDistribution?.length || 0}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Countries represented</p>
                </div>
              </div>

              {/* Country Distribution Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    {t.reports?.topCountries || 'Top Countries of Origin'}
                  </h4>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Country</th>
                      <th className="px-5 py-3">Registered Users</th>
                      <th className="px-5 py-3">Percentage of Community</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.countryDistribution && reportData.countryDistribution.length > 0 ? (
                      reportData.countryDistribution.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{item.country}</td>
                          <td className="px-5 py-3 font-medium text-slate-700">{item.count}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${item.percentage}%` }}
                                  className="bg-[#0A192F] h-full rounded-full"
                                />
                              </div>
                              <span className="font-bold text-slate-900">{item.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-slate-400">
                          No country distribution records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
