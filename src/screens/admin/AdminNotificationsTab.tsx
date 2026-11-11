import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Calendar,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { AppNotification, EventReminderSettings } from '../../types';

export const AdminNotificationsTab: React.FC = () => {
  const { t } = useLanguage();
  const { getEventReminderSettings, updateEventReminderSettings } = useChurchData();

  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [reminders, setReminders] = useState<EventReminderSettings>({
    send24hReminder: true,
    send2hReminder: true,
  });
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [notifsRes, remSettings] = await Promise.all([
          fetch('/api/admin/notifications', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('aogim_auth_token') || ''}`,
            },
          }),
          getEventReminderSettings(),
        ]);

        if (notifsRes.ok) {
          setAdminNotifications(await notifsRes.json());
        }
        if (remSettings) {
          setReminders(remSettings);
        }
      } catch (err) {
        console.error('Failed to load admin notifications data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [getEventReminderSettings]);

  const handleSaveReminders = async () => {
    setIsSavingReminders(true);
    setSaveSuccess(false);
    try {
      const ok = await updateEventReminderSettings(reminders);
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setIsSavingReminders(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ADMIN_ALERT':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'CAPACITY_WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'PAYMENT_APPROVED':
      case 'PAYMENT_REJECTED':
        return <CreditCard className="w-4 h-4 text-[#D4AF37]" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A192F] text-[#D4AF37]">
            Operational Center
          </span>
          <span className="text-xs text-slate-400">Alerts & Automated Reminders</span>
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900">
          {t.notifications?.adminAlertsTitle || 'Operational Admin Alerts'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time alerts regarding new member signups, event registrations, payment receipts, and automated notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operational Alerts Stream (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900">
              Live Operational Notifications
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A]">
              {adminNotifications.length} alerts
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {adminNotifications.length > 0 ? (
              adminNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors flex items-start gap-3.5"
                >
                  <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5 border border-slate-200">
                    {getAlertIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleString('en-IE', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                {t.notifications?.noNotifications || 'No operational alerts recorded yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Automated Event Reminders Configuration (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-display font-bold text-base text-slate-900">
                {t.notifications?.reminderSettings || 'Automated Event Reminders'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Configure scheduled event notification delivery to confirmed attendees.
            </p>

            <div className="space-y-4 text-xs">
              {/* 24h Toggle */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={reminders.send24hReminder}
                  onChange={(e) =>
                    setReminders({ ...reminders, send24hReminder: e.target.checked })
                  }
                  className="w-4 h-4 mt-0.5 text-[#0A192F] rounded border-slate-300 focus:ring-[#0A192F]"
                />
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    24-Hour Event Reminder
                  </span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    {t.notifications?.reminder24h ||
                      'Send automated reminder 24 hours before event'}
                  </span>
                </div>
              </label>

              {/* 2h Toggle */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={reminders.send2hReminder}
                  onChange={(e) =>
                    setReminders({ ...reminders, send2hReminder: e.target.checked })
                  }
                  className="w-4 h-4 mt-0.5 text-[#0A192F] rounded border-slate-300 focus:ring-[#0A192F]"
                />
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    2-Hour Event Reminder
                  </span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    {t.notifications?.reminder2h ||
                      'Send automated reminder 2 hours before event'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reminder settings updated successfully!</span>
              </div>
            )}
            <button
              onClick={handleSaveReminders}
              disabled={isSavingReminders}
              className="w-full py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>
                {isSavingReminders
                  ? 'Saving...'
                  : t.notifications?.saveReminders || 'Save Reminder Preferences'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
