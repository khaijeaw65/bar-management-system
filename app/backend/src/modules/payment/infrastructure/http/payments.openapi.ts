import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { PaymentAttemptSchema, apiResponseSchema } from '@bar/contracts';
import { ApiStandardErrors } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';

export function ApiCreatedPayment(): MethodDecorator {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'Created the payment attempt',
      schema: zodToOpenApi(apiResponseSchema(PaymentAttemptSchema)),
    }),
    ApiStandardErrors(),
  );
}
