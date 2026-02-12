/* eslint-disable react-refresh/only-export-components -- context file exports Provider + useAutoRefresh hook */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const COUNTDOWN_SECONDS = 60;

interface AutoRefreshContextType {
  /** Auto-refresh every 60s when true. Default false. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** Seconds until next refresh (60 down to 0). Only relevant when enabled. */
  secondsRemaining: number;
  /** True after a refresh completed; show banner until user dismisses. */
  updatesAvailable: boolean;
  dismissUpdates: () => void;
  /** When the last refresh completed (for display). */
  lastRefreshedAt: Date | null;
  /** Manually trigger a refresh (same as auto-refresh run). */
  refreshNow: () => Promise<void>;
}

const AutoRefreshContext = createContext<AutoRefreshContextType | undefined>(undefined);

/** Query key prefixes to refetch when auto-refresh runs. */
const REFRESH_QUERY_PREFIXES = [['dashboard'], ['problems'], ['approvals'], ['applications']] as const;

export function AutoRefreshProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  const [updatesAvailable, setUpdatesAvailable] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runRefresh = useCallback(async () => {
    try {
      await Promise.all(
        REFRESH_QUERY_PREFIXES.map((queryKey) =>
          queryClient.refetchQueries({ queryKey, type: 'active' })
        )
      );
      const now = new Date();
      setLastRefreshedAt(now);
      setUpdatesAvailable(true);
      setSecondsRemaining(COUNTDOWN_SECONDS);
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      toast.success(`Data refreshed at ${timeStr}`);
    } catch {
      toast.error('Refresh failed');
    }
  }, [queryClient]);

  const refreshNow = useCallback(async () => {
    await runRefresh();
  }, [runRefresh]);

  // When user turns on auto-refresh, start countdown at 60
  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset countdown when enabling
      setSecondsRemaining(COUNTDOWN_SECONDS);
    }
  }, [enabled]);

  // Countdown: every 1s decrement; at 0 run refresh and reset to 60
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          runRefresh();
          return COUNTDOWN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, runRefresh]);

  const dismissUpdates = useCallback(() => setUpdatesAvailable(false), []);

  return (
    <AutoRefreshContext.Provider
      value={{
        enabled,
        setEnabled,
        secondsRemaining,
        updatesAvailable,
        dismissUpdates,
        lastRefreshedAt,
        refreshNow,
      }}
    >
      {children}
    </AutoRefreshContext.Provider>
  );
}

export function useAutoRefresh() {
  const context = useContext(AutoRefreshContext);
  if (context === undefined) {
    throw new Error('useAutoRefresh must be used within an AutoRefreshProvider');
  }
  return context;
}
