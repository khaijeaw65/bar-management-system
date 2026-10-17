import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { OrderSchema, apiResponseSchema } from '@bar/contracts';
import { ApiStandardErrors } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';

export function ApiCreatedOrder(): MethodDecorator {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'Created the order',
      schema: zodToOpenApi(apiResponseSchema(OrderSchema)),
    }),
    ApiStandardErrors(),
  );
}
