import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, TokenType } from './auth.service';
import { IS_PUBLIC_KEY, type FastifyRequestWithUser } from './auth.decorators';

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
		const [scheme, bearer] = request.headers.authorization?.split(' ') ?? [];
		const token = (scheme === 'Bearer' ? bearer : undefined) ?? request.cookies[TokenType.ACCESS];
		if (!token) throw new UnauthorizedException();

		const user = await this.authService.authenticate(token);
		if (!user) throw new UnauthorizedException();

		request.user = user;
		return true;
	}
}
