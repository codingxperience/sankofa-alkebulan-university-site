import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { logger } from '../logger';
import { currentRequestContext } from '../request-context';
import { ApiError } from './errors';

interface ErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
  details?: unknown;
  requestId?: string;
}

const STATUS_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'invalid_input',
  429: 'rate_limited',
};

/**
 * Turns anything thrown into the API's single error shape. Expected errors
 * pass their message through; unexpected ones are logged in full and reach
 * the client only as a generic message and the request id to quote.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = currentRequestContext()?.requestId;
    const { status, body, headers } = this.describe(exception);

    if (status >= 500) {
      logger.error({ msg: 'Unhandled error', status, err: exception });
    }

    if (response.headersSent) {
      return;
    }
    for (const [name, value] of Object.entries(headers ?? {})) {
      response.setHeader(name, value);
    }
    response.status(status).json({ error: { ...body, requestId } });
  }

  private describe(exception: unknown): {
    status: number;
    body: ErrorBody;
    headers?: Record<string, string>;
  } {
    if (exception instanceof ApiError) {
      return {
        status: exception.getStatus(),
        body: { code: exception.code, message: exception.message, fields: exception.fields, details: exception.details },
        headers: exception.headers,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'object' && raw !== null && 'message' in raw
          ? String(Array.isArray(raw.message) ? raw.message[0] : raw.message)
          : exception.message;
      return {
        status,
        body: {
          code: STATUS_CODES[status] ?? (status >= 500 ? 'internal_error' : 'error'),
          message: status >= 500 ? 'Something went wrong on our side.' : message,
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return { status: HttpStatus.NOT_FOUND, body: { code: 'not_found', message: 'We could not find that.' } };
      }
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          body: { code: 'conflict', message: 'That conflicts with an existing record.' },
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'internal_error',
        message: 'Something went wrong on our side. Please try again; if it keeps happening, quote the request id.',
      },
    };
  }
}
