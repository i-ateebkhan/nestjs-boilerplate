import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions, type JwtVerifyOptions } from '@nestjs/jwt';
import { TokenType } from '@/shared/enums/auth.enum';
import { env } from '@/config/env.config';
import { SessionService } from './session.service';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly sessionService: SessionService,
	) {}
	private readonly JWT_SECRET: Record<TokenType, string> = {
		[TokenType.ACCESS]: env.JWT_ACCESS_SECRET,
		[TokenType.REFRESH]: env.JWT_REFRESH_SECRET,
	};
	private readonly JWT_EXP: Record<TokenType, number> = {
		[TokenType.ACCESS]: env.JWT_ACCESS_EXP,
		[TokenType.REFRESH]: env.JWT_REFRESH_EXP,
	};

	public async generateAuthTokens(userId: string) {
		const tokenId = uuidv7();
		await this.sessionService.create(userId, tokenId);
		return this.issueTokens(userId, tokenId);
	}

	/**
	 * Rotate an existing session into a fresh token pair. Only succeeds if the
	 * incoming `tokenId` is still an active session. A validly signed refresh token
	 * whose session is gone is a replay (likely stolen), so every session of that
	 * user is revoked and undefined is returned.
	 */
	public async rotateAuthTokens(userId: string, oldTokenId: string) {
		const newTokenId = uuidv7();
		const rotated = await this.sessionService.rotate(oldTokenId, userId, newTokenId);
		if (!rotated) {
			await this.sessionService.deleteAllForUser(userId);
			return undefined;
		}
		return this.issueTokens(userId, newTokenId);
	}

	private async issueTokens(userId: string, tokenId: string) {
		return Promise.all([
			this.signPayload({ userId, tokenId }, TokenType.ACCESS),
			this.signPayload({ userId, tokenId }, TokenType.REFRESH),
		]);
	}

	public async signPayload(payload: { userId: string; tokenId: string }, type: TokenType): Promise<string> {
		const options = { secret: this.JWT_SECRET[type], expiresIn: this.JWT_EXP[type] } satisfies JwtSignOptions;
		return this.jwtService.signAsync(payload, options);
	}

	public async verifyToken(token: string, type: TokenType) {
		try {
			const options = { secret: this.JWT_SECRET[type] } satisfies JwtVerifyOptions;
			return (await this.jwtService.verifyAsync(token, options)) as { userId: string; tokenId: string };
		} catch {
			return undefined;
		}
	}

	// ponytail: one indexed DB lookup per request; cache in Redis if DB load matters
	public isActiveSession(tokenId: string): Promise<boolean> {
		return this.sessionService.exists(tokenId);
	}

	public extractAccessTokenFromHeader(request: FastifyRequest): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}

	public extractTokenFromCookie(request: FastifyRequest, type: TokenType): string | undefined {
		return request.cookies[type];
	}

	public revokeSession(tokenId: string): Promise<void> {
		return this.sessionService.delete(tokenId);
	}

	public setAuthCookies(res: FastifyReply, accessToken: string, refreshToken: string): void {
		res.setCookie(TokenType.REFRESH, refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: env.JWT_REFRESH_EXP,
		});
		res.setCookie(TokenType.ACCESS, accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: env.JWT_ACCESS_EXP,
		});
	}
}
