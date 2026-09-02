import type { PublicId } from '../../api/contracts/uuid';
import type { IsoDateTimeString } from '../../api/contracts/time';
import { httpClient } from '../../api/client/httpClient';

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
   */
  restoreSession(input: RestoreSessionInput): Promise<IdentitySession>;
}

export class HttpIdentitySessionAdapter implements IdentitySessionAdapter {
  async restoreSession(input: RestoreSessionInput): Promise<IdentitySession> {
    const response = await httpClient.post<{
      access_token: string;
      refresh_token: string;
      session_expires_at: string;
      token_type: string;
      expires_in: number;
    }>('/api/v1/identity/sessions/refresh', {
      refresh_token: input.refreshToken,
    });

    if (!response.data) {
      throw new Error('No session data received from server');
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      subjectId: '' as PublicId, // Retained from session metadata if needed
      expiresAt: (response.data.session_expires_at as IsoDateTimeString) ?? null,
    };
  }
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
