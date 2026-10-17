import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@bar/contracts';

export class DomainException extends HttpException {
  public readonly code: ErrorCode;

  public constructor(code: ErrorCode, message: string, status: number) {
    super(message, status);
    this.code = code;
  }
}
