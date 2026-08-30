/**
 * Correlation id generation.
 *
 * A client-generated request id is attached to every outbound request so that
 * a user-visible toast can be correlated with a backend log entry even when the
 * backend does not answer at all.
 */

const FALLBACK_ALPHABET = '0123456789abcdef';

function randomHex(length: number): string {
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += FALLBACK_ALPHABET[Math.floor(Math.random() * 16)];
  }
  return output;
}

let counter = 0;

export function createRequestId(): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  counter = (counter + 1) % 0xffff;
  const timePart = Date.now().toString(16);
  return `${timePart}-${randomHex(8)}-${counter.toString(16).padStart(4, '0')}`;
}
