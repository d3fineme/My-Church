import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Calendar,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useChurchData } from '../../context/ChurchDataContext';
import { User, UserRole } from '../../types';

interface AdminMembersTabProps {
  members: User[];
  onRefreshMembers: () => Promise<void>;
}

export const AdminMembersTab: React.FC<AdminMembersTabProps> = ({
  members,
  onRefreshMembers,
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { updateUserRole } = useChurchData();

  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'DISABLED'>('all');

  // Member profile drawer
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Role edit state
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Get unique countries for filter dropdown
  const countries = Array.from(
    new Set(members.map((m) => m.countryOfOrigin).filter(Boolean))
  ).sort();

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      (m.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (countryFilter !== 'all' && m.countryOfOrigin !== countryFilter) return false;
    if (statusFilter !== 'all' && m.accountStatus !== statusFilter) return false;
    return true;
  });

  const handleOpenDrawer = async (member: User) => {
    setSelectedMember(member);
    setIsLoadingHistory(true);
    setRoleFeedback(null);
    try {
      // Fetch member's registered events history
      const res = await fetch(`/api/admin/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('aogim_auth_token') || ''}`,
        },
      });
      // Set member history if available from API
      setMemberHistory([]);
    } catch (err) {
      console.error('Failed to load member details', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleToggleStatus = async (member: User) => {
    if (member.id === currentUser?.id) {
      alert(t.admin.adminUserProtected);
      return;
    }
    const newStatus = member.accountStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/members/${member.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aogim_auth_token') || ''}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await onRefreshMembers();
        if (selectedMember && selectedMember.id === member.id) {
          setSelectedMember({ ...selectedMember, accountStatus: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedMember || !isSuperAdmin) return;
    setIsUpdatingRole(true);
    setRoleFeedback(null);
    try {
      const res = await updateUserRole(selectedMember.id, newRole);
      if (res.success) {
        setSelectedMember({ ...selectedMember, role: newRole });
        setRoleFeedback(t.roles?.roleUpdated || 'User role updated successfully.');
        await onRefreshMembers();
      } else {
        setRoleFeedback(res.error || 'Failed to update role.');
      }
    } catch {
      setRoleFeedback('Network error updating role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EVENT_MANAGER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'FINANCE_MANAGER':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A192F] text-[#D4AF37]">
              Community Management
            </span>
            <span className="text-xs text-slate-400">Registered App Accounts</span>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            {t.admin.membersList || 'Registered Members Center'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search registered church members, inspect registration history, assign staff roles, and manage account statuses.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold self-start md:self-center">
          {members.length} Total Users
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.admin.searchMembers || 'Search by name or email...'}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 w-56 focus:outline-hidden focus:ring-2 focus:ring-[#0A192F]"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{t.admin.filterCountry}:</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
            >
              <option value="all">{t.admin.allCountries || 'All Countries'}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{t.common.status}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">{t.common.active || 'Active'}</option>
              <option value="DISABLED">{t.common.disabled || 'Disabled'}</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400 font-medium">
          Showing {filteredMembers.length} of {members.length}
        </span>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Country</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                          {member.profilePhoto ? (
                            <img
                              src={member.profilePhoto}
                              alt={member.fullName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {member.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {member.countryOfOrigin}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadge(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          member.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.accountStatus === 'ACTIVE' ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {member.accountStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(member)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          disabled={member.id === currentUser?.id}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            member.accountStatus === 'ACTIVE'
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          } disabled:opacity-30`}
                          title={
                            member.accountStatus === 'ACTIVE' ? 'Disable Account' : 'Reactivate Account'
                          }
                        >
                          {member.accountStatus === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No members match search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Drawer Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 bg-[#0A192F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-[#D4AF37] font-bold text-sm flex items-center justify-center border border-[#D4AF37]/30">
                  {selectedMember.profilePhoto ? (
                    <img
                      src={selectedMember.profilePhoto}
                      alt={selectedMember.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedMember.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {selectedMember.fullName}
                  </h3>
                  <p className="text-xs text-slate-300">{selectedMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Member Contact & Meta */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Country of Origin:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedMember.countryOfOrigin}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Member Since:</span>
                  <span className="text-slate-700">
                    {new Date(selectedMember.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Account Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedMember.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedMember.accountStatus}
                  </span>
                </div>
              </div>

              {/* Role Assignment Section (Only SUPER_ADMIN can modify) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#0A192F]" />
                    {t.roles?.manageRoles || 'Role & System Permissions'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(
                      selectedMember.role
                    )}`}
                  >
                    {selectedMember.role}
                  </span>
                </div>

                {isSuperAdmin ? (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      {t.roles?.newRole || 'Assign Role'} (Super Admin Action):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          'SUPER_ADMIN',
                          'ADMIN',
                          'EVENT_MANAGER',
                          'FINANCE_MANAGER',
                          'MEMBER',
                        ] as UserRole[]
                      ).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          disabled={
                            isUpdatingRole ||
                            selectedMember.role === r ||
                            (selectedMember.id === currentUser?.id && r !== 'SUPER_ADMIN')
                          }
                          className={`px-3 py-2 rounded-xl text-left font-semibold text-[11px] transition-all border ${
                            selectedMember.role === r
                              ? 'bg-[#0A192F] text-white border-[#0A192F]'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          } disabled:opacity-40`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    {t.roles?.superAdminOnlyNotice ||
                      'Only Super Administrators can assign or modify user roles.'}
                  </p>
                )}

                {roleFeedback && (
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{roleFeedback}</span>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Access Control</span>
                <button
                  onClick={() => handleToggleStatus(selectedMember)}
                  disabled={selectedMember.id === currentUser?.id}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                    selectedMember.accountStatus === 'ACTIVE'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  } disabled:opacity-40`}
                >
                  {selectedMember.accountStatus === 'ACTIVE'
                    ? 'Disable Account'
                    : 'Reactivate Account'}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
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
