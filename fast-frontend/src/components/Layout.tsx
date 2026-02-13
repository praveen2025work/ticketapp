import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ApprovalRecord } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import { useTheme } from '../shared/context/ThemeContext';
import { useAutoRefresh } from '../shared/context/AutoRefreshContext';
import { approvalApi } from '../shared/api/approvalApi';
import DevUserSwitcher from './DevUserSwitcher';

const CreateIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 6 10.5H3.75A2.25 2.25 0 0 1 3.75 8.25V6zM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 6 20.25H3.75A2.25 2.25 0 0 1 3.75 18v-2.25zM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6zM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25z" />
  </svg>
);

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', iconOnly: true },
  { path: '/tickets', label: 'Tickets' },
  { path: '/tickets/create', label: 'Ticket', icon: 'create' },
  { path: '/approvals', label: 'Approvals' },
  { path: '/upstream', label: 'Upstream' },
  { path: '/knowledge', label: 'KB' },
  { path: '/admin', label: 'Admin' },
];

const RefreshIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function Layout() {
  const { user, showRoleSwitcher } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { enabled: autoRefreshEnabled, setEnabled: setAutoRefreshEnabled, secondsRemaining } = useAutoRefresh();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: pendingApprovals = [] } = useQuery<ApprovalRecord[], Error>({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalApi.getPending(),
    enabled: Boolean(user),
  });
  const approvalCount = pendingApprovals.length;

  // Show all nav items to every role; actions/buttons on each page are enabled by role (read-only when not permitted).
  const filteredNavItems = navItems;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
      <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                <img src="/fastlogo.svg" alt="F.A.S.T. - Finance Accelerated Support Team" className="h-11 w-auto brightness-110 contrast-105" width="140" height="56" />
              </Link>
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="hidden md:flex gap-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${'iconOnly' in item && item.iconOnly ? 'p-2' : ''}`}
                    title={'iconOnly' in item && item.iconOnly ? item.label : item.icon === 'create' ? 'Create Ticket' : undefined}
                    aria-label={'iconOnly' in item && item.iconOnly ? item.label : undefined}
                  >
                    {item.icon === 'dashboard' && <DashboardIcon />}
                    {'icon' in item && item.icon === 'create' && <CreateIcon />}
                    {!('iconOnly' in item && item.iconOnly) && item.label}
                    {item.path === '/approvals' && approvalCount > 0 && (
                      <span className="ml-1 min-w-[1.25rem] inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-slate-900" aria-label={`${approvalCount} pending approval${approvalCount !== 1 ? 's' : ''}`}>
                        {approvalCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {showRoleSwitcher && (
                <DevUserSwitcher variant="header" />
              )}
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  autoRefreshEnabled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={autoRefreshEnabled ? `Auto-refresh in ${secondsRemaining}s` : 'Turn on auto-refresh every 60s'}
                aria-label={autoRefreshEnabled ? `Auto-refresh on, next refresh in ${secondsRemaining} seconds` : 'Auto-refresh off'}
                aria-pressed={autoRefreshEnabled}
              >
                <RefreshIcon />
                <span className="hidden sm:inline min-w-[1.5rem] tabular-nums">{autoRefreshEnabled ? secondsRemaining : '60'}s</span>
              </button>
              {user && (
                <>
                  <div className="flex items-center gap-2 text-sm hidden sm:flex">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-600"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium" aria-hidden>
                        {(user.fullName ?? user.username ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-slate-300">{user.displayName ?? user.fullName ?? user.username}</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded-lg text-xs font-medium">{user.role}</span>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link
                to="/guide"
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Starter Guide"
                title="Starter Guide"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </Link>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-2 border-t border-slate-700 animate-fade-in">
              <div className="flex flex-col gap-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      location.pathname === item.path ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={'iconOnly' in item && item.iconOnly ? item.label : item.icon === 'create' ? 'Create Ticket' : undefined}
                    aria-label={'iconOnly' in item && item.iconOnly ? item.label : undefined}
                  >
                    {item.icon === 'dashboard' && <DashboardIcon />}
                    {'icon' in item && item.icon === 'create' && <CreateIcon />}
                    {!('iconOnly' in item && item.iconOnly) && item.label}
                    {item.path === '/approvals' && approvalCount > 0 && (
                      <span className="ml-1 min-w-[1.25rem] inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-slate-900" aria-label={`${approvalCount} pending approval${approvalCount !== 1 ? 's' : ''}`}>
                        {approvalCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 text-gray-900 dark:text-slate-100">
        <Outlet />
      </main>
    </div>
  );
}
