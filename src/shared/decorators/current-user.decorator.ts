import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

type FastifyRequestWithUser = FastifyRequest & { user: { id: string } };
export const CurrentUser = createParamDecorator((_, context: ExecutionContext): string | undefined => {
	return context.switchToHttp().getRequest<FastifyRequestWithUser>().user?.id;
});
