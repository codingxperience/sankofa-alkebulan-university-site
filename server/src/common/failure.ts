/**
 * A failure described safely enough to show to whoever opened the page: the
 * kind of error and what it says, never a stack trace, and with any address
 * that could carry credentials (postgresql://user:password@…) hidden.
 *
 * Used only when the API cannot start or has crashed — the moments when the
 * site's owner most needs to know why, and the hosting logs are hardest to read.
 */
export interface FailureSummary {
  readonly name: string;
  readonly message: string;
  readonly code?: string;
}

const ADDRESS = /\b[a-z][a-z0-9+.-]*:\/\/[^\s'"`]+/gi;
const MAX_LENGTH = 600;

export function describeFailure(error: unknown): FailureSummary {
  const failure = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown failure');
  const message = failure.message
    // Node appends the chain of files that required a missing module; the first line says what is missing.
    .split(/\nRequire stack:/)[0]
    .replace(ADDRESS, '[address hidden]')
    .trim()
    .slice(0, MAX_LENGTH);
  const code = (failure as { code?: unknown }).code;
  return { name: failure.name, message, ...(typeof code === 'string' ? { code } : {}) };
}
