import React, { useState } from 'react';
import type { AttendanceImportPreviewRow } from '../../types/index.ts';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AttendanceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  onImportSuccess: () => void;
}

const SAMPLE_CSV = `Roll No,Classes Conducted,Classes Attended,Attendance Date
23CS001,128,118,2026-10-12
23CS002,128,114,2026-10-12
23CS005,128,90,2026-10-12
23CS010,128,102,2026-10-12
23CS011,128,105,2026-10-12
23CS016,128,104,2026-10-12
23CS022,128,100,2026-10-12
23CS023,128,98,2026-10-12
23CS032,128,96,2026-10-12`;

export const AttendanceUploadModal: React.FC<AttendanceUploadModalProps> = ({
  isOpen,
  onClose,
  adminId,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validCount: number;
    errorCount: number;
    preview: AttendanceImportPreviewRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleParseAndPreview = async () => {
    if (!csvContent.trim()) {
      setError('Please select a CSV file or paste CSV text.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/attendance/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to parse attendance file.');
        setIsLoading(false);
        return;
      }

      setPreviewData(data);
      setStep('preview');
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validCount === 0) {
      setError('No valid rows available to import.');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await fetch('/api/admin/attendance/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: previewData.preview,
          adminId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save attendance records.');
        setIsConfirming(false);
        return;
      }

      setIsConfirming(false);
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setIsConfirming(false);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permitrix_attendance_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Import Student Attendance File
              </h2>
              <p className="text-xs text-slate-300">
                Upload Excel/CSV · Automatic Percentage Calculation · Preview Before Commit
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' ? (
            <div className="space-y-4">
              {/* Template Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Required Columns format:</span>
                  <p className="text-slate-600 font-mono mt-0.5">
                    Roll No, Classes Conducted, Classes Attended, Attendance Date
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 flex items-center gap-1.5 min-h-[36px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvContent(SAMPLE_CSV);
                      setFileName('sample_attendance.csv');
                    }}
                    className="px-3 py-1.5 bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 rounded-lg font-semibold flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Load Demo CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  {fileName ? `Selected: ${fileName}` : 'Click to select CSV or spreadsheet file'}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supported formats: .csv, .txt (Comma Separated Values)
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Or Paste CSV text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Or Paste CSV Data Directly:
                  </label>
                  {csvContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvContent('');
                        setFileName('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={e => setCsvContent(e.target.value)}
                  placeholder="Roll No,Classes Conducted,Classes Attended,Attendance Date&#10;23CS001,128,118,2026-10-12..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm rounded-xl hover:bg-slate-100 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseAndPreview}
                  disabled={isLoading || !csvContent.trim()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md min-h-[44px] flex items-center gap-2"
                >
                  {isLoading ? 'Parsing Data...' : 'Parse & Validate Rows →'}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Preview & Validation Table */
            <div className="space-y-4">
              {/* Validation Summary Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block">Total Rows</span>
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {previewData?.totalRows}
                    </span>
                  </div>
                  <div className="border-l pl-4 border-slate-200">
                    <span className="text-emerald-700 font-semibold block">Valid to Import</span>
                    <span className="text-base font-bold text-emerald-700 tabular-nums">
                      {previewData?.validCount}
                    </span>
                  </div>
                  {previewData && previewData.errorCount > 0 && (
                    <div className="border-l pl-4 border-slate-200">
                      <span className="text-rose-700 font-semibold block">Flagged Errors</span>
                      <span className="text-base font-bold text-rose-700 tabular-nums">
                        {previewData.errorCount}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline"
                >
                  ← Edit / Re-upload File
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Roll No</th>
                      <th className="px-3 py-2.5">Student Match</th>
                      <th className="px-3 py-2.5">Attended / Total</th>
                      <th className="px-3 py-2.5">Calculated %</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewData?.preview.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-900">
                          {row.rollNo}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.studentFound ? (
                            <span className="text-slate-900 font-medium">{row.name || 'Matched'}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">New Student</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {row.classesAttended} / {row.classesConducted}
                        </td>
                        <td className="px-3 py-2.5 font-bold tabular-nums">
                          <span className={row.percentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}>
                            {row.percentage}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 tabular-nums">
                          {row.attendanceDate}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]" title={row.validationError}>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{row.validationError}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm rounded-xl hover:bg-slate-100 min-h-[44px]"
                >
                  Back to File
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isConfirming || !previewData || previewData.validCount === 0}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md min-h-[44px] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isConfirming
                      ? 'Importing...'
                      : `Confirm & Commit ${previewData?.validCount} Records`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
