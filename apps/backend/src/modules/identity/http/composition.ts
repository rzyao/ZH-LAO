import type { TransactionManager } from '../../../database/transaction-manager.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import { OutboxWriter } from '../../../outbox/outbox-writer.js';
import type { IdentityRepositories } from '../application/ports/index.js';
import { AccessTokenService, CryptoOtpGenerator, HmacOtpHasher, IdentityEventWriter, OtpConsumptionEngine, RefreshTokenService, UnavailableFacebookCredentialVerifier, type FacebookCredentialVerifier, type OtpDeliveryProvider } from '../application/services/index.js';
import { AuthenticateWithFacebook, AuthenticateWithPhoneOtp, DeviceLifecycle, IdentityState, PhoneCredentialOperations, ProfileOperations, RequestPhoneOtp, SessionLifecycle } from '../application/index.js';
import { IdentityAuthenticationProvider } from '../infrastructure/index.js';
import type { IdentityHttpDependencies } from './routes.js';

export type IdentityHttpCompositionOptions = Readonly<{
  transactionManager: TransactionManager;
  repositories: (executor: DatabaseExecutor) => IdentityRepositories;
  executor: DatabaseExecutor;
  otpHmacSecret: string;
  jwtHmacSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  otpDelivery: OtpDeliveryProvider;
  facebookVerifier?: FacebookCredentialVerifier;
  eventWriter?: IdentityEventWriter;
  now?: () => Date;
}>;

// Boot-time fail fast: identity servers must never fall back to weak or missing secrets.
// Provider policy: Fake providers are tests-only. When no real provider is wired, the
// composition defaults to an explicit Unavailable provider so the endpoint fails safe (503)
// instead of silently pretending to succeed.
export function createIdentityHttpDependencies(options: IdentityHttpCompositionOptions): IdentityHttpDependencies {
  if (!options.otpHmacSecret || options.otpHmacSecret.length < 32) throw new Error('OTP_HMAC_SECRET is missing or too short (minimum 32 characters)');
  if (!options.jwtHmacSecret || options.jwtHmacSecret.length < 32) throw new Error('JWT_HMAC_SECRET is missing or too short (minimum 32 characters)');
  const now = options.now ?? (() => new Date());
  const otpHasher = new HmacOtpHasher(options.otpHmacSecret);
  const events = options.eventWriter ?? new IdentityEventWriter(new OutboxWriter());
  const access = new AccessTokenService(options.jwtHmacSecret, options.jwtIssuer, options.jwtAudience);
  const refresh = new RefreshTokenService();
  return {
    authentication: new IdentityAuthenticationProvider(access, options.repositories, options.executor),
    requestOtp: new RequestPhoneOtp(options.transactionManager, options.repositories, new CryptoOtpGenerator(), otpHasher, options.otpDelivery, undefined, undefined, now),
    phoneAuth: new AuthenticateWithPhoneOtp(options.transactionManager, options.repositories, new OtpConsumptionEngine(options.repositories, otpHasher, now), { prepareRefresh: () => refresh.prepare(), issueAccess: user => access.issue(user) }, events, now),
    facebookAuth: new AuthenticateWithFacebook(options.facebookVerifier ?? new UnavailableFacebookCredentialVerifier(), options.transactionManager, options.repositories, { prepareRefresh: () => refresh.prepare(), issueAccess: user => access.issue(user) }, events, now),
    sessions: new SessionLifecycle(options.transactionManager, options.repositories, access, refresh, now),
    devices: new DeviceLifecycle(options.transactionManager, options.repositories, now),
    profile: new ProfileOperations(options.repositories, options.executor),
    state: new IdentityState(options.transactionManager, options.repositories, events, now),
    phones: new PhoneCredentialOperations(options.transactionManager, options.repositories, new OtpConsumptionEngine(options.repositories, otpHasher, now))
  };
}