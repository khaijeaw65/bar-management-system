import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { OpenVisitResponseSchema, apiResponseSchema } from '@bar/contracts';
import { ApiStandardErrors } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';

export function ApiOpenVisit(): MethodDecorator {
  const schema = zodToOpenApi(apiResponseSchema(OpenVisitResponseSchema));
  return applyDecorators(
    ApiCreatedResponse({
      description: 'Created the visit. attached is false.',
      schema,
    }),
    ApiOkResponse({
      description: 'Attached to the live visit. attached is true.',
      schema,
    }),
    ApiStandardErrors(),
  );
}
