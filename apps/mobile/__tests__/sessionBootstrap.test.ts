import { createTokenStore } from '../src/auth/storage/tokenStore';
import { bootstrapSession, terminateSession } from '../src/auth/session/sessionBootstrap';
import {
  getIdentitySessionAdapter,
  registerIdentitySessionAdapter,
} from '../src/auth/session/identityAdapter';
import type { PublicId } from '../src/api/contracts/uuid';
import { createInMemorySecureStorage } from '../src/storage/secureStorage';
import { credentialMemory } from '../src/storage/memoryStorage';

function makeDeps() {
  const secure = createInMemorySecureStorage();
  return {
    deps: { tokenStore: createTokenStore(secure), secureStorageAvailable: true },
    secure,
  };
}

const SUBJECT = '123e4567-e89b-12d3-a456-426614174000';

describe('Session bootstrap (auth skeleton)', () => {
  afterEach(() => {
    registerIdentitySessionAdapter(null);
    credentialMemory.clear();
  });

  it('resolves to anonymous when no credential is stored', async () => {
    const { deps } = makeDeps();
    const state = await bootstrapSession(deps);
    expect(state.status).toBe('anonymous');
    expect(state.reason).toBe('no_stored_credential');
    expect(state.hasStoredCredential).toBe(false);
  });

  it('resolves to anonymous with identity_adapter_pending when a credential exists but no adapter is registered', async () => {
    const { deps, secure } = makeDeps();
    await secure.setItem('zhlao.auth.refresh_token', 'stored-refresh');
    const state = await bootstrapSession(deps);
    expect(state.status).toBe('anonymous');
    expect(state.reason).toBe('identity_adapter_pending');
    expect(state.hasStoredCredential).toBe(true);
  });

  it('restores an authenticated session through the Identity adapter', async () => {
    const { deps, secure } = makeDeps();
    await secure.setItem('zhlao.auth.refresh_token', 'stored-refresh');
    registerIdentitySessionAdapter({
      async restoreSession() {
        return { accessToken: 'a-1', refreshToken: 'r-1', subjectId: SUBJECT as PublicId, expiresAt: null };
      },
    });
    const state = await bootstrapSession(deps);
    expect(state.status).toBe('authenticated');
    expect(state.reason).toBe('restored');
    expect(state.subjectId).toBe(SUBJECT);
    expect(deps.tokenStore.getAccessToken()).toBe('a-1');
    expect(await deps.tokenStore.getRefreshToken()).toBe('r-1');
    expect(getIdentitySessionAdapter()).not.toBeNull();
  });

  it('clears credentials when the adapter rejects the restore', async () => {
    const { deps, secure } = makeDeps();
    await secure.setItem('zhlao.auth.refresh_token', 'stored-refresh');
    registerIdentitySessionAdapter({
      async restoreSession() {
        throw new Error('expired');
      },
    });
    const state = await bootstrapSession(deps);
    expect(state.status).toBe('anonymous');
    expect(state.reason).toBe('unauthorized');
    expect(state.hasStoredCredential).toBe(false);
    expect(await deps.tokenStore.getRefreshToken()).toBeNull();
  });

  it('terminateSession clears every credential', async () => {
    const { deps } = makeDeps();
    deps.tokenStore.setAccessToken('a-1');
    await deps.tokenStore.setRefreshToken('r-1');
    const state = await terminateSession(deps.tokenStore);
    expect(state.status).toBe('anonymous');
    expect(state.reason).toBe('signed_out');
    expect(deps.tokenStore.getAccessToken()).toBeNull();
    expect(await deps.tokenStore.getRefreshToken()).toBeNull();
  });
});
