import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Every error the API returns has the same shape:
 *   { "error": { "code": "...", "message": "...", "fields"?: {...}, "requestId": "..." } }
 * `code` is stable and machine-readable; `message` is written for people.
 */
export class ApiError extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
    readonly headers?: Record<string, string>,
    /** Extra data the client needs to recover, e.g. the latest copy of a record after a conflict. */
    readonly details?: unknown,
  ) {
    super({ code, message, fields }, status);
  }
}

export const badRequest = (message: string, code = 'bad_request') =>
  new ApiError(HttpStatus.BAD_REQUEST, code, message);

export const unauthorized = (message = 'Please sign in to continue.', code = 'unauthorized') =>
  new ApiError(HttpStatus.UNAUTHORIZED, code, message);

export const forbidden = (message = 'You do not have access to this.', code = 'forbidden') =>
  new ApiError(HttpStatus.FORBIDDEN, code, message);

export const notFound = (message = 'We could not find that.', code = 'not_found') =>
  new ApiError(HttpStatus.NOT_FOUND, code, message);

export const conflict = (message: string, code = 'conflict') =>
  new ApiError(HttpStatus.CONFLICT, code, message);

export const gone = (message: string, code = 'gone') => new ApiError(HttpStatus.GONE, code, message);

export const unprocessable = (message: string, fields?: Record<string, string>, code = 'invalid_input') =>
  new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, code, message, fields);

export const tooManyRequests = (retryAfterSeconds: number) =>
  new ApiError(
    HttpStatus.TOO_MANY_REQUESTS,
    'rate_limited',
    'Too many requests. Please wait a moment and try again.',
    undefined,
    { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  );

export const serviceUnavailable = (message: string, code = 'unavailable') =>
  new ApiError(HttpStatus.SERVICE_UNAVAILABLE, code, message);
