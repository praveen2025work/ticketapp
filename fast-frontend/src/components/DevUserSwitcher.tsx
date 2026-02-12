import { useState } from 'react';
import { useAuth } from '../shared/context/AuthContext';

/**
 * Role switcher for local auth: simulate different users (admin, reviewer, etc.).
 * Shown when app uses local auth (localhost or config.json authMode: local).
 */
export default function DevUserSwitcher({ variant = 'header' }: { variant?: 'header' }) {
    const { showRoleSwitcher } = useAuth();
    const [currentUser, setCurrentUser] = useState(
        typeof localStorage !== 'undefined' ? localStorage.getItem('dev_ldap_user') || 'admin' : 'admin'
    );

    const users = [
        { username: 'admin', role: 'ADMIN' },
        { username: 'laks', role: 'ADMIN' },
        { username: 'siresh', role: 'REVIEWER' },
        { username: 'vivek', role: 'APPROVER' },
        { username: 'kostas', role: 'RTB_OWNER' },
        { username: 'prav', role: 'TECH_LEAD' },
        { username: 'rick', role: 'READ_ONLY' },
    ];

    const handleUserChange = (username: string) => {
        localStorage.setItem('dev_ldap_user', username);
        setCurrentUser(username);
        window.location.reload(); // Reload to apply new user
    };

    if (!showRoleSwitcher) {
        return null;
    }

    if (variant === 'header') {
        return (
            <div className="flex items-center flex-shrink-0">
                <select
                    value={currentUser}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-28 max-w-[7rem] px-2 py-1 text-sm rounded bg-slate-800 border border-slate-600 text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 truncate"
                    aria-label="Simulate LDAP user"
                >
                    {users.map((user) => (
                        <option key={user.username} value={user.username}>
                            {user.username} ({user.role})
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return null;
}
