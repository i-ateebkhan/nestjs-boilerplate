import { PrismaService } from '@/database/prisma.service';
import { env } from '@/config/env.config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
	constructor(private readonly prisma: PrismaService) {}

	public async create(userId: string, tokenId: string): Promise<void> {
		// Opportunistic cleanup: drop this user's dead sessions before adding a new one
		// so abandoned/expired token rows don't accumulate over time.
		await this.deleteExpiredForUser(userId);
		await this.prisma.session.create({ data: { userId, tokenId, expiresAt: this.expiry() } });
	}

	public async exists(tokenId: string): Promise<boolean> {
		const session = await this.prisma.session.findUnique({ where: { tokenId } });
		return Boolean(session);
	}

	public async delete(tokenId: string): Promise<void> {
		await this.prisma.session.deleteMany({ where: { tokenId } });
	}

	public async deleteExpiredForUser(userId: string): Promise<void> {
		await this.prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
	}

	/**
	 * Atomically rotate a session: only succeeds if the old `tokenId` is still
	 * present (i.e. the refresh token has not already been used/revoked). The old
	 * record is removed, this user's expired rows are purged, and the new session
	 * stored. Returns false when the old session no longer exists, signalling a
	 * replayed or revoked refresh token.
	 */
	public async rotate(oldTokenId: string, userId: string, newTokenId: string): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const deleted = await tx.session.deleteMany({ where: { tokenId: oldTokenId } });
			if (deleted.count === 0) return false;
			await tx.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
			await tx.session.create({ data: { userId, tokenId: newTokenId, expiresAt: this.expiry() } });
			return true;
		});
	}

	private expiry(): Date {
		// Session lifetime mirrors the refresh token's lifetime (env value is in seconds).
		return new Date(Date.now() + env.JWT_REFRESH_EXP * 1000);
	}
}
