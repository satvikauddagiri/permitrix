import React, { useState } from 'react';
import type { EventRequest } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import {
  X,
  Calendar,
  MapPin,
  Building,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  User,
  Shield,
  FileCheck,
} from 'lucide-react';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EventRequest | null;
  currentUserId?: string;
  isStudent?: boolean;
  onResubmitSuccess?: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUserId,
  isStudent,
  onResubmitSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [editDocName, setEditDocName] = useState('');
  const [resubmissionRemarks, setResubmissionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const canResubmit =
    isStudent &&
    (request.status === 'PROCTOR_RETURNED' || request.status === 'ADMIN_RETURNED') &&
    request.studentId === currentUserId;

  const handleStartEdit = () => {
    setEditTitle(request.eventTitle);
    setEditJustification(request.justification);
    setEditDocName(request.supportingDocName);
    setResubmissionRemarks('');
    setIsEditing(true);
    setError(null);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/student/requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUserId,
          eventTitle: editTitle,
          justification: editJustification,
          supportingDocName: editDocName,
          resubmissionRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resubmit request.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsEditing(false);
      if (onResubmitSuccess) {
        onResubmitSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-teal-400 font-semibold">{request.id}</span>
              <span className="text-xs text-slate-400">· {request.category}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
              {request.eventTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Status & Key Metrics Strip */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Current Workflow Status</div>
              <StatusBadge status={request.status} />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">OD Days</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">{request.odDays} Days</span>
              </div>
              <div className="border-l pl-4 border-slate-200">
                <span className="text-slate-500 block">Attendance at Submission</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {request.attendanceSnapshot.percentage !== null
                    ? `${request.attendanceSnapshot.percentage}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* If Returned and Student, show Alert Callout with Action */}
          {canResubmit && !isEditing && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold">This request was returned for correction</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    {request.status === 'PROCTOR_RETURNED'
                      ? `Proctor Remarks: "${request.proctorReview?.remarks}"`
                      : `Dean Remarks: "${request.adminDecision?.remarks}"`}
                  </p>
                  <button
                    onClick={handleStartEdit}
                    className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 min-h-[40px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Edit & Resubmit Request</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit & Resubmit Form */}
          {isEditing ? (
            <form onSubmit={handleResubmit} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>Resubmission Form</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Cancel Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Updated Justification / Corrections Addressed
                </label>
                <textarea
                  rows={3}
                  required
                  value={editJustification}
                  onChange={e => setEditJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Updated Supporting Document Name / URL
                </label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={e => setEditDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes for Reviewer (Explaining What Was Fixed) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attached requested brochure and registration confirmation"
                  value={resubmissionRemarks}
                  onChange={e => setResubmissionRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 min-h-[44px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-900 text-white font-semibold text-xs rounded-lg hover:bg-indigo-800 flex items-center gap-2 min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Resubmitting...' : 'Submit Corrections'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Standard Event Details View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 block">Student & Roll No</span>
                  <span className="font-semibold text-slate-900 text-sm">{request.studentName}</span>
                  <span className="text-slate-500 block font-mono mt-0.5">{request.rollNo} · {request.department}</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 block">Assigned Proctor</span>
                  <span className="font-semibold text-slate-900 text-sm">{request.proctorName}</span>
                  <span className="text-slate-500 block mt-0.5">Faculty Academic Proctor</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 block">Organizer & Mode</span>
                  <span className="font-semibold text-slate-900">{request.organizer}</span>
                  <span className="text-slate-500 block mt-0.5">{request.mode} ({request.location})</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 block">Dates & Duration</span>
                  <span className="font-semibold text-slate-900">
                    {request.startDate} to {request.endDate}
                  </span>
                  <span className="text-slate-500 block mt-0.5 font-bold tabular-nums">
                    {request.odDays} On-Duty Days
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Justification & Objectives
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {request.justification}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supporting Documents
                </h4>
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-slate-800">{request.supportingDocName}</span>
                  </div>
                  <span className="text-teal-600 font-medium">Verified Attachment</span>
                </div>
              </div>

              {/* Remarks Sections */}
              {request.proctorReview && (
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-teal-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-700" />
                      <span>Proctor Recommendation ({request.proctorReview.proctorName})</span>
                    </span>
                    <span className="text-teal-800 text-[11px] font-medium">
                      {request.proctorReview.reviewedAt.split('T')[0]}
                    </span>
                  </div>
                  <p className="text-teal-900 leading-relaxed font-medium">
                    "{request.proctorReview.remarks}"
                  </p>
                </div>
              )}

              {request.adminDecision && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  request.adminDecision.decision === 'APPROVE'
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : request.adminDecision.decision === 'REJECT'
                    ? 'border-rose-200 bg-rose-50/60 text-rose-950'
                    : 'border-amber-200 bg-amber-50/60 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Administrator Decision ({request.adminDecision.adminName})</span>
                    </span>
                    <span className="text-[11px]">
                      {request.adminDecision.decidedAt.split('T')[0]}
                    </span>
                  </div>
                  {request.adminDecision.rejectionReason && (
                    <p className="text-rose-900 font-semibold mb-1">
                      Reason for Rejection: "{request.adminDecision.rejectionReason}"
                    </p>
                  )}
                  {request.adminDecision.overrideReason && (
                    <p className="text-teal-900 font-semibold mb-1">
                      Dean Authorized Attendance Override: "{request.adminDecision.overrideReason}"
                    </p>
                  )}
                  {request.adminDecision.remarks && (
                    <p className="leading-relaxed opacity-90">
                      Dean Remarks: "{request.adminDecision.remarks}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Audit Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Review & Decision History
            </h4>
            <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
              {request.timeline.map((entry, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {entry.action} · <span className="text-slate-600 font-normal">{entry.actorName} ({entry.actorRole})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {entry.timestamp.split('T')[0]}
                    </span>
                  </div>
                  {entry.remarks && (
                    <p className="text-slate-600 mt-0.5 text-[11px] italic bg-slate-50 p-1.5 rounded">
                      {entry.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
