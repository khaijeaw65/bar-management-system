import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip the global access-token guard. The route authenticates itself, or it is public. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
