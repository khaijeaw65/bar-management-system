import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { apiResponseSchema } from '@bar/contracts';
import type { z } from 'zod';
import { zodToOpenApi } from './zod-to-openapi.js';

const apiErrorRef = { $ref: '#/components/schemas/ApiError' };

export function ApiStandardErrors() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Validation failed', schema: apiErrorRef }),
    ApiUnauthorizedResponse({ description: 'Missing or expired access', schema: apiErrorRef }),
    ApiForbiddenResponse({ description: 'Missing permission', schema: apiErrorRef }),
    ApiNotFoundResponse({ description: 'Resource not found', schema: apiErrorRef }),
    ApiConflictResponse({ description: 'State conflict', schema: apiErrorRef }),
  );
}

export function ApiEnvelopedOk(data: z.ZodType) {
  return applyDecorators(
    ApiOkResponse({
      description: 'Standard success envelope',
      schema: zodToOpenApi(apiResponseSchema(data)),
    }),
    ApiStandardErrors(),
  );
}
