import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { User } from '../../types/index.ts';
import { Shield, GraduationCap, UserCheck, Check, Sparkles, X, AlertCircle } from 'lucide-react';

interface DemoAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoleRoute?: (role: string) => void;
}

export const DemoAccountsModal: React.FC<DemoAccountsModalProps> = ({ isOpen, onClose, onSelectRoleRoute }) => {
  const { user: currentUser, switchUser } = useAuth();
  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/auth/demo-accounts')
        .then(res => res.json())
        .then(data => {
          setDemoData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed loading demo accounts:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitch = async (email: string, password: string, role: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.user) {
        switchUser(data.user);
        if (onSelectRoleRoute) {
          onSelectRoleRoute(`/${data.user.role}`);
        }
        onClose();
      }
    } catch (e) {
      console.error('Switch failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Quick Demo Account Switcher</h3>
              <p className="text-xs text-slate-300">Test Permitrix workflows instantly with pre-seeded personas</p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading pre-seeded accounts...</div>
          ) : (
            <>
              {/* Administrator */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">Administrator (Full Approval Authority)</span>
                </div>
                {demoData?.admin && (
                  <div
                    onClick={() => handleSwitch(demoData.admin.email, demoData.admin.password, 'admin')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentUser?.role === 'admin'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{demoData.admin.name}</span>
                        <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">Dean of Academics</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {demoData.admin.email} · Password: <code className="text-slate-700 font-mono">admin123</code>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Capabilities: Final Approvals/Rejections, Attendance Overrides, Excel/CSV Imports, Threshold Policies, Audit History.
                      </p>
                    </div>
                    <button
                      className="ml-3 shrink-0 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 min-h-[40px]"
                    >
                      {currentUser?.role === 'admin' ? 'Active' : 'Switch'}
                    </button>
                  </div>
                )}
              </div>

              {/* Proctors */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">Faculty Proctors (Recommendation Authority)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {demoData?.proctors?.map((p: any, idx: number) => {
                    const isCurrent = currentUser?.email === p.email;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSwitch(p.email, p.password, 'proctor')}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-1 ring-teal-500'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                            <span className="text-[10px] font-medium text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                              {idx === 0 ? 'CS Dept (18 Students)' : 'IT Dept (18 Students)'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {p.email} · Pass: <code className="text-slate-700 font-mono">proctor123</code>
                          </div>
                          <p className="text-xs text-slate-600 mt-2">
                            Assigned to {idx === 0 ? 'Students 23CS001 – 23CS018' : 'Students 23CS019 – 23CS036'}
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                          <span className="text-xs font-semibold text-teal-700">
                            {isCurrent ? 'Current Persona' : 'Switch to Proctor →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Students */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">Sample Students (Various Attendance Scenarios)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Eligible Student */}
                  <div
                    onClick={() => handleSwitch('student.aarav.patel@university.edu', 'student123', 'student')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Aarav Patel (23CS001)</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">91.2% Attendance</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">High Attendance · Pending Hackathon Request</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Switch</span>
                  </div>

                  {/* Low Attendance Student */}
                  <div
                    onClick={() => handleSwitch('student.vikram.malhotra@university.edu', 'student123', 'student')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Vikram Malhotra (23CS005)</span>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">71.4% (Shortage)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Below 75% Threshold · Returned Request</p>
                    </div>
                    <span className="text-xs text-amber-700 font-medium">Switch</span>
                  </div>

                  {/* Outdated Attendance Student */}
                  <div
                    onClick={() => handleSwitch('student.alisha.d.souza@university.edu', 'student123', 'student')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Alisha D'Souza (23CS022)</span>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Outdated (48d)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">79% Attendance but &gt;30d old limit</p>
                    </div>
                    <span className="text-xs text-amber-700 font-medium">Switch</span>
                  </div>

                  {/* Missing Attendance Student */}
                  <div
                    onClick={() => handleSwitch('student.varun.nambiar@university.edu', 'student123', 'student')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Varun Nambiar (23CS023)</span>
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">Missing Data</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">No attendance imported yet</p>
                    </div>
                    <span className="text-xs text-rose-700 font-medium">Switch</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All 36 students and 2 proctors are seeded in the database.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
