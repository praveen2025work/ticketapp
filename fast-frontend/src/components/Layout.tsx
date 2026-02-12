import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ApprovalRecord } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import { useTheme } from '../shared/context/ThemeContext';
import { useAutoRefresh } from '../shared/context/AutoRefreshContext';
import { approvalApi } from '../shared/api/approvalApi';
import DevUserSwitcher from './DevUserSwitcher';

const ROLES_CAN_CREATE = ['ADMIN'];
const ROLES_CAN_APPROVE = ['ADMIN', 'REVIEWER', 'APPROVER', 'RTB_OWNER'];

const CreateIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tickets', label: 'Tickets' },
  { path: '/tickets/create', label: 'Ticket', icon: 'create', roles: ROLES_CAN_CREATE },
  { path: '/approvals', label: 'Approvals', roles: ROLES_CAN_APPROVE },
  { path: '/knowledge', label: 'KB' },
  { path: '/admin', label: 'Admin', adminOnly: true },
];

const RefreshIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function Layout() {
  const { user, showRoleSwitcher } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { enabled: autoRefreshEnabled, setEnabled: setAutoRefreshEnabled, secondsRemaining, updatesAvailable, dismissUpdates, refreshNow } = useAutoRefresh();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canSeeApprovals = Boolean(user?.role && ROLES_CAN_APPROVE.includes(user.role));
  const { data: pendingApprovals = [] } = useQuery<ApprovalRecord[], Error>({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalApi.getPending(),
    enabled: canSeeApprovals,
  });
  const approvalCount = pendingApprovals.length;

  const filteredNavItems = navItems.filter((item) => {
    if ('adminOnly' in item && item.adminOnly) return user?.role === 'ADMIN';
    if ('roles' in item && Array.isArray(item.roles)) return user?.role && item.roles.includes(user.role);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
      <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-xl font-bold tracking-tight text-white">
                FAST
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
                    }`}
                    title={item.icon === 'create' ? 'Create Ticket' : undefined}
                  >
                    {'icon' in item && item.icon === 'create' && <CreateIcon />}
                    {item.label}
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
                    title={'icon' in item && item.icon === 'create' ? 'Create Ticket' : undefined}
                  >
                    {'icon' in item && item.icon === 'create' && <CreateIcon />}
                    {item.label}
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
      {updatesAvailable && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              New updates available. Review the page below for new or changed items.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshNow()}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Refresh now
              </button>
              <button
                type="button"
                onClick={dismissUpdates}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-emerald-200 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 py-6 text-gray-900 dark:text-slate-100">
        <Outlet />
      </main>
    </div>
  );
}
