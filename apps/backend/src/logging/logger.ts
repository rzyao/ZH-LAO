import pino, { type Logger, type LoggerOptions } from 'pino';

export const loggerOptions: LoggerOptions = {
  level: 'info',
  redact: {
    paths: [
      'req.headers.authorization', 'req.headers.cookie', 'headers.authorization', 'headers.cookie',
      '*.password', '*.otp', '*.accessToken', '*.refreshToken', '*.databaseUrl', '*.providerSecret',
      'password', 'otp', 'accessToken', 'refreshToken', 'databaseUrl', 'providerSecret'
    ],
    censor: '[REDACTED]'
  }
};

export function createLogger(level = 'info'): Logger {
  return pino({ ...loggerOptions, level });
}
