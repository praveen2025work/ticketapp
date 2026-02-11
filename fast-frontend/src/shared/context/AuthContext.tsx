import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api/authApi';
import axiosClient, { getStoredToken, setStoredToken } from '../api/axiosClient';
import { isLocalEnv, useLocalAuth } from '../utils/env';

const BAM_APP_NAME = 'FORT';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mergeUserWithAd(base: AuthUser, ad: { displayName?: string; emailAddress?: string; employeeId?: string; profilePhotoUrl?: string }): AuthUser {
  return {
    ...base,
    displayName: ad.displayName ?? base.displayName,
    emailAddress: ad.emailAddress ?? base.emailAddress,
    employeeId: ad.employeeId ?? base.employeeId,
    profilePhotoUrl: ad.profilePhotoUrl ?? base.profilePhotoUrl,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axiosClient.get('/users/me');
      const userData = response.data;
      const baseUser: AuthUser = {
        username: userData.username,
        fullName: userData.fullName ?? userData.username,
        role: userData.role,
        region: userData.region,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        employeeId: userData.employeeId,
        profilePhotoUrl: userData.profilePhotoUrl,
      };
      setUser(baseUser);
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
      if (getStoredToken()) {
        setStoredToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // 1. Localhost / dev: use /users/me with X-Authenticated-User
      if (isLocalEnv()) {
        await fetchCurrentUser();
        return;
      }
      // 2. Runtime config (no rebuild): fetch config.json; if authMode === 'local', skip BAM
      try {
        const configRes = await fetch('/config.json', { cache: 'no-store' });
        if (!cancelled && configRes.ok) {
          const config = await configRes.json();
          if (config?.authMode === 'local') {
            await fetchCurrentUser();
            return;
          }
        }
      } catch {
        // No config.json or parse error: continue to build-time check or BAM
      }
      // 3. Build-time flag VITE_AUTH_MODE=local (must be set when running npm run build)
      if (useLocalAuth()) {
        await fetchCurrentUser();
        return;
      }
      // 4. BAM SSO
      try {
        const redirectURL = typeof window !== 'undefined' ? window.location.origin + '/api' : '';
        const bam = await authApi.getBamToken(BAM_APP_NAME, redirectURL);
        if (cancelled || !bam.bamToken) return;
        setStoredToken(bam.bamToken);
        await fetchCurrentUser();
        if (cancelled) return;
        try {
          const adUser = await authApi.getAdUser();
          if (cancelled) return;
          setUser((prev) => (prev ? mergeUserWithAd(prev, adUser) : prev));
        } catch (adErr) {
          console.warn('AD user fetch failed (optional):', adErr);
        }
      } catch (err) {
        console.error('BAM bootstrap failed:', err);
        setStoredToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [fetchCurrentUser]);

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    if (!isLocalEnv()) {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
