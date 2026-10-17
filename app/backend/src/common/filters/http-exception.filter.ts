import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ErrorCode } from '@bar/contracts';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainException } from '../domain-exception.js';
import type { ErrorEnvelope } from './http-exception.types.js';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

function codeForStatus(status: number): ErrorCode {
  return CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const body = this.envelope(exception);
    this.logServerError(request, exception, body.status);
    response.status(body.status).json(body);
  }

  private envelope(exception: unknown): ErrorEnvelope {
    if (exception instanceof ZodError) return zodEnvelope(exception);
    if (exception instanceof DomainException) return domainEnvelope(exception);
    if (exception instanceof HttpException) return httpEnvelope(exception);
    return internalEnvelope();
  }

  private logServerError(
    request: Request,
    exception: unknown,
    status: number,
  ): void {
    if (status < HttpStatus.INTERNAL_SERVER_ERROR) return;
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `${request.method} ${request.url}`,
      stack ?? String(exception),
    );
  }
}

function zodEnvelope(exception: ZodError): ErrorEnvelope {
  return {
    status: HttpStatus.BAD_REQUEST,
    code: 'VALIDATION_ERROR',
    message: exception.issues.map((issue) => issue.message),
    data: null,
  };
}

function domainEnvelope(exception: DomainException): ErrorEnvelope {
  return {
    status: exception.getStatus(),
    code: exception.code,
    message: exception.message,
    data: null,
  };
}

function httpEnvelope(exception: HttpException): ErrorEnvelope {
  const status = exception.getStatus();
  return {
    status,
    code: codeForStatus(status),
    message: messageOf(exception),
    data: null,
  };
}

function internalEnvelope(): ErrorEnvelope {
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    data: null,
  };
}

function messageOf(exception: HttpException): string | string[] {
  const body = exception.getResponse();
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return exception.message;
  }
  return (body as { message: string | string[] }).message;
}
