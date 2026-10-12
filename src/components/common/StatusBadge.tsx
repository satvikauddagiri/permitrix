import React from 'react';
import type { RequestStatus } from '../../types/index.ts';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const textClass = isSm ? 'text-xs' : 'text-xs font-medium';
  const iconSize = isSm ? 'w-3.5 h-3.5' : 'w-4 h-4';

  switch (status) {
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-2.5 py-1 ${textClass}`}>
          <Send className={`${iconSize} shrink-0`} />
          <span className="whitespace-nowrap">Submitted · Pending Proctor</span>
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded px-2.5 py-1 ${textClass}`}>
          <RotateCcw className={`${iconSize} shrink-0`} />
          <span className="whitespace-nowrap">Resubmitted · Pending Proctor</span>
        </span>
      );
    case 'PROCTOR_RECOMMENDED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-teal-800 bg-teal-50 border border-teal-200/60 rounded px-2.5 py-1 ${textClass}`}>
          <Clock className={`${iconSize} shrink-0 text-teal-600`} />
          <span className="whitespace-nowrap">Proctor Recommended · Pending Dean</span>
        </span>
      );
    case 'PROCTOR_RECOMMENDED_REJECT':
      return (
        <span className={`inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/60 rounded px-2.5 py-1 ${textClass}`}>
          <AlertTriangle className={`${iconSize} shrink-0 text-amber-600`} />
          <span className="whitespace-nowrap">Proctor Not Recommended · Pending Dean</span>
        </span>
      );
    case 'PROCTOR_RETURNED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-300 rounded px-2.5 py-1 ${textClass}`}>
          <RotateCcw className={`${iconSize} shrink-0 text-amber-600`} />
          <span className="whitespace-nowrap">Returned for Correction (Proctor)</span>
        </span>
      );
    case 'ADMIN_APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 ${textClass}`}>
          <CheckCircle2 className={`${iconSize} shrink-0 text-emerald-600`} />
          <span className="whitespace-nowrap font-semibold">Approved by Dean</span>
        </span>
      );
    case 'ADMIN_OVERRIDE_APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-teal-900 bg-teal-50 border border-teal-300 rounded px-2.5 py-1 ${textClass}`}>
          <ShieldCheck className={`${iconSize} shrink-0 text-teal-700`} />
          <span className="whitespace-nowrap font-semibold">Approved (Authorized Override)</span>
        </span>
      );
    case 'ADMIN_REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-rose-800 bg-rose-50 border border-rose-200 rounded px-2.5 py-1 ${textClass}`}>
          <XCircle className={`${iconSize} shrink-0 text-rose-600`} />
          <span className="whitespace-nowrap font-semibold">Rejected by Dean</span>
        </span>
      );
    case 'ADMIN_RETURNED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-amber-900 bg-amber-50 border border-amber-300 rounded px-2.5 py-1 ${textClass}`}>
          <RotateCcw className={`${iconSize} shrink-0 text-amber-700`} />
          <span className="whitespace-nowrap font-semibold">Returned for Correction (Dean)</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 rounded px-2.5 py-1 ${textClass}`}>
          <span>{status}</span>
        </span>
      );
  }
};
