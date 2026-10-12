import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { EventRequest, AttendanceRecord } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { NewRequestModal } from './NewRequestModal.tsx';
import { RequestDetailModal } from './RequestDetailModal.tsx';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Bell,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    attendance: AttendanceRecord;
    requests: EventRequest[];
    settings: any;
    notifications: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'attendance'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/student/dashboard?studentId=${user.id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching student dashboard:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading student records & attendance...</p>
        </div>
      </div>
    );
  }

  const attendance = data?.attendance;
  const requests = data?.requests || [];
  const notifications = data?.notifications || [];

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') {
      return (
        r.status === 'SUBMITTED' ||
        r.status === 'RESUBMITTED' ||
        r.status === 'PROCTOR_RECOMMENDED' ||
        r.status === 'PROCTOR_RECOMMENDED_REJECT'
      );
    }
    if (filterStatus === 'approved') {
      return r.status === 'ADMIN_APPROVED' || r.status === 'ADMIN_OVERRIDE_APPROVED';
    }
    if (filterStatus === 'action_needed') {
      return r.status === 'PROCTOR_RETURNED' || r.status === 'ADMIN_RETURNED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Student Identity & Primary CTA */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <span>Student Academic Portal</span>
            <span>·</span>
            <span>{user?.studentDetails?.rollNo || 'Roll No'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Department of {user?.department} · Batch {user?.studentDetails?.batch} · Assigned Proctor:{' '}
            <span className="text-teal-300 font-medium">{user?.studentDetails?.proctorName || 'Faculty Proctor'}</span>
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="w-full md:w-auto px-5 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Technical Event Request</span>
        </button>
      </div>

      {/* Attendance & Eligibility Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Metric Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Current Semester Attendance
              </h2>
              <span className="text-xs text-slate-400">
                Official criteria threshold: {data?.settings?.attendanceThreshold || 75}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                attendance?.statusColor === 'emerald'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : attendance?.statusColor === 'amber'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {attendance?.statusLabel || 'Evaluation Pending'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Attendance Percentage</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums">
                  {attendance?.percentage !== null && attendance?.percentage !== undefined
                    ? `${attendance.percentage}%`
                    : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {attendance?.percentage !== null && attendance?.percentage !== undefined && attendance.percentage >= (data?.settings?.attendanceThreshold || 75)
                  ? 'Eligible for direct approval'
                  : 'Requires administrative override'}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Class Attendance Record</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums">
                {attendance?.classesAttended ?? '—'} / {attendance?.classesConducted ?? '—'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Attended / Total Conducted
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Data Freshness Date</span>
              <div className="text-sm font-semibold text-slate-800">
                {attendance?.lastUpdated || 'Never Imported'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {attendance?.daysOld !== undefined ? `${attendance.daysOld} days old` : 'Freshness unverified'}
              </p>
            </div>
          </div>

          {/* Warning Callout if Shortage, Missing or Outdated */}
          {attendance && !attendance.isEligible && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 mt-1">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Attendance Verification Notice:</span>
                <p className="text-xs text-amber-800 mt-0.5">
                  {attendance.flagReason ||
                    'Your attendance is below the mandatory threshold or outdated. Event requests can still be submitted, but will flag for faculty proctor review and require an authorized Administrative Dean override.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Summary / Workflow Helper */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Duty Leave (OD) Rules</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-600 shrink-0">1.</span>
                <span>Minimum <strong>{data?.settings?.attendanceThreshold || 75}% attendance</strong> required for standard fast-track approval.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-600 shrink-0">2.</span>
                <span>Proctors submit advisory recommendations; Dean issues final orders.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-600 shrink-0">3.</span>
                <span>If returned for correction, update details and resubmit before event start date.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Academic Year: {data?.settings?.academicYear}</span>
            <span className="text-teal-700 font-semibold">{requests.length} Requests Total</span>
          </div>
        </div>
      </div>

      {/* Requests Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header with Segmented Filter Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Event Approval Requests
            </h2>
            <p className="text-xs text-slate-500">
              Track multi-stage approvals, proctor remarks, and dean decisions
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                filterStatus === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Under Review
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                filterStatus === 'approved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('action_needed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                filterStatus === 'action_needed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returned / Action Needed
            </button>
          </div>
        </div>

        {/* Requests Content */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No event requests found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any event requests under this filter. Tap below to submit your first technical event request.
            </p>
            <button
              onClick={() => setIsNewRequestOpen(true)}
              className="mt-4 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 min-h-[44px]"
            >
              + Create First Request
            </button>
          </div>
        ) : (
          <div>
            {/* Mobile Card View (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 font-semibold">{req.id}</span>
                    <span className="text-slate-500">{req.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {req.eventTitle}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.startDate} to {req.endDate} · <strong className="text-slate-900">{req.odDays} OD Days</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>Host: {req.organizer}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <StatusBadge status={req.status} size="sm" />
                    <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                      Details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Highlighting Proctor / Admin Remarks snippet */}
                  {(req.status === 'PROCTOR_RETURNED' || req.status === 'ADMIN_RETURNED') && (
                    <div className="p-2 rounded bg-amber-50 text-[11px] text-amber-800 border border-amber-200">
                      <strong>Action Needed:</strong> Returned for correction. Tap to view notes & resubmit.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">ID / Event Title</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Dates / OD</th>
                    <th className="px-4 py-3.5">Attendance Snap</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-slate-400 text-[11px] block">{req.id}</span>
                        <span className="font-semibold text-slate-900 text-sm">{req.eventTitle}</span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">{req.organizer}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {req.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{req.startDate}</div>
                        <div className="text-slate-500 text-[11px] font-bold tabular-nums">{req.odDays} OD Days</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        <span className={`font-semibold ${
                          req.attendanceSnapshot.percentage && req.attendanceSnapshot.percentage >= 75
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}>
                          {req.attendanceSnapshot.percentage !== null
                            ? `${req.attendanceSnapshot.percentage}%`
                            : 'Missing'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg min-h-[36px]"
                        >
                          View Details
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

      {/* Modals */}
      <NewRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        onSubmitSuccess={fetchDashboard}
        studentId={user?.id || ''}
        attendanceData={attendance}
      />

      <RequestDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        currentUserId={user?.id}
        isStudent={true}
        onResubmitSuccess={fetchDashboard}
      />
    </div>
  );
};
