import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { AuditLog, AuditAction } from '../../types';

export const AdminAuditTab: React.FC = () => {
  const { t } = useLanguage();
  const { getAuditLogs } = useChurchData();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, entityFilter, getAuditLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (action.includes('REJECT') || action.includes('CANCEL')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (action.includes('ROLE') || action.includes('STATUS')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (action.includes('CHECKIN')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A192F] text-[#D4AF37]">
              Immutable Security Log
            </span>
            <span className="text-xs text-slate-400">Europe/Dublin Timezone</span>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            {t.audit?.title || 'Administrative Audit Logs'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.audit?.subtitle ||
              'Immutable record of operational changes made by church administrators and managers.'}
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 self-start md:self-center disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
            >
              <option value="all">All Actions</option>
              <option value="EVENT_CREATE">Event Created</option>
              <option value="EVENT_UPDATE">Event Updated</option>
              <option value="EVENT_CANCEL">Event Cancelled</option>
              <option value="CONTRIBUTION_APPROVE">Contribution Approved</option>
              <option value="CONTRIBUTION_REJECT">Contribution Rejected</option>
              <option value="PAYMENT_APPROVE">Payment Approved</option>
              <option value="PAYMENT_REJECT">Payment Rejected</option>
              <option value="USER_ROLE_CHANGE">Role Changed</option>
              <option value="ACCOUNT_STATUS_CHANGE">Status Changed</option>
              <option value="CHECKIN_RECORD">Check-in Recorded</option>
              <option value="BANK_SETTINGS_UPDATE">Bank Settings Updated</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
            >
              <option value="all">All Entities</option>
              <option value="Event">Event</option>
              <option value="Contribution">Contribution</option>
              <option value="EventPayment">Event Payment</option>
              <option value="User">User</option>
              <option value="BankingSettings">Banking Settings</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400 font-medium">
          Showing {logs.length} logged events
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">{t.audit?.colTimestamp || 'Timestamp (Dublin)'}</th>
                <th className="px-5 py-3.5">{t.audit?.colUser || 'Admin User'}</th>
                <th className="px-5 py-3.5">{t.audit?.colAction || 'Action'}</th>
                <th className="px-5 py-3.5">{t.audit?.colEntity || 'Entity'}</th>
                <th className="px-5 py-3.5">{t.audit?.colDetails || 'Details'}</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IE', {
                        timeZone: 'Europe/Dublin',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{log.entityType}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {(log.previousValue || log.newValue) && (
                        <button
                          onClick={() => setInspectLog(log)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Inspect changes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    {t.audit?.noLogs || 'No audit logs recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Changes Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#0A192F] text-white">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Audit Log Details
                </h3>
                <p className="text-xs text-slate-300">
                  {inspectLog.action} · {inspectLog.userName}
                </p>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <span className="font-sans font-bold text-slate-700 block mb-1">
                  Operation Description:
                </span>
                <p className="font-sans text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {inspectLog.details}
                </p>
              </div>

              {inspectLog.previousValue && (
                <div>
                  <span className="font-sans font-bold text-red-700 block mb-1">
                    Previous Value:
                  </span>
                  <pre className="p-3 bg-red-50/60 text-red-900 border border-red-200 rounded-xl overflow-x-auto text-[11px]">
                    {JSON.stringify(inspectLog.previousValue, null, 2)}
                  </pre>
                </div>
              )}

              {inspectLog.newValue && (
                <div>
                  <span className="font-sans font-bold text-emerald-700 block mb-1">
                    New Value:
                  </span>
                  <pre className="p-3 bg-emerald-50/60 text-emerald-900 border border-emerald-200 rounded-xl overflow-x-auto text-[11px]">
                    {JSON.stringify(inspectLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
