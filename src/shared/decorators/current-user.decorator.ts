import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export type RequestUser = { id: string; tokenId: string };
export type FastifyRequestWithUser = FastifyRequest & { user: RequestUser };

export const CurrentUser = createParamDecorator(
	(key: keyof RequestUser | undefined, context: ExecutionContext): string | undefined => {
		return context.switchToHttp().getRequest<FastifyRequestWithUser>().user?.[key ?? 'id'];
	},
);
