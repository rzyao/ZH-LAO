import type { PublicId } from '../../api/contracts/uuid';
import type { IsoDateTimeString } from '../../api/contracts/time';

/**
 * Future Identity adapter — INTERFACE ONLY.
 *
 * The Mobile Foundation deliberately does NOT implement this and does NOT
 * invent endpoints such as `/api/auth/refresh`. The adapter is registered by
 * the Identity phase once the Identity API contract is frozen.
 *
 * Until an adapter is registered, `sessionBootstrap` resolves the session to
 * `anonymous` with `reason: 'identity_adapter_pending'`.
 */

export interface IdentitySession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly subjectId: PublicId;
  readonly expiresAt: IsoDateTimeString | null;
}

export interface RestoreSessionInput {
  readonly refreshToken: string;
}

export interface IdentitySessionAdapter {
  /**
   * Exchanges a stored refresh token for a fresh session.
   * Implemented by the Identity domain; never called by the Foundation.
   */
  restoreSession(input: RestoreSessionInput): Promise<IdentitySession>;
}

let adapter: IdentitySessionAdapter | null = null;

export function registerIdentitySessionAdapter(next: IdentitySessionAdapter | null): void {
  adapter = next;
}

export function getIdentitySessionAdapter(): IdentitySessionAdapter | null {
  return adapter;
}

export function hasIdentitySessionAdapter(): boolean {
  return adapter !== null;
}
