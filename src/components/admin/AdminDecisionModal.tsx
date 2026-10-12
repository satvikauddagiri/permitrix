import React, { useState } from 'react';
import type { EventRequest } from '../../types/index.ts';
import {
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  User,
  Calendar,
  FileText,
} from 'lucide-react';

interface AdminDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EventRequest | null;
  adminId: string;
  onDecisionSuccess: () => void;
}

export const AdminDecisionModal: React.FC<AdminDecisionModalProps> = ({
  isOpen,
  onClose,
  request,
  adminId,
  onDecisionSuccess,
}) => {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'RETURN_CORRECTION'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const attSnapshot = request.attendanceSnapshot;
  const isEligible = attSnapshot.isEligible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (decision === 'REJECT') {
      if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
        setError('A formal rejection reason is mandatory (minimum 5 characters).');
        return;
      }
    }

    if (decision === 'APPROVE' && !isEligible) {
      if (!overrideReason.trim() || overrideReason.trim().length < 10) {
        setError('Student attendance does not meet the threshold/freshness policy. An authorized Dean attendance override justification of at least 10 characters is mandatory to approve.');
        return;
      }
    }

    if (decision === 'RETURN_CORRECTION') {
      if (!remarks.trim() || remarks.trim().length < 5) {
        setError('Please specify the instructions for what the student must correct.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          decision,
          remarks: remarks.trim(),
          rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
          overrideReason: decision === 'APPROVE' && !isEligible ? overrideReason.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit administrative decision.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onDecisionSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error.');
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
              <span className="text-xs text-slate-400">· Final Administrative Order</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
              Dean Order: {request.eventTitle}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Student & Proctor Recommendation Brief */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500 font-medium">Student / Department</span>
                <div className="text-sm font-bold text-slate-900">
                  {request.studentName} ({request.rollNo}) · {request.department}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Attendance Snapshot</span>
                <span className={`text-xl font-black tabular-nums ${
                  isEligible ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {attSnapshot.percentage !== null ? `${attSnapshot.percentage}%` : 'Data Missing'}
                </span>
                <span className={`block text-[11px] font-semibold ${
                  isEligible ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {isEligible ? 'Eligible (>= 75%)' : 'Attendance Shortage / Flagged'}
                </span>
              </div>
            </div>

            {/* Proctor Recommendation Box */}
            {request.proctorReview && (
              <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/70 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-teal-950">
                    Proctor Recommendation ({request.proctorReview.proctorName}):
                  </span>
                  <span className="font-semibold text-teal-800">
                    {request.proctorReview.recommendation === 'RECOMMEND_APPROVE'
                      ? 'Recommended for Approval'
                      : request.proctorReview.recommendation === 'RECOMMEND_REJECT'
                      ? 'Recommended Rejection'
                      : 'Returned for Correction'}
                  </span>
                </div>
                <p className="text-teal-900 italic font-medium">
                  "{request.proctorReview.remarks}"
                </p>
              </div>
            )}
          </div>

          {/* Decision Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Administrative Order
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  decision === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 text-emerald-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Grant Approval</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Issue official On-Duty leave</div>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  decision === 'REJECT'
                    ? 'border-rose-600 bg-rose-50 ring-1 ring-rose-600 text-rose-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject Request</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Formal reason required</div>
              </button>

              <button
                type="button"
                onClick={() => setDecision('RETURN_CORRECTION')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  decision === 'RETURN_CORRECTION'
                    ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 text-amber-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Return for Correction</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Send back to student</div>
              </button>
            </div>
          </div>

          {/* Conditional Mandatory Inputs based on Decision */}
          {decision === 'APPROVE' && !isEligible && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Authorized Dean Attendance Override Required</span>
              </div>
              <p className="text-[11px] text-amber-800">
                The student's attendance is {attSnapshot.percentage ?? 'N/A'}% (policy threshold is 75%) or data is outdated/missing. Per academic regulation, enter official Dean authorization rationale for this override:
              </p>
              <textarea
                required
                rows={2}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="e.g. Dean Authorized Override: Verified medical certificate on file / Representing university at national level finals..."
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {decision === 'REJECT' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-2">
              <label className="block text-xs font-bold text-rose-900">
                Official Reason for Rejection <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Clash with university mid-term practical examination schedule..."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[11px] text-rose-800">
                This explanation will be permanently recorded in the student's notification and audit log.
              </p>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              General Administrative Remarks / Instructions
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Approved for 3 days On-Duty. Participation certificate must be submitted within 3 days post-event."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm rounded-xl hover:bg-slate-100 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 font-semibold text-xs sm:text-sm rounded-xl text-white shadow-md transition-colors min-h-[44px] flex items-center gap-2 ${
                decision === 'APPROVE'
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : decision === 'REJECT'
                  ? 'bg-rose-700 hover:bg-rose-600'
                  : 'bg-amber-700 hover:bg-amber-600'
              }`}
            >
              <span>{isSubmitting ? 'Finalizing...' : `Confirm ${decision === 'APPROVE' ? 'Approval' : decision === 'REJECT' ? 'Rejection' : 'Correction Order'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
