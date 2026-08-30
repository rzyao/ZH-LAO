/**
 * Lightweight frontend logger.
 *
 * Rules (see ADMIN_FOUNDATION_PLAN §39):
 * - Never log passwords, OTPs, raw session tokens, authorization headers,
 *   secrets or payment credentials.
 * - `debug` output is suppressed in production builds.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function isProduction() {
  return import.meta.env.PROD === true
}

function consoleMethod(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' {
  return level
}

interface LogEntry {
  level: LogLevel
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
}

/**
 * Redact any field that could contain a secret before it reaches the console.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function redact(meta?: Record<string, any>): Record<string, any> | undefined {
  if (!meta) return undefined
  const SENSITIVE_KEYS = [
    'password',
    'otp',
    'token',
    'authorization',
    'secret',
    'cookie',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
  ]
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase()
    if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
      out[key] = '[REDACTED]'
    } else {
      out[key] = value
    }
  }
  return out
}

function write(entry: LogEntry) {
  if (entry.level === 'debug' && isProduction()) return
  const method = consoleMethod(entry.level)
  const meta = redact(entry.meta)
  if (meta) {
    console[method](entry.message, meta)
  } else {
    console[method](entry.message)
  }
}

export const logger = {
  debug(message: string, meta?: LogEntry['meta']) {
    write({ level: 'debug', message, meta })
  },
  info(message: string, meta?: LogEntry['meta']) {
    write({ level: 'info', message, meta })
  },
  warn(message: string, meta?: LogEntry['meta']) {
    write({ level: 'warn', message, meta })
  },
  error(message: string, meta?: LogEntry['meta']) {
    write({ level: 'error', message, meta })
  },
  isEnabled(level: LogLevel) {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[isProduction() ? 'info' : 'debug']
  },
}

export type { LogLevel }
