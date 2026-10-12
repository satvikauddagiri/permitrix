import React, { useState } from 'react';
import type { EventRequest } from '../../types/index.ts';
import {
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface ProctorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EventRequest | null;
  proctorId: string;
  onReviewSuccess: () => void;
}

export const ProctorReviewModal: React.FC<ProctorReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  proctorId,
  onReviewSuccess,
}) => {
  const [recommendation, setRecommendation] = useState<
    'RECOMMEND_APPROVE' | 'RECOMMEND_REJECT' | 'RETURN_CORRECTION'
  >('RECOMMEND_APPROVE');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!remarks.trim() || remarks.trim().length < 5) {
      setError('Please provide detailed proctor remarks explaining your recommendation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/proctor/requests/${request.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proctorId,
          recommendation,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit review.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onReviewSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setIsSubmitting(false);
    }
  };

  const attSnapshot = request.attendanceSnapshot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-teal-400 font-semibold">{request.id}</span>
              <span className="text-xs text-slate-400">· Proctor Evaluation</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
              Review: {request.eventTitle}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Student Info & Attendance Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500 font-medium">Student Name & Roll No</span>
                <div className="text-sm font-bold text-slate-900">
                  {request.studentName} ({request.rollNo})
                </div>
                <div className="text-xs text-slate-500">{request.department}</div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Current Attendance</span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {attSnapshot.percentage !== null ? `${attSnapshot.percentage}%` : 'Missing Data'}
                </span>
                <div className="text-[11px] text-slate-500">
                  {attSnapshot.attended ?? '—'} attended / {attSnapshot.conducted ?? '—'} conducted
                </div>
              </div>
            </div>

            {/* Attendance Alert if not eligible */}
            {!attSnapshot.isEligible && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Attention Proctor:</span>{' '}
                  {attSnapshot.flagReason || 'Student has attendance shortage or outdated records.'} If you recommend approval, this case will be flagged for Dean override authorization.
                </div>
              </div>
            )}
          </div>

          {/* Event Details Summary */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-600">Event Particulars</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 block">Host Organization</span>
                <span className="font-semibold text-slate-900">{request.organizer}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 block">Dates & OD Days</span>
                <span className="font-semibold text-slate-900">
                  {request.startDate} to {request.endDate} ({request.odDays} Days)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-500 block font-medium mb-1">Student Stated Objective:</span>
              <p className="text-slate-800 text-xs leading-relaxed italic">
                "{request.justification}"
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Supporting Document:</span>
                <strong className="text-slate-900 font-mono">{request.supportingDocName}</strong>
              </span>
              <span className="text-teal-700 font-semibold">Verified</span>
            </div>
          </div>

          {/* Recommendation Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Proctor Recommendation (Advisory)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRecommendation('RECOMMEND_APPROVE')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  recommendation === 'RECOMMEND_APPROVE'
                    ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600 text-teal-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span>Recommend Approval</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Endorse for Dean's final order</div>
              </button>

              <button
                type="button"
                onClick={() => setRecommendation('RECOMMEND_REJECT')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  recommendation === 'RECOMMEND_REJECT'
                    ? 'border-rose-600 bg-rose-50 ring-1 ring-rose-600 text-rose-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Recommend Rejection</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Non-recommended for OD</div>
              </button>

              <button
                type="button"
                onClick={() => setRecommendation('RETURN_CORRECTION')}
                className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                  recommendation === 'RETURN_CORRECTION'
                    ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 text-amber-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Return for Correction</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Request documents or info</div>
              </button>
            </div>
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Proctor Academic Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="State your academic observations, verification of event significance, or corrections required from student..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Remarks are recorded in the audit trail and visible to both the student and the Dean.
            </p>
          </div>

          {/* Notice on Proctor Authority */}
          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Academic Governance Policy:</strong> Faculty Proctors submit advisory evaluations. Final approval or rejection orders are issued exclusively by the Dean of Academic Affairs.
            </span>
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
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-colors min-h-[44px] flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit Recommendation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
