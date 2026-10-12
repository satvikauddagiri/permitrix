import React, { useState } from 'react';
import type { EventCategory } from '../../types/index.ts';
import {
  X,
  Calendar,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Upload,
} from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  studentId: string;
  attendanceData?: {
    percentage: number | null;
    isEligible?: boolean;
    statusLabel?: string;
  };
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  studentId,
  attendanceData,
}) => {
  const [eventTitle, setEventTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState<'In-Person' | 'Virtual' | 'Hybrid'>('In-Person');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [odDays, setOdDays] = useState('2');
  const [justification, setJustification] = useState('');
  const [supportingDocName, setSupportingDocName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventTitle || !startDate || !endDate || !organizer) {
      setError('Please fill in all mandatory event details.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Event End Date cannot be earlier than Start Date.');
      return;
    }

    if (Number(odDays) <= 0) {
      setError('On-Duty days requested must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          eventTitle,
          category,
          organizer,
          location: location || (mode === 'Virtual' ? 'Online' : 'University Venue'),
          mode,
          startDate,
          endDate,
          odDays: Number(odDays),
          justification,
          supportingDocName: supportingDocName || `${category}_Invitation_${Date.now()}.pdf`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit request.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error submitting request.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Submit Technical Event OD Request
            </h2>
            <p className="text-xs text-slate-300">
              Your request will be routed to your assigned proctor with your current attendance snapshot
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Attendance Eligibility Snapshot Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Attached Attendance Snapshot:</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {attendanceData?.percentage !== null && attendanceData?.percentage !== undefined
                  ? `${attendanceData.percentage}%`
                  : 'Data Missing'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                attendanceData?.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {attendanceData?.statusLabel || 'Evaluation Pending'}
              </span>
            </div>
            {!attendanceData?.isEligible && (
              <span className="text-amber-700 font-medium">
                Note: Will require administrative override
              </span>
            )}
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="e.g. National Inter-College Hackathon 2026"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>

          {/* Category & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Conference">Conference / Paper Presentation</option>
                <option value="Workshop">Technical Workshop / Hands-on Bootcamp</option>
                <option value="Coding Contest">Competitive Coding / CTF</option>
                <option value="Project Expo">Project Exhibition / BattleBots</option>
                <option value="Technical Symposium">Technical Symposium</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Mode
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                <option value="In-Person">In-Person (Onsite)</option>
                <option value="Virtual">Virtual / Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Organizer & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Host Institution / Organizer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                placeholder="e.g. IIT Delhi / IEEE Student Branch"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Venue / City
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. New Delhi / Virtual Portal"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Dates & OD Days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OD Days Requested <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={odDays}
                onChange={e => setOdDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Justification & Objectives <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="State your role (participant, paper presenter, team lead), expected outcomes, and why duty leave is required..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Supporting Document Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supporting Document (Acceptance Letter / Invitation Pass / Brochure)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={supportingDocName}
                onChange={e => setSupportingDocName(e.target.value)}
                placeholder="e.g. IIT_Delhi_Finalist_Invitation.pdf"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setSupportingDocName(`Official_Invitation_${Date.now().toString().slice(-4)}.pdf`)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-300 min-h-[44px] flex items-center gap-1.5 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Attach Sample</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
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
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2 min-h-[44px] active:scale-[0.98]"
            >
              <Send className="w-4 h-4 text-teal-400" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Event Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
