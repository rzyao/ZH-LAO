import type { PublicId } from '../../api/contracts/uuid';

/**
 * Auth session state machine.
 *
 * The Foundation models the states only. No Identity endpoint is called and no
 * refresh flow is invented — restoring a real session is the responsibility of
 * the future Identity adapter.
 */

export type SessionStatus =
  /** App is still determining whether a stored credential exists. */
  | 'bootstrapping'
  /** No usable session; the app runs in guest mode. */
  | 'anonymous'
  /** A session exists in the client. */
  | 'authenticated';

export type SessionReason =
  | 'initial'
  | 'no_stored_credential'
  | 'identity_adapter_pending'
  | 'restored'
  | 'signed_out'
  | 'unauthorized'
  | 'credential_read_failed';

export interface SessionState {
  readonly status: SessionStatus;
  /**
   * True when a credential was found in secure storage but could not be
   * exchanged yet because the Identity adapter is not registered.
   */
  readonly hasStoredCredential: boolean;
  /** Subject id — only known once the Identity domain provides it. */
  readonly subjectId: PublicId | null;
  /** True when the platform offers a native secure store. */
  readonly secureStorageAvailable: boolean;
  /** Why the session ended up in its current status. */
  readonly reason: SessionReason;
}

export const INITIAL_SESSION_STATE: SessionState = {
  status: 'bootstrapping',
  hasStoredCredential: false,
  subjectId: null,
  secureStorageAvailable: false,
  reason: 'initial',
};

export function isAuthenticated(state: SessionState): boolean {
  return state.status === 'authenticated';
}

export function isBootstrapping(state: SessionState): boolean {
  return state.status === 'bootstrapping';
}
