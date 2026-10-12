import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { DemoAccountsModal } from './components/common/DemoAccountsModal.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { ProctorDashboard } from './components/proctor/ProctorDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import {
  GraduationCap,
  UserCheck,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Layers,
  Smartphone,
} from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-sm font-semibold tracking-wider text-teal-400">
          INITIALIZING PERMITRIX...
        </div>
      </div>
    );
  }

  // Handle protected route redirects
  const renderContent = () => {
    const path = currentPath;

    // 1. Separate Login Routes
    if (path === '/student/login') {
      if (user?.role === 'student') {
        return <StudentDashboard />;
      }
      return <LoginPage role="student" onNavigate={navigate} />;
    }

    if (path === '/proctor/login') {
      if (user?.role === 'proctor') {
        return <ProctorDashboard />;
      }
      return <LoginPage role="proctor" onNavigate={navigate} />;
    }

    if (path === '/admin/login') {
      if (user?.role === 'admin') {
        return <AdminDashboard />;
      }
      return <LoginPage role="admin" onNavigate={navigate} />;
    }

    // 2. Protected Role Dashboards
    if (path === '/student') {
      if (!user) {
        return <LoginPage role="student" onNavigate={navigate} />;
      }
      if (user.role !== 'student') {
        return (
          <div className="max-w-md mx-auto p-8 text-center text-slate-800">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-600 mb-4">
              Your account has the role "{user.role}". You must be a student to access this portal.
            </p>
            <button
              onClick={() => navigate(`/${user.role}`)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Go to Your {user.role.toUpperCase()} Dashboard
            </button>
          </div>
        );
      }
      return <StudentDashboard />;
    }

    if (path === '/proctor') {
      if (!user) {
        return <LoginPage role="proctor" onNavigate={navigate} />;
      }
      if (user.role !== 'proctor') {
        return (
          <div className="max-w-md mx-auto p-8 text-center text-slate-800">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-600 mb-4">
              Faculty proctor access only. Your current role is "{user.role}".
            </p>
            <button
              onClick={() => navigate(`/${user.role}`)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Go to Your {user.role.toUpperCase()} Dashboard
            </button>
          </div>
        );
      }
      return <ProctorDashboard />;
    }

    if (path === '/admin') {
      if (!user) {
        return <LoginPage role="admin" onNavigate={navigate} />;
      }
      if (user.role !== 'admin') {
        return (
          <div className="max-w-md mx-auto p-8 text-center text-slate-800">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-600 mb-4">
              Administrator authority only. Your current role is "{user.role}".
            </p>
            <button
              onClick={() => navigate(`/${user.role}`)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Go to Your {user.role.toUpperCase()} Dashboard
            </button>
          </div>
        );
      }
      return <AdminDashboard />;
    }

    // Default / Landing Page: if user is logged in, show their dashboard
    if (user) {
      if (user.role === 'student') return <StudentDashboard />;
      if (user.role === 'proctor') return <ProctorDashboard />;
      if (user.role === 'admin') return <AdminDashboard />;
    }

    // Landing / Portal Gatekeeper (Not logged in)
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-white flex flex-col justify-between">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-teal-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>University Technical Event Approvals & Attendance Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Permitrix
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              A university governance platform for On-Duty (OD) event permissions, multi-stage proctor & dean approvals, and automated CSV attendance eligibility verification.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 flex items-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Instant Demo Switcher</span>
              </button>
            </div>
          </div>

          {/* Three Separate Login Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {/* 1. Student Portal */}
            <div
              onClick={() => navigate('/student/login')}
              className="bg-slate-800/70 border border-slate-700/80 hover:border-blue-500/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:bg-slate-800 hover:shadow-xl cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  Enrolled Students
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Student Portal</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  View personal attendance percentage, check eligibility compliance, submit OD event requests, and edit returned applications.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>Access /student/login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Proctor Portal */}
            <div
              onClick={() => navigate('/proctor/login')}
              className="bg-slate-800/70 border border-slate-700/80 hover:border-teal-500/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:bg-slate-800 hover:shadow-xl cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                  Faculty Proctors
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Proctor Portal</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Exclusively inspect assigned student cohorts, verify attendance thresholds, and issue advisory recommendations or correction notices.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300">
                <span>Access /proctor/login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Admin Portal */}
            <div
              onClick={() => navigate('/admin/login')}
              className="bg-slate-800/70 border border-slate-700/80 hover:border-indigo-500/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:bg-slate-800 hover:shadow-xl cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Academic Dean / Admin
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Dean / Admin Portal</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Issue final approval or rejection orders, grant authorized attendance overrides, upload and validate CSV attendance, and inspect audit logs.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>Access /admin/login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Workflow & Architecture Features Banner */}
          <div className="max-w-5xl mx-auto rounded-2xl bg-slate-800/40 border border-slate-700/60 p-6 sm:p-8">
            <h3 className="text-base font-bold text-white mb-4 text-center">
              Multi-Stage University Approval Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-teal-400 mb-1">1. Student Submission</div>
                <p className="text-slate-400">
                  Student submits request; system takes an immutable snapshot of attendance & flags eligibility.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-teal-400 mb-1">2. Proctor Advisory</div>
                <p className="text-slate-400">
                  Assigned proctor reviews request, checks academic standing, and endorses or returns for correction.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-teal-400 mb-1">3. Dean Final Order</div>
                <p className="text-slate-400">
                  Dean issues binding decision. Rejections require mandatory reason; shortages require authorized override.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-teal-400 mb-1">4. Real-time Audit</div>
                <p className="text-slate-400">
                  Full non-repudiable audit logs and spreadsheet exports for institutional records.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Apex Institute of Technology & Sciences · Permitrix University Portal</p>
        </footer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      <div className="flex-1">{renderContent()}</div>

      <DemoAccountsModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectRoleRoute={navigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
