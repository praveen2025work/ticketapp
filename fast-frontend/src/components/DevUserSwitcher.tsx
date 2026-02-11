import { useState } from 'react';
import { isLocalEnv } from '../shared/utils/env';

export { isLocalEnv };

/**
 * Local-only component to simulate different LDAP users.
 * Shown in header only on localhost; dev and prod use actual BAM authentication.
 */
export default function DevUserSwitcher({ variant = 'header' }: { variant?: 'header' }) {
    const [currentUser, setCurrentUser] = useState(
        typeof localStorage !== 'undefined' ? localStorage.getItem('dev_ldap_user') || 'admin' : 'admin'
    );

    const users = [
        { username: 'admin', role: 'ADMIN' },
        { username: 'siresh', role: 'REVIEWER' },
        { username: 'vivek', role: 'REVIEWER' },
        { username: 'kostas', role: 'APPROVER' },
        { username: 'approver_john', role: 'APPROVER' },
        { username: 'rtb_bob', role: 'RTB_OWNER' },
        { username: 'tech_alice', role: 'TECH_LEAD' },
        { username: 'unknown_user', role: 'READ_ONLY' },
    ];

    const handleUserChange = (username: string) => {
        localStorage.setItem('dev_ldap_user', username);
        setCurrentUser(username);
        window.location.reload(); // Reload to apply new user
    };

    // Only show on localhost; dev and prod use BAM auth
    if (!isLocalEnv()) {
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
