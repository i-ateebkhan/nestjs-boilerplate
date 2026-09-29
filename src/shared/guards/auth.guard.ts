import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenType } from '@/shared/enums/auth.enum';
import type { FastifyRequest, FastifyReply } from 'fastify';

type FastifyRequestWithUser = FastifyRequest & { user: { id: string } };

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

		const http = context.switchToHttp();
		const request = http.getRequest<FastifyRequestWithUser>();
		const response = http.getResponse<FastifyReply>();

		let token = this.authService.extractAccessTokenFromHeader(request);
		if (!token) token = this.authService.extractTokenFromCookie(request, TokenType.ACCESS);

		if (token) {
			const payload = await this.authService.verifyToken(token, TokenType.ACCESS);
			if (payload && !this.authService.isBlockedToken(payload.tokenId)) {
				request.user = { id: payload.userId };
				return true;
			}
		}

		const userId = await this.tryRefreshAccess(request, response);
		if (!userId) throw new UnauthorizedException();

		request.user = { id: userId };
		return true;
	}

	private async tryRefreshAccess(
		request: FastifyRequest,
		response: FastifyReply,
	): Promise<string | undefined> {
		const refreshToken = this.authService.extractTokenFromCookie(request, TokenType.REFRESH);
		if (!refreshToken) return undefined;

		const payload = await this.authService.verifyToken(refreshToken, TokenType.REFRESH);
		if (!payload) return undefined;
		if (this.authService.isBlockedToken(payload.tokenId)) return undefined;

		const tokens = await this.authService.rotateAuthTokens(payload.userId, payload.tokenId);
		if (!tokens) return undefined;

		const [accessToken, newRefreshToken] = tokens;
		this.authService.setAuthCookies(response, accessToken, newRefreshToken);
		return payload.userId;
	}
}
