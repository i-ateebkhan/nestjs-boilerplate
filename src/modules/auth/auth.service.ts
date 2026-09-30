import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions, type JwtVerifyOptions } from '@nestjs/jwt';
import { v7 as uuidv7 } from 'uuid';
import { env } from '@/config/env.config';
import { UsersService } from '@/modules/users/users.service';
import { SessionService } from './session.service';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';
import type { ChangePasswordDto, SignupDto } from './auth.dto';
import type { RequestUser } from './auth.decorators';

export enum TokenType {
	ACCESS = 'accessToken',
	REFRESH = 'refreshToken',
}

type TokenPayload = { userId: string; tokenId: string };

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly sessionService: SessionService,
		private readonly usersService: UsersService,
	) {}

	private readonly JWT_SECRET: Record<TokenType, string> = {
		[TokenType.ACCESS]: env.JWT_ACCESS_SECRET,
		[TokenType.REFRESH]: env.JWT_REFRESH_SECRET,
	};
	private readonly JWT_EXP: Record<TokenType, number> = {
		[TokenType.ACCESS]: env.JWT_ACCESS_EXP,
		[TokenType.REFRESH]: env.JWT_REFRESH_EXP,
	};

	public async signIn(email: string, password: string) {
		const found = await this.usersService.findActiveWithPassword({ email });
		const validPassword = await verifyPassword(password, found?.password ?? DUMMY_HASH);
		if (!found || !validPassword) throw new UnauthorizedException('Invalid credentials');

		const { password: _password, deletedAt: _deletedAt, ...user } = found;
		const tokenId = uuidv7();
		await this.sessionService.create(user.id, tokenId);
		const [accessToken, refreshToken] = await this.issueTokens(user.id, tokenId);
		return { user, accessToken, refreshToken };
	}

	public async signUp(dto: SignupDto) {
		await this.usersService.create({
			email: dto.email,
			fullName: dto.fullName,
			password: await hashPassword(dto.password),
		});
	}

	public async refresh(token: string) {
		const payload = await this.verifyToken(token, TokenType.REFRESH);
		if (!payload) throw new UnauthorizedException();

		const user = await this.usersService.findActive({ id: payload.userId });
		if (!user) throw new UnauthorizedException();

		const tokenId = uuidv7();
		if (!(await this.sessionService.rotate(payload.tokenId, user.id, tokenId))) {
			await this.sessionService.deleteAllForUser(user.id);
			throw new UnauthorizedException();
		}

		const [accessToken, refreshToken] = await this.issueTokens(user.id, tokenId);
		return { user, accessToken, refreshToken };
	}

	public signOut(tokenId: string): Promise<void> {
		return this.sessionService.delete(tokenId);
	}

	public async changePassword(userId: string, tokenId: string, dto: ChangePasswordDto) {
		if (dto.confirmPassword !== dto.newPassword) throw new BadRequestException('Passwords do not match');

		const user = await this.usersService.findActiveWithPassword({ id: userId });
		if (!user) throw new NotFoundException('User not found');
		if (!(await verifyPassword(dto.oldPassword, user.password))) throw new UnauthorizedException();

		await this.usersService.updatePassword(userId, await hashPassword(dto.newPassword));
		await this.sessionService.deleteAllForUser(userId, tokenId);
	}

	public async authenticate(accessToken: string): Promise<RequestUser | undefined> {
		const payload = await this.verifyToken(accessToken, TokenType.ACCESS);
		if (!payload || !(await this.sessionService.exists(payload.tokenId))) return undefined;
		return { id: payload.userId, tokenId: payload.tokenId };
	}

	private issueTokens(userId: string, tokenId: string) {
		return Promise.all([
			this.signPayload({ userId, tokenId }, TokenType.ACCESS),
			this.signPayload({ userId, tokenId }, TokenType.REFRESH),
		]);
	}

	private signPayload(payload: TokenPayload, type: TokenType): Promise<string> {
		const options = { secret: this.JWT_SECRET[type], expiresIn: this.JWT_EXP[type] } satisfies JwtSignOptions;
		return this.jwtService.signAsync(payload, options);
	}

	private async verifyToken(token: string, type: TokenType): Promise<TokenPayload | undefined> {
		try {
			const options = { secret: this.JWT_SECRET[type] } satisfies JwtVerifyOptions;
			return await this.jwtService.verifyAsync<TokenPayload>(token, options);
		} catch {
			return undefined;
		}
	}
}
