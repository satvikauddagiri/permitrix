import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { EventRequest, AuditLogItem, SystemSettings } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { AdminDecisionModal } from './AdminDecisionModal.tsx';
import { AttendanceUploadModal } from './AttendanceUploadModal.tsx';
import { RequestDetailModal } from '../student/RequestDetailModal.tsx';
import {
  Shield,
  FileSpreadsheet,
  Users,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Save,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: any;
    settings: SystemSettings;
    proctorWorkloads: any[];
    recentRequests: EventRequest[];
    recentAuditLogs: AuditLogItem[];
  } | null>(null);
  const [allRequests, setAllRequests] = useState<EventRequest[]>([]);
  const [studentsData, setStudentsData] = useState<{ students: any[]; proctors: any[] }>({
    students: [],
    proctors: [],
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview' | 'requests' | 'attendance' | 'students' | 'audit'
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'overview');

  // Modals
  const [selectedDecisionRequest, setSelectedDecisionRequest] = useState<EventRequest | null>(null);
  const [selectedViewRequest, setSelectedViewRequest] = useState<EventRequest | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Settings form state
  const [thresholdInput, setThresholdInput] = useState<number>(75);
  const [freshnessInput, setFreshnessInput] = useState<number>(30);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Filter states
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Proctor reassign state
  const [reassignStudentId, setReassignStudentId] = useState<string>('');
  const [reassignProctorId, setReassignProctorId] = useState<string>('');
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes, studsRes, auditRes] = await Promise.all([
        fetch('/api/admin/dashboard').then(r => r.json()),
        fetch('/api/admin/requests').then(r => r.json()),
        fetch('/api/admin/students').then(r => r.json()),
        fetch('/api/admin/audit-logs').then(r => r.json()),
      ]);

      setData(statsRes);
      setAllRequests(reqsRes.requests || []);
      setStudentsData(studsRes);
      setAuditLogs(auditRes.auditLogs || []);

      if (statsRes.settings) {
        setThresholdInput(statsRes.settings.attendanceThreshold);
        setFreshnessInput(statsRes.settings.freshnessLimitDays);
      }
      setLoading(false);
    } catch (e) {
      console.error('Failed to load admin data:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceThreshold: thresholdInput,
          freshnessLimitDays: freshnessInput,
          adminId: user?.id,
        }),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Settings save failed:', e);
    }
  };

  const handleReassign = async (studentId: string, newProctorId: string) => {
    if (!studentId || !newProctorId) return;
    try {
      const res = await fetch('/api/admin/students/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: [studentId],
          newProctorId,
          adminId: user?.id,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setReassignSuccess(`Student successfully reassigned to ${resJson.proctorName}.`);
        setTimeout(() => setReassignSuccess(null), 3000);
        setReassignStudentId('');
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Reassignment failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading university administrative portal...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const settings = data?.settings;

  const filteredRequests = allRequests.filter(r => {
    const matchesSearch =
      r.eventTitle.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(requestSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (requestStatusFilter === 'all') return true;
    if (requestStatusFilter === 'pending_admin') {
      return r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT';
    }
    if (requestStatusFilter === 'pending_proctor') {
      return r.status === 'SUBMITTED' || r.status === 'RESUBMITTED';
    }
    if (requestStatusFilter === 'approved') {
      return r.status === 'ADMIN_APPROVED' || r.status === 'ADMIN_OVERRIDE_APPROVED';
    }
    if (requestStatusFilter === 'rejected') {
      return r.status === 'ADMIN_REJECTED';
    }
    return true;
  });

  const filteredStudents = studentsData.students.filter(s => {
    return (
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentDetails?.rollNo || '').toLowerCase().includes(studentSearch.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Dean Administrative Header */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4" />
            <span>Academic Affairs & Dean Office</span>
            <span>·</span>
            <span>Chief Approval Officer</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {user?.name || 'Dr. Evelyn Vance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Permitrix Central Console · Threshold Policy: <strong className="text-teal-400">{settings?.attendanceThreshold}%</strong> · Freshness Limit: <strong className="text-teal-400">{settings?.freshnessLimitDays} Days</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>Import Attendance CSV</span>
          </button>

          <a
            href="/api/admin/export/requests-csv"
            download
            className="flex-1 md:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block flex items-center justify-between">
            <span>Pending Dean Orders</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 mt-1 tabular-nums">
            {stats.pendingAdmin}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Recommended by proctors</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Approved OD Requests
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">
            {stats.approved}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Official orders issued</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Enrolled Cohort
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {stats.totalStudents}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">2 Proctors assigned</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Shortage / Issues (&lt; {settings?.attendanceThreshold}%)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {stats.shortageCount + stats.missingCount + stats.outdatedCount}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Requires Dean override</span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        {[
          { key: 'overview', label: 'Overview & Queue', icon: Clock },
          { key: 'requests', label: `All Requests (${allRequests.length})`, icon: Shield },
          { key: 'attendance', label: 'Attendance & Policy', icon: FileSpreadsheet },
          { key: 'students', label: `Students & Proctors (${studentsData.students.length})`, icon: Users },
          { key: 'audit', label: 'Audit History', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & QUEUE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Responsive SVG Charts Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chart 1: Attendance Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Student Attendance Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Threshold: &gt;= {settings?.attendanceThreshold}% ({stats.eligibleCount} Eligible students)
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-800">Eligible (&gt;= {settings?.attendanceThreshold}%)</span>
                    <span className="tabular-nums text-slate-900">{stats.eligibleCount} ({Math.round((stats.eligibleCount / (stats.totalStudents || 1)) * 100)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(stats.eligibleCount / (stats.totalStudents || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-800">Shortage (&lt; {settings?.attendanceThreshold}%)</span>
                    <span className="tabular-nums text-slate-900">{stats.shortageCount} ({Math.round((stats.shortageCount / (stats.totalStudents || 1)) * 100)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(stats.shortageCount / (stats.totalStudents || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-800">Missing or Outdated (&gt; {settings?.freshnessLimitDays}d)</span>
                    <span className="tabular-nums text-slate-900">{stats.missingCount + stats.outdatedCount}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${((stats.missingCount + stats.outdatedCount) / (stats.totalStudents || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Proctor Cohort Workloads */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Faculty Proctor Workload & Cohorts
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Assigned cohorts and active review turnaround
              </p>

              <div className="space-y-4">
                {data?.proctorWorkloads?.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{p.name}</span>
                      <span className="text-[11px] text-slate-500">{p.department}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 tabular-nums block">
                        {p.assignedStudentsCount} Students
                      </span>
                      <span className="text-[11px] text-amber-700 font-medium">
                        {p.pendingReviewsCount} in queue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Final Decisions Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Requests Awaiting Final Dean Decision ({stats.pendingAdmin})
                </h2>
                <p className="text-xs text-slate-500">
                  Proctors have submitted their advisory recommendations. Final order required.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {allRequests.filter(r => r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT').length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
                No requests currently pending administrative decision.
              </div>
            ) : (
              <div>
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {allRequests
                    .filter(r => r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT')
                    .map(req => (
                      <div key={req.id} className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-500 font-semibold">{req.id}</span>
                          <span className="font-semibold text-slate-800">{req.studentName} ({req.rollNo})</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{req.eventTitle}</h4>

                        <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-teal-950">
                            <span>Proctor Rec: {req.proctorReview?.recommendation === 'RECOMMEND_APPROVE' ? 'Approval' : 'Rejection'}</span>
                            <span className="tabular-nums">Att: {req.attendanceSnapshot.percentage ?? 'N/A'}%</span>
                          </div>
                          <p className="text-teal-900 italic text-[11px]">"{req.proctorReview?.remarks}"</p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <StatusBadge status={req.status} size="sm" />
                          <button
                            onClick={() => setSelectedDecisionRequest(req)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl min-h-[44px]"
                          >
                            Issue Dean Order →
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Student / Roll</th>
                        <th className="px-4 py-3.5">Event Details</th>
                        <th className="px-4 py-3.5">Attendance</th>
                        <th className="px-4 py-3.5">Proctor Recommendation</th>
                        <th className="px-5 py-3.5 text-right">Dean Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {allRequests
                        .filter(r => r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT')
                        .map(req => (
                          <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-bold text-slate-900 block">{req.studentName}</span>
                              <span className="font-mono text-slate-500 text-[11px]">{req.rollNo} · {req.department}</span>
                            </td>
                            <td className="px-4 py-4 max-w-xs">
                              <span className="font-semibold text-slate-900 block truncate">{req.eventTitle}</span>
                              <span className="text-slate-500 text-[11px] block">{req.odDays} OD Days · {req.startDate}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                              <span className={`font-bold text-sm block ${
                                req.attendanceSnapshot.isEligible ? 'text-emerald-700' : 'text-amber-700'
                              }`}>
                                {req.attendanceSnapshot.percentage !== null
                                  ? `${req.attendanceSnapshot.percentage}%`
                                  : 'Missing'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {req.attendanceSnapshot.isEligible ? 'Eligible' : 'Override Required'}
                              </span>
                            </td>
                            <td className="px-4 py-4 max-w-sm">
                              <span className="font-semibold text-slate-900 block">
                                {req.proctorName}: {req.proctorReview?.recommendation === 'RECOMMEND_APPROVE' ? 'Endorsed Approval' : 'Recommended Rejection'}
                              </span>
                              <p className="text-slate-600 text-[11px] truncate italic">"{req.proctorReview?.remarks}"</p>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedDecisionRequest(req)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm min-h-[38px]"
                              >
                                Issue Final Order
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL EVENT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  All University Technical Event Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Search, filter, and inspect full audit decisions across all departments
                </p>
              </div>

              <a
                href="/api/admin/export/requests-csv"
                download
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-1.5 min-h-[40px] w-fit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Filtered to CSV</span>
              </a>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={requestSearch}
                  onChange={e => setRequestSearch(e.target.value)}
                  placeholder="Search by student, roll number, or event title..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>

              <select
                value={requestStatusFilter}
                onChange={e => setRequestStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 min-h-[44px]"
              >
                <option value="all">All Statuses ({allRequests.length})</option>
                <option value="pending_admin">Awaiting Dean Decision</option>
                <option value="pending_proctor">Under Proctor Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No event requests matched your filter.
            </div>
          ) : (
            <div>
              {/* Mobile Cards */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredRequests.map(req => (
                  <div key={req.id} className="p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-slate-500">{req.id}</span>
                      <span className="font-semibold text-slate-900">{req.studentName} ({req.rollNo})</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{req.eventTitle}</h4>
                    <div className="text-xs text-slate-500">
                      {req.category} · {req.odDays} OD Days · {req.startDate}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={req.status} size="sm" />
                      <button
                        onClick={() => setSelectedViewRequest(req)}
                        className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg min-h-[40px]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">ID / Event Title</th>
                      <th className="px-4 py-3.5">Student / Roll</th>
                      <th className="px-4 py-3.5">Dates / OD</th>
                      <th className="px-4 py-3.5">Attendance</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <span className="font-mono text-slate-400 text-[11px] block">{req.id}</span>
                          <span className="font-semibold text-slate-900 block truncate">{req.eventTitle}</span>
                          <span className="text-slate-500 text-[11px] block">{req.organizer}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{req.studentName}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{req.rollNo}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-slate-900 font-medium">{req.startDate}</span>
                          <span className="text-slate-500 block text-[11px] tabular-nums font-bold">{req.odDays} OD Days</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap tabular-nums font-bold">
                          {req.attendanceSnapshot.percentage !== null
                            ? `${req.attendanceSnapshot.percentage}%`
                            : 'Missing'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {(req.status === 'PROCTOR_RECOMMENDED' || req.status === 'PROCTOR_RECOMMENDED_REJECT') && (
                              <button
                                onClick={() => setSelectedDecisionRequest(req)}
                                className="px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg min-h-[36px]"
                              >
                                Decide
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedViewRequest(req)}
                              className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-lg min-h-[36px]"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE & POLICY */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Policy Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Institutional Attendance Policy Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Changes update eligibility rules across all student dashboards and review queues immediately
                </p>
              </div>

              {settingsSuccess && (
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Policies updated & logged in audit history</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mandatory Attendance Threshold (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="95"
                    required
                    value={thresholdInput}
                    onChange={e => setThresholdInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 75%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data Freshness Limit (Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="7"
                    max="90"
                    required
                    value={freshnessInput}
                    onChange={e => setFreshnessInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  />
                  <span className="text-slate-500 font-bold">Days</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 30 days</span>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-teal-400" />
                  <span>Save Policy Updates</span>
                </button>
              </div>
            </form>
          </div>

          {/* Attendance Actions & Master CSV Download */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bulk Attendance Synchronization
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate percentages using (attended / conducted) and commit updates for students.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="/api/admin/export/attendance-csv"
                download
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-2 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Export Attendance Report</span>
              </a>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New CSV Spreadsheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENTS & PROCTOR ASSIGNMENTS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Student Cohort & Proctor Allocations
                </h2>
                <p className="text-xs text-slate-500">
                  {studentsData.students.length} Total students divided among faculty proctors
                </p>
              </div>

              {reassignSuccess && (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {reassignSuccess}
                </div>
              )}
            </div>

            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search students by name or roll number..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <div key={student.id} className="p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-slate-500">{student.studentDetails?.rollNo}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      student.attendance?.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {student.attendance?.statusLabel}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                  <div className="text-xs text-slate-500">Proctor: {student.proctorName}</div>
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="font-bold tabular-nums">
                      {student.attendance?.percentage !== null ? `${student.attendance?.percentage}%` : 'Missing'}
                    </span>
                    <select
                      value={student.proctorId}
                      onChange={e => handleReassign(student.id, e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs min-h-[36px]"
                    >
                      {studentsData.proctors.map(p => (
                        <option key={p.id} value={p.id}>Assign {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Attendance %</th>
                    <th className="px-4 py-3.5">Current Proctor</th>
                    <th className="px-5 py-3.5 text-right">Reassign Proctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {student.studentDetails?.rollNo}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block">{student.name}</span>
                        <span className="text-slate-500 text-[11px] block">{student.email}</span>
                      </td>
                      <td className="px-4 py-3.5">{student.department}</td>
                      <td className="px-4 py-3.5 font-bold tabular-nums">
                        <span className={student.attendance?.percentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}>
                          {student.attendance?.percentage !== null && student.attendance?.percentage !== undefined
                            ? `${student.attendance.percentage}%`
                            : 'Missing'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900">{student.proctorName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={student.proctorId}
                          onChange={e => handleReassign(student.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 min-h-[36px]"
                        >
                          {studentsData.proctors.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              Institutional Audit History & System Logs
            </h2>
            <p className="text-xs text-slate-500">
              Chronological non-repudiable audit logs of all submissions, recommendations, overrides, and policy updates
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1">
                <div className="flex flex-wrap items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.userName}</span>
                    <span className="text-slate-500">({log.userRole})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminDecisionModal
        isOpen={!!selectedDecisionRequest}
        onClose={() => setSelectedDecisionRequest(null)}
        request={selectedDecisionRequest}
        adminId={user?.id || ''}
        onDecisionSuccess={fetchDashboardData}
      />

      <AttendanceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        adminId={user?.id || ''}
        onImportSuccess={fetchDashboardData}
      />

      <RequestDetailModal
        isOpen={!!selectedViewRequest}
        onClose={() => setSelectedViewRequest(null)}
        request={selectedViewRequest}
        currentUserId={user?.id}
        isStudent={false}
      />
    </div>
  );
};
