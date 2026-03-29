import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SanitizedUser } from '@/users/types/users.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SanitizedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: SanitizedUser }>();
    return request.user;
  },
);
