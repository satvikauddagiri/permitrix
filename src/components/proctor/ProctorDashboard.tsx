import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { EventRequest } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { ProctorReviewModal } from './ProctorReviewModal.tsx';
import { RequestDetailModal } from '../student/RequestDetailModal.tsx';
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Users,
  Calendar,
  ChevronRight,
  RefreshCw,
  FileText,
  GraduationCap,
} from 'lucide-react';

export const ProctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    proctor: any;
    assignedStudents: any[];
    requests: EventRequest[];
    settings: any;
    counts: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'students'>('queue');
  const [filterQueue, setFilterQueue] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentEligibilityFilter, setStudentEligibilityFilter] = useState<string>('all');
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<EventRequest | null>(null);
  const [selectedViewRequest, setSelectedViewRequest] = useState<EventRequest | null>(null);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/proctor/dashboard?proctorId=${user.id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching proctor dashboard:', e);
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
          <p className="text-sm text-slate-500 font-medium">Loading assigned students & requests...</p>
        </div>
      </div>
    );
  }

  const assignedStudents = data?.assignedStudents || [];
  const requests = data?.requests || [];
  const counts = data?.counts || { totalAssigned: 0, pendingProctorReview: 0, recommended: 0, returned: 0 };

  const filteredRequests = requests.filter(r => {
    if (filterQueue === 'pending') {
      return r.status === 'SUBMITTED' || r.status === 'RESUBMITTED';
    }
    if (filterQueue === 'reviewed') {
      return (
        r.status === 'PROCTOR_RECOMMENDED' ||
        r.status === 'PROCTOR_RECOMMENDED_REJECT' ||
        r.status === 'PROCTOR_RETURNED' ||
        r.status === 'ADMIN_APPROVED' ||
        r.status === 'ADMIN_OVERRIDE_APPROVED' ||
        r.status === 'ADMIN_REJECTED'
      );
    }
    return true;
  });

  const filteredStudents = assignedStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentDetails?.rollNo || '').toLowerCase().includes(studentSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (studentEligibilityFilter === 'all') return true;
    if (studentEligibilityFilter === 'eligible') return s.attendance?.isEligible === true;
    if (studentEligibilityFilter === 'shortage') return s.attendance?.statusLabel === 'Shortage';
    if (studentEligibilityFilter === 'issue') return s.attendance?.isEligible === false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Proctor Identity Card */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Faculty Proctor Portal</span>
            <span>·</span>
            <span>{user?.department}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {user?.proctorDetails?.designation || 'Faculty Proctor'} · {user?.proctorDetails?.cabin || 'Department Office'} · Assigned to{' '}
            <strong className="text-white">{assignedStudents.length} Students</strong>
          </p>
        </div>

        {/* Advisory Authority Tag */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Role: Academic Verification & Advisory Recommendations</span>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Assigned Cohort
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {counts.totalAssigned}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Exclusively under your care</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Reviews</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {counts.pendingProctorReview}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Requires your recommendation</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider block">
            Recommendations Sent
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1 tabular-nums">
            {counts.recommended}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Forwarded to Dean</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Returned to Students
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 tabular-nums">
            {counts.returned}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">For document correction</span>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Event Review Queue ({counts.pendingProctorReview})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'students'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Assigned Students ({assignedStudents.length})</span>
        </button>
      </div>

      {/* Tab 1: Review Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Subheader Filters */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assigned Student Requests
              </h2>
              <p className="text-xs text-slate-500">
                You only see requests submitted by students assigned to you
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setFilterQueue('pending')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                  filterQueue === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Needs Review ({counts.pendingProctorReview})
              </button>
              <button
                onClick={() => setFilterQueue('reviewed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                  filterQueue === 'reviewed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Processed
              </button>
              <button
                onClick={() => setFilterQueue('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                  filterQueue === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Requests ({requests.length})
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No requests in this queue</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All requests from your assigned students have been addressed. New submissions will appear here automatically.
              </p>
            </div>
          ) : (
            <div>
              {/* Mobile View (< 768px) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredRequests.map(req => {
                  const isActionable = req.status === 'SUBMITTED' || req.status === 'RESUBMITTED';
                  return (
                    <div key={req.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 font-semibold">{req.id}</span>
                        <span className="font-semibold text-slate-800">{req.studentName} ({req.rollNo})</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{req.eventTitle}</h3>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block">Attendance Snapshot</span>
                          <span className={`font-bold tabular-nums text-sm ${
                            req.attendanceSnapshot.isEligible ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {req.attendanceSnapshot.percentage !== null
                              ? `${req.attendanceSnapshot.percentage}%`
                              : 'Missing'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">Leave Required</span>
                          <span className="font-bold text-slate-900 tabular-nums">{req.odDays} Days</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <StatusBadge status={req.status} size="sm" />
                        {isActionable ? (
                          <button
                            onClick={() => setSelectedReviewRequest(req)}
                            className="px-3.5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-slate-800 min-h-[44px] flex items-center gap-1.5"
                          >
                            <span>Review & Recommend</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedViewRequest(req)}
                            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg min-h-[40px]"
                          >
                            View Record
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Student / Roll No</th>
                      <th className="px-4 py-3.5">Event Title & Organizer</th>
                      <th className="px-4 py-3.5">Dates / OD</th>
                      <th className="px-4 py-3.5">Attendance Snapshot</th>
                      <th className="px-4 py-3.5">Current Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRequests.map(req => {
                      const isActionable = req.status === 'SUBMITTED' || req.status === 'RESUBMITTED';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 text-sm block">{req.studentName}</span>
                            <span className="text-slate-500 font-mono text-xs">{req.rollNo}</span>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <span className="font-semibold text-slate-900 block truncate">{req.eventTitle}</span>
                            <span className="text-slate-500 text-[11px] block">{req.organizer} · {req.category}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-slate-800 font-medium block">{req.startDate} to {req.endDate}</span>
                            <span className="text-slate-500 text-[11px] font-bold tabular-nums">{req.odDays} OD Days</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm font-bold tabular-nums block ${
                              req.attendanceSnapshot.isEligible ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {req.attendanceSnapshot.percentage !== null
                                ? `${req.attendanceSnapshot.percentage}%`
                                : 'Missing'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {req.attendanceSnapshot.isEligible ? 'Meets threshold' : 'Below 75% or flagged'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            {isActionable ? (
                              <button
                                onClick={() => setSelectedReviewRequest(req)}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors min-h-[38px]"
                              >
                                Review & Recommend
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedViewRequest(req)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[36px]"
                              >
                                View Record
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assigned Students Directory */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search by student name or roll number..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={studentEligibilityFilter}
                onChange={e => setStudentEligibilityFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                <option value="all">All Assigned Students</option>
                <option value="eligible">Eligible (&gt;= 75%)</option>
                <option value="shortage">Shortage (&lt; 75%)</option>
                <option value="issue">All Flagged / Issues</option>
              </select>
            </div>
          </div>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No students found matching your search criteria.
            </div>
          ) : (
            <div>
              {/* Mobile Card Grid (< 768px) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 font-semibold">
                        {student.studentDetails?.rollNo}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        student.attendance?.statusColor === 'emerald'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {student.attendance?.statusLabel || 'Pending'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{student.name}</h3>
                    <div className="text-xs text-slate-500">{student.email}</div>

                    <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block">Attendance Rate</span>
                        <span className="font-bold text-slate-900 text-sm tabular-nums">
                          {student.attendance?.percentage !== null && student.attendance?.percentage !== undefined
                            ? `${student.attendance.percentage}%`
                            : 'Missing'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Classes</span>
                        <span className="text-slate-700 font-medium tabular-nums">
                          {student.attendance?.classesAttended ?? '—'} / {student.attendance?.classesConducted ?? '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Active Requests</span>
                        <span className="text-slate-900 font-bold tabular-nums">
                          {student.pendingRequestsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Roll No</th>
                      <th className="px-4 py-3.5">Student Name & Email</th>
                      <th className="px-4 py-3.5">Classes Attended</th>
                      <th className="px-4 py-3.5">Attendance %</th>
                      <th className="px-4 py-3.5">Eligibility Status</th>
                      <th className="px-4 py-3.5">Data Updated</th>
                      <th className="px-5 py-3.5 text-right">Open Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-700 font-semibold">
                          {student.studentDetails?.rollNo}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 text-sm block">{student.name}</span>
                          <span className="text-slate-500 text-[11px] block">{student.email}</span>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {student.attendance?.classesAttended ?? '—'} / {student.attendance?.classesConducted ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 font-bold tabular-nums">
                          <span className={
                            student.attendance?.percentage && student.attendance?.percentage >= 75
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }>
                            {student.attendance?.percentage !== null && student.attendance?.percentage !== undefined
                              ? `${student.attendance.percentage}%`
                              : 'Missing'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            student.attendance?.statusColor === 'emerald'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {student.attendance?.statusLabel || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {student.attendance?.lastUpdated || 'Never'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold tabular-nums">
                          {student.pendingRequestsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px]">
                              {student.pendingRequestsCount} Pending
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
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

      {/* Modals */}
      <ProctorReviewModal
        isOpen={!!selectedReviewRequest}
        onClose={() => setSelectedReviewRequest(null)}
        request={selectedReviewRequest}
        proctorId={user?.id || ''}
        onReviewSuccess={fetchDashboard}
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
