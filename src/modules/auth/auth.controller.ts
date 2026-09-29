import {
	ConflictException,
	Controller,
	HttpStatus,
	Logger,
	Body,
	Post,
	UnauthorizedException,
	Request,
	Response,
	InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/decorators/public.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { RefreshAccessDto, SigninDto, SignupDto } from './dto/auth.dto';
import { ResponseMapper } from '@/shared/mappers/response.map';
import { UserService } from '../users/user.service';
import { AuthService } from './auth.service';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { TokenType } from '@/shared/enums/auth.enum';
import { CommonService } from '@/shared/services/common.service';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/shared/utils/password.util';
import { Prisma } from '@/generated/prisma/client';

@ApiTags('Auth')
@Controller('/api/auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);
	constructor(
		private readonly userService: UserService,
		private readonly authService: AuthService,
		private readonly commonService: CommonService,
	) {}

	@Public()
	@Post('sign-in')
	async signinHandler(@Body() body: SigninDto, @Response({ passthrough: true }) res: FastifyReply) {
		const user = await this.userService.findOneBy({ email: body.email, deletedAt: null });
		const validPassword = await verifyPassword(body.password, user?.password ?? DUMMY_HASH);
		if (!user || !validPassword) throw new UnauthorizedException('Invalid credentials');

		const [accessToken, refreshToken] = await this.authService.generateAuthTokens(user.id);
		this.authService.setAuthCookies(res, accessToken, refreshToken);
		const responseUser = this.commonService.omit(user, ['password', 'deletedAt']);

		return ResponseMapper.map({
			message: 'Signed in successfully',
			data: { user: responseUser, accessToken, refreshToken },
		});
	}

	@Public()
	@Post('sign-up')
	async signupHandler(@Body() body: SignupDto) {
		const [error] = await this.userService.save({
			email: body.email,
			fullName: body.fullName,
			password: await hashPassword(body.password),
		});
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
			throw new ConflictException('Email already registered');
		if (error) {
			this.logger.error(error.message);
			throw new InternalServerErrorException('Failed to register, Please try later');
		}

		return ResponseMapper.map({
			message: 'User registered successfully',
			status: HttpStatus.CREATED,
		});
	}

	@Public()
	@Post('refresh-access')
	async refreshAccessHandler(
		@Request() req: FastifyRequest,
		@Response({ passthrough: true }) res: FastifyReply,
		@Body() body: RefreshAccessDto,
	) {
		const refreshToken =
			body?.refreshToken || this.authService.extractTokenFromCookie(req, TokenType.REFRESH);
		if (!refreshToken) throw new UnauthorizedException();

		const payload = await this.authService.verifyToken(refreshToken, TokenType.REFRESH);
		if (!payload) throw new UnauthorizedException();

		const user = await this.userService.findOneBy({ id: payload.userId, deletedAt: null });
		if (!user) throw new UnauthorizedException();

		const tokens = await this.authService.rotateAuthTokens(user.id, payload.tokenId);
		if (!tokens) throw new UnauthorizedException();

		const [accessToken, newRefreshToken] = tokens;
		this.authService.setAuthCookies(res, accessToken, newRefreshToken);
		const responseUser = this.commonService.omit(user, ['password', 'deletedAt']);

		return ResponseMapper.map({
			message: 'Session refreshed',
			data: { user: responseUser, accessToken, refreshToken: newRefreshToken },
		});
	}

	@Post('sign-out')
	async signoutHandler(
		@CurrentUser('tokenId') tokenId: string,
		@Response({ passthrough: true }) res: FastifyReply,
	) {
		await this.authService.revokeSession(tokenId);
		this.removeAuthCookies(res);
		return ResponseMapper.map({ message: 'Signed out successfully' });
	}

	private removeAuthCookies(res: FastifyReply) {
		res.clearCookie(TokenType.REFRESH, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
		});
		res.clearCookie(TokenType.ACCESS, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
		});
	}
}
