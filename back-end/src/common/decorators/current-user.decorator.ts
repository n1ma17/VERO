import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

/**
 * Authenticated Better Auth user from the request session (not client-supplied).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: UserSession['user'] }>();
    return request.user;
  },
);
