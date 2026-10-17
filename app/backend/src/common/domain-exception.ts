import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@bar/contracts';
import type { ErrorData } from './filters/http-exception.types.js';

export class DomainException extends HttpException {
  public readonly code: ErrorCode;
  public readonly errorData: ErrorData;

  public constructor(
    code: ErrorCode,
    message: string,
    status: number,
    errorData: ErrorData = null,
  ) {
    super(message, status);
    this.code = code;
    this.errorData = errorData;
  }
}
