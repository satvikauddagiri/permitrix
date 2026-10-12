import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Role } from '../../types/index.ts';
import {
  GraduationCap,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  role: Role;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ role, onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleConfig = {
    student: {
      title: 'Student Portal',
      subtitle: 'Technical event duty-leave submissions and attendance eligibility tracking',
      icon: <GraduationCap className="w-6 h-6 text-blue-400" />,
      badge: 'Student Access',
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
      defaultEmail: 'student.aarav.patel@university.edu',
      defaultPass: 'student123',
      defaultName: 'Aarav Patel (23CS001)',
      redirectPath: '/student',
      note: 'Students must use administrator-assigned university email accounts. Public registration is disabled.',
    },
    proctor: {
      title: 'Faculty Proctor Portal',
      subtitle: 'Review assigned students, verify attendance eligibility, and submit recommendations',
      icon: <UserCheck className="w-6 h-6 text-teal-400" />,
      badge: 'Faculty Proctor',
      badgeColor: 'bg-teal-900/60 text-teal-300 border-teal-700/60',
      defaultEmail: 'proctor.sharma@university.edu',
      defaultPass: 'proctor123',
      defaultName: 'Prof. Rajesh Sharma (CS Dept)',
      redirectPath: '/proctor',
      note: 'Faculty credentials are provisioned by Academic Affairs. Proctors make advisory recommendations; final authority rests with the Dean.',
    },
    admin: {
      title: 'Administrator Portal',
      subtitle: 'Dean office approval authority, CSV attendance synchronization, and policy controls',
      icon: <Shield className="w-6 h-6 text-indigo-400" />,
      badge: 'Dean / Administrator',
      badgeColor: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60',
      defaultEmail: 'admin@university.edu',
      defaultPass: 'admin123',
      defaultName: 'Dr. Evelyn Vance (Dean)',
      redirectPath: '/admin',
      note: 'Administrative authority: Final approvals, rejections, attendance overrides, proctor assignments, and spreadsheet imports.',
    },
  }[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(email, password, role);
    setIsLoading(false);

    if (result.success) {
      onNavigate(roleConfig.redirectPath);
    } else {
      setErrorMessage(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/95">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-slate-800 border border-slate-700/80 mb-3 shadow-inner">
              {roleConfig.icon}
            </div>
            <div className="flex justify-center mb-1">
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${roleConfig.badgeColor}`}>
                {roleConfig.badge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {roleConfig.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {roleConfig.subtitle}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Quick Demo Fill Button */}
          <div className="mb-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Pre-configured Demo Account:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill(roleConfig.defaultEmail, roleConfig.defaultPass)}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 min-h-[36px] flex items-center px-1"
              >
                Auto-Fill
              </button>
            </div>
            <div className="text-[11px] text-slate-400 font-mono break-all">
              {roleConfig.defaultEmail}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                University Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@university.edu"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter university password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 min-w-[40px] justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-teal-500/20 flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.99]"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to {roleConfig.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Institutional Security Notice */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            {roleConfig.note}
          </div>

          {/* Switch to Other Portals */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center space-y-1.5">
            <span className="text-xs text-slate-400 block">Switch to a different portal:</span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {role !== 'student' && (
                <button
                  type="button"
                  onClick={() => onNavigate('/student/login')}
                  className="text-slate-300 hover:text-teal-400 underline underline-offset-2 py-1 px-1.5 min-h-[36px] flex items-center"
                >
                  Student Login
                </button>
              )}
              {role !== 'proctor' && (
                <button
                  type="button"
                  onClick={() => onNavigate('/proctor/login')}
                  className="text-slate-300 hover:text-teal-400 underline underline-offset-2 py-1 px-1.5 min-h-[36px] flex items-center"
                >
                  Proctor Login
                </button>
              )}
              {role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/login')}
                  className="text-slate-300 hover:text-teal-400 underline underline-offset-2 py-1 px-1.5 min-h-[36px] flex items-center"
                >
                  Dean / Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
