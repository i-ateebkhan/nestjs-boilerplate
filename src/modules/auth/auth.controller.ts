import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Put,
	Req,
	Res,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '@/config/env.config';
import { ResponseMessage } from '@/common/response';
import { AuthService, TokenType } from './auth.service';
import { CurrentUser, Public } from './auth.decorators';
import { ChangePasswordDto, RefreshAccessDto, SigninDto, SignupDto } from './auth.dto';

const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: 'strict', path: '/' } as const;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('sign-in')
	@HttpCode(HttpStatus.OK)
	@ResponseMessage('Signed in successfully')
	async signinHandler(@Body() body: SigninDto, @Res({ passthrough: true }) res: FastifyReply) {
		const session = await this.authService.signIn(body.email, body.password);
		this.setAuthCookies(res, session.accessToken, session.refreshToken);
		return session;
	}

	@Public()
	@Post('sign-up')
	@ResponseMessage('User registered successfully')
	async signupHandler(@Body() body: SignupDto) {
		await this.authService.signUp(body);
	}

	@Public()
	@Post('refresh-access')
	@HttpCode(HttpStatus.OK)
	@ResponseMessage('Session refreshed')
	async refreshAccessHandler(
		@Req() req: FastifyRequest,
		@Res({ passthrough: true }) res: FastifyReply,
		@Body() body: RefreshAccessDto,
	) {
		const refreshToken = body?.refreshToken || req.cookies[TokenType.REFRESH];
		if (!refreshToken) throw new UnauthorizedException();

		const session = await this.authService.refresh(refreshToken);
		this.setAuthCookies(res, session.accessToken, session.refreshToken);
		return session;
	}

	@Post('sign-out')
	@HttpCode(HttpStatus.OK)
	@ResponseMessage('Signed out successfully')
	async signoutHandler(
		@CurrentUser('tokenId') tokenId: string,
		@Res({ passthrough: true }) res: FastifyReply,
	) {
		await this.authService.signOut(tokenId);
		res.clearCookie(TokenType.REFRESH, COOKIE_OPTIONS);
		res.clearCookie(TokenType.ACCESS, COOKIE_OPTIONS);
	}

	@Put('change-password')
	@Throttle({ user: { limit: env.RATE_LIMIT_MAX, ttl: env.RATE_LIMIT_TTL } })
	@ResponseMessage('Password updated successfully')
	async changePasswordHandler(
		@CurrentUser() userId: string,
		@CurrentUser('tokenId') tokenId: string,
		@Body() body: ChangePasswordDto,
	) {
		await this.authService.changePassword(userId, tokenId, body);
	}

	private setAuthCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
		res.setCookie(TokenType.REFRESH, refreshToken, { ...COOKIE_OPTIONS, maxAge: env.JWT_REFRESH_EXP });
		res.setCookie(TokenType.ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: env.JWT_ACCESS_EXP });
	}
}
