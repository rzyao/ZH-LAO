import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { PublicId } from '../../api/contracts/uuid';
import { secureStorage } from '../../storage';
import { createLogger } from '../../utils/logger';
import { setAccessTokenProvider, setUnauthorizedListener } from '../../api/client/httpClient';
import { tokenStore as defaultTokenStore } from '../storage/tokenStore';
import type { TokenStore } from '../storage/tokenStore';
import { bootstrapSession, terminateSession } from '../session/sessionBootstrap';
import {
  INITIAL_SESSION_STATE,
  isAuthenticated,
  type SessionState,
} from '../session/sessionTypes';

const log = createLogger('auth');

export interface AuthContextValue {
  readonly session: SessionState;
  readonly isBootstrapping: boolean;
  readonly isAuthenticated: boolean;
  /** True when the platform has no native secure store (e.g. Web). */
  readonly isSecureStorageAvailable: boolean;
  /** Re-runs the bootstrap flow. */
  readonly refreshSession: () => Promise<void>;
  /** Clears credentials and returns to the anonymous state. */
  readonly signOut: () => Promise<void>;
  /**
   * Local, in-memory session creation used ONLY by Foundation tests and the
   * auth skeleton demo. It does not call any backend endpoint.
   */
  readonly applyDemoSession: (subjectId: PublicId) => void;
}

/**
 * Non-secret placeholder used by the Foundation demo session. It is never sent
 * to a backend: no domain API is integrated in this phase.
 */
export const FOUNDATION_DEMO_ACCESS_TOKEN = 'foundation-demo-access-token';

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  readonly children: React.ReactNode;
  /** Test seam. */
  readonly tokenStore?: TokenStore;
  /** Skip the bootstrap effect (tests that drive state directly). */
  readonly autoBootstrap?: boolean;
}

export function AuthProvider({
  children,
  tokenStore = defaultTokenStore,
  autoBootstrap = true,
}: AuthProviderProps) {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION_STATE);
  const mounted = useRef(true);

  // The HTTP client asks the auth layer for the bearer token; the token itself
  // is never persisted and never logged.
  useEffect(() => {
    setAccessTokenProvider(() => tokenStore.getAccessToken());
    return () => {
      setAccessTokenProvider(null);
    };
  }, [tokenStore]);

  useEffect(() => {
    setUnauthorizedListener(() => {
      log.debug('unauthorized response observed; session marked for review');
    });
    return () => {
      setUnauthorizedListener(null);
    };
  }, []);

  const runBootstrap = useCallback(async () => {
    const next = await bootstrapSession({
      tokenStore,
      secureStorageAvailable: secureStorage.isSupported,
    });
    if (!mounted.current) {
      return;
    }
    setSession(next);
    log.info('session bootstrap complete', {
      status: next.status,
      reason: next.reason,
      hasStoredCredential: next.hasStoredCredential,
    });
  }, [tokenStore]);

  useEffect(() => {
    mounted.current = true;
    if (autoBootstrap) {
      void runBootstrap();
    }
    return () => {
      mounted.current = false;
    };
  }, [autoBootstrap, runBootstrap]);

  const signOut = useCallback(async () => {
    const next = await terminateSession(tokenStore);
    if (mounted.current) {
      setSession(next);
    }
  }, [tokenStore]);

  const applyDemoSession = useCallback(
    (subjectId: PublicId) => {
      // Foundation-only: exercises the authenticated branch of the UI without
      // contacting any backend. The subject id must satisfy the UUID contract.
      tokenStore.setAccessToken(FOUNDATION_DEMO_ACCESS_TOKEN);
      setSession((previous) => ({
        ...previous,
        status: 'authenticated',
        hasStoredCredential: true,
        subjectId,
        reason: 'restored',
      }));
    },
    [tokenStore],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping: session.status === 'bootstrapping',
      isAuthenticated: isAuthenticated(session),
      isSecureStorageAvailable: secureStorage.isSupported,
      refreshSession: runBootstrap,
      signOut,
      applyDemoSession,
    }),
    [session, runBootstrap, signOut, applyDemoSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
