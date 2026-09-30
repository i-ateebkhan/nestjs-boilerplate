import { applyDecorators, createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

export type RequestUser = { id: string; tokenId: string };
export type FastifyRequestWithUser = FastifyRequest & { user: RequestUser };

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () =>
	applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), SetMetadata(DECORATORS.API_SECURITY, [{}]));

export const CurrentUser = createParamDecorator(
	(key: keyof RequestUser | undefined, context: ExecutionContext): string | undefined => {
		return context.switchToHttp().getRequest<FastifyRequestWithUser>().user?.[key ?? 'id'];
	},
);
