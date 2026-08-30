import { tryAsPublicId } from '../../api/contracts/uuid';
import { createLogger } from '../../utils/logger';
import type { TokenStore } from '../storage/tokenStore';

import { getIdentitySessionAdapter } from './identityAdapter';
import { INITIAL_SESSION_STATE, type SessionState } from './sessionTypes';

const log = createLogger('session-bootstrap');

export interface SessionBootstrapDeps {
  readonly tokenStore: TokenStore;
  readonly secureStorageAvailable: boolean;
}

/**
 * Session bootstrap.
 *
 * ```text
 * App start
 *   -> read credential from secure storage
 *   -> decide bootstrap state
 *   -> (if a credential exists) hand it to the future Identity adapter
 *   -> render the correct app state
 * ```
 *
 * When no Identity adapter is registered yet (the Foundation state), a stored
 * credential is reported via `hasStoredCredential` and the session resolves to
 * `anonymous` — the client never invents a refresh call to make the flow "work".
 */
export async function bootstrapSession(
  deps: SessionBootstrapDeps,
): Promise<SessionState> {
  const { tokenStore, secureStorageAvailable } = deps;

  let refreshToken: string | null = null;
  try {
    refreshToken = await tokenStore.getRefreshToken();
  } catch (error) {
    log.warn('credential read failed', { error: String(error) });
    return {
      ...INITIAL_SESSION_STATE,
      status: 'anonymous',
      secureStorageAvailable,
      reason: 'credential_read_failed',
    };
  }

  if (!refreshToken) {
    return {
      ...INITIAL_SESSION_STATE,
      status: 'anonymous',
      secureStorageAvailable,
      reason: 'no_stored_credential',
    };
  }

  const adapter = getIdentitySessionAdapter();
  if (!adapter) {
    log.info('stored credential found but no Identity adapter registered', {
      reason: 'identity_adapter_pending',
    });
    return {
      status: 'anonymous',
      hasStoredCredential: true,
      subjectId: null,
      secureStorageAvailable,
      reason: 'identity_adapter_pending',
    };
  }

  try {
    const session = await adapter.restoreSession({ refreshToken });
    tokenStore.setAccessToken(session.accessToken);
    await tokenStore.setRefreshToken(session.refreshToken);
    await tokenStore.writeSessionMetadata({
      subjectId: session.subjectId,
      updatedAt: new Date().toISOString(),
    });

    return {
      status: 'authenticated',
      hasStoredCredential: true,
      subjectId: tryAsPublicId(session.subjectId),
      secureStorageAvailable,
      reason: 'restored',
    };
  } catch (error) {
    log.warn('session restore failed', { error: String(error) });
    tokenStore.clearAccessToken();
    await tokenStore.clearRefreshToken();

    return {
      status: 'anonymous',
      hasStoredCredential: false,
      subjectId: null,
      secureStorageAvailable,
      reason: 'unauthorized',
    };
  }
}

/** Terminates the current session and drops every credential. */
export async function terminateSession(tokenStore: TokenStore): Promise<SessionState> {
  await tokenStore.clearAll();
  return {
    ...INITIAL_SESSION_STATE,
    status: 'anonymous',
    reason: 'signed_out',
  };
}
