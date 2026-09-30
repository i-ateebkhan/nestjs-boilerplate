import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenType } from '@/shared/enums/auth.enum';
import type { FastifyRequestWithUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly authService: AuthService,
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) return true;

		const request = context.switchToHttp().getRequest<FastifyRequestWithUser>();
		const token =
			this.authService.extractAccessTokenFromHeader(request) ??
			this.authService.extractTokenFromCookie(request, TokenType.ACCESS);
		if (!token) throw new UnauthorizedException();

		const payload = await this.authService.verifyToken(token, TokenType.ACCESS);
		if (!payload || !(await this.authService.isActiveSession(payload.tokenId)))
			throw new UnauthorizedException();

		request.user = { id: payload.userId, tokenId: payload.tokenId };
		return true;
	}
}
