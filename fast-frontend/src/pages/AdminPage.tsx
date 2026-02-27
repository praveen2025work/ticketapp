import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import SettingsPage from './SettingsPage';
import ApplicationsPage from './ApplicationsPage';
import UserGroupsPage from './UserGroupsPage';
import UsersPage from './UsersPage';
import AuditLogPage from './AuditLogPage';

type AdminTab = 'settings' | 'applications' | 'user-groups' | 'users' | 'audit';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'applications', label: 'Applications' },
  { id: 'user-groups', label: 'User Groups' },
  { id: 'users', label: 'Users' },
  { id: 'audit', label: 'Audit Log' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab = (tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'settings');

  const setTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin</h1>
        {!isAdmin && (
          <span className="text-sm text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
            View only — you need Admin role to make changes
          </span>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-slate-600">
        <nav className="flex gap-1" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`
                px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary bg-white dark:bg-slate-800 dark:border-primary dark:text-primary'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px] pt-2">
        {activeTab === 'settings' && <SettingsPage embedded readOnly={!isAdmin} />}
        {activeTab === 'applications' && <ApplicationsPage embedded readOnly={!isAdmin} />}
        {activeTab === 'user-groups' && <UserGroupsPage embedded readOnly={!isAdmin} />}
        {activeTab === 'users' && <UsersPage embedded readOnly={!isAdmin} />}
        {activeTab === 'audit' && <AuditLogPage embedded />}
      </div>
    </div>
  );
}
