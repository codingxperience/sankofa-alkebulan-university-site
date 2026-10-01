import type { LoggerService } from '@nestjs/common';
import { currentRequestContext } from './request-context';

type Level = 'debug' | 'info' | 'warn' | 'error';

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Keys whose values must never reach a log line, wherever they appear. */
const REDACTED_KEYS = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|card|cvv/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    out[key] = REDACTED_KEYS.test(key) ? '[redacted]' : redact(inner, depth + 1);
  }
  return out;
}

/**
 * One JSON object per line, which is what Vercel's log drains and most log
 * tools index best. Every line carries the request id when there is one.
 */
/** Scopes Nest uses while wiring up modules, controllers and routes. */
const FRAMEWORK_SCOPES = new Set(['NestFactory', 'InstanceLoader', 'RoutesResolver', 'RouterExplorer', 'NestApplication']);

export class JsonLogger implements LoggerService {
  private threshold: number;

  constructor(level: Level = 'info') {
    this.threshold = RANK[level];
  }

  setLevel(level: Level): void {
    this.threshold = RANK[level];
  }

  /** Nest's own start-up messages are detail, not news: they repeat on every cold start. */
  log(message: unknown, ...params: unknown[]): void {
    const scope = params[params.length - 1];
    this.write(typeof scope === 'string' && FRAMEWORK_SCOPES.has(scope) ? 'debug' : 'info', message, params);
  }

  info(message: unknown, ...params: unknown[]): void {
    this.write('info', message, params);
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.write('warn', message, params);
  }

  error(message: unknown, ...params: unknown[]): void {
    this.write('error', message, params);
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params);
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params);
  }

  private write(level: Level, message: unknown, params: unknown[]): void {
    if (RANK[level] < this.threshold) {
      return;
    }
    const context = currentRequestContext();
    const entry: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
    };
    if (context) {
      entry.requestId = context.requestId;
    }

    // Nest passes the logging context (usually a class name) as the last string param.
    const extras = [...params];
    if (typeof extras[extras.length - 1] === 'string') {
      entry.scope = extras.pop();
    }

    if (message instanceof Error) {
      entry.msg = message.message;
      entry.err = redact(message);
    } else if (typeof message === 'object' && message !== null) {
      Object.assign(entry, redact(message));
    } else {
      entry.msg = String(message);
    }

    for (const extra of extras) {
      if (extra instanceof Error) {
        entry.err = redact(extra);
      } else if (typeof extra === 'string' && level === 'error') {
        entry.stack = extra;
      } else if (extra !== undefined) {
        entry.detail = redact(extra);
      }
    }

    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}

export const logger = new JsonLogger((process.env.LOG_LEVEL as Level | undefined) ?? 'info');
