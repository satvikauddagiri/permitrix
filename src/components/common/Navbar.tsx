import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Menu,
  X,
  LogOut,
  User,
  Shield,
  GraduationCap,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenDemoModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenDemoModal }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleIcon = () => {
    if (!user) return null;
    if (user.role === 'admin') return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
    if (user.role === 'proctor') return <UserCheck className="w-3.5 h-3.5 text-teal-400" />;
    return <GraduationCap className="w-3.5 h-3.5 text-blue-400" />;
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') return 'Dean / Admin';
    if (user.role === 'proctor') return 'Faculty Proctor';
    return `Student · ${user.studentDetails?.rollNo || 'Roll'}`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark (Single text element with logo emblem) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate(user ? `/${user.role}` : '/')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-sm tracking-wider text-sm">
                PX
              </div>
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Permitrix
              </span>
            </button>

            {user && (
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/80">
                {getRoleIcon()}
                <span>{getRoleBadge()}</span>
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          {user ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              {user.role === 'student' && (
                <>
                  <button
                    onClick={() => onNavigate('/student')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath === '/student' ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    My Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('/student?tab=requests')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=requests') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Event Requests
                  </button>
                  <button
                    onClick={() => onNavigate('/student?tab=attendance')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=attendance') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Attendance Record
                  </button>
                </>
              )}

              {user.role === 'proctor' && (
                <>
                  <button
                    onClick={() => onNavigate('/proctor')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath === '/proctor' ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Review Queue
                  </button>
                  <button
                    onClick={() => onNavigate('/proctor?tab=students')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=students') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Assigned Students
                  </button>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => onNavigate('/admin')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath === '/admin' ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => onNavigate('/admin?tab=requests')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=requests') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    All Requests
                  </button>
                  <button
                    onClick={() => onNavigate('/admin?tab=attendance')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=attendance') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Attendance & CSV
                  </button>
                  <button
                    onClick={() => onNavigate('/admin?tab=students')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=students') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Students & Proctors
                  </button>
                  <button
                    onClick={() => onNavigate('/admin?tab=audit')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${
                      currentPath.includes('tab=audit') ? 'text-teal-400 font-semibold' : ''
                    }`}
                  >
                    Audit Trail
                  </button>
                </>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <button
                onClick={() => onNavigate('/student/login')}
                className={`whitespace-nowrap transition-colors hover:text-white ${
                  currentPath === '/student/login' ? 'text-teal-400 font-semibold' : ''
                }`}
              >
                Student Portal
              </button>
              <button
                onClick={() => onNavigate('/proctor/login')}
                className={`whitespace-nowrap transition-colors hover:text-white ${
                  currentPath === '/proctor/login' ? 'text-teal-400 font-semibold' : ''
                }`}
              >
                Proctor Portal
              </button>
              <button
                onClick={() => onNavigate('/admin/login')}
                className={`whitespace-nowrap transition-colors hover:text-white ${
                  currentPath === '/admin/login' ? 'text-teal-400 font-semibold' : ''
                }`}
              >
                Admin Portal
              </button>
            </nav>
          )}

          {/* Zone 3: Actions (Desktop Demo Switch + Logout & Mobile Hamburger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenDemoModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-colors whitespace-nowrap min-h-[38px]"
              title="Switch demo persona (Admin, Proctor, Student)"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">Demo Switcher</span>
              <span className="sm:hidden">Switch</span>
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white truncate max-w-[140px]">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{user.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate(`/${user.role}/login`);
                  }}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Mobile Hamburger Toggle Button (min 44x44px hitbox) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {user ? (
              <>
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{user.name}</span>
                    <span className="text-[11px] font-medium text-teal-400 bg-teal-950/70 border border-teal-800 px-2 py-0.5 rounded">
                      {getRoleBadge()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                </div>

                <div className="space-y-1">
                  {user.role === 'student' && (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('/student');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath === '/student' ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/student?tab=requests');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=requests') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Event Requests
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/student?tab=attendance');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=attendance') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Attendance Record
                      </button>
                    </>
                  )}

                  {user.role === 'proctor' && (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('/proctor');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath === '/proctor' ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Review Queue
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/proctor?tab=students');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=students') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Assigned Students
                      </button>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('/admin');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath === '/admin' ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Overview Dashboard
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/admin?tab=requests');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=requests') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        All Event Requests
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/admin?tab=attendance');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=attendance') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Attendance & Excel/CSV
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/admin?tab=students');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=students') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Students & Proctors
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/admin?tab=audit');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                          currentPath.includes('tab=audit') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Audit Trail
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      onNavigate(`/${user.role}/login`);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-800 text-rose-300 hover:bg-slate-700 rounded-lg text-sm font-medium min-h-[44px] flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate('/student/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 min-h-[44px] flex items-center"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    onNavigate('/proctor/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 min-h-[44px] flex items-center"
                >
                  Proctor Login
                </button>
                <button
                  onClick={() => {
                    onNavigate('/admin/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 min-h-[44px] flex items-center"
                >
                  Administrator Login
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
