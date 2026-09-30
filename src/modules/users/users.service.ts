import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

const HIDDEN_FIELDS = { password: true, deletedAt: true } as const;

type UserLookup = { id: string } | { email: string };

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	findActive(where: UserLookup) {
		return this.prisma.user.findFirst({ where: { ...where, deletedAt: null }, omit: HIDDEN_FIELDS });
	}

	findActiveWithPassword(where: UserLookup) {
		return this.prisma.user.findFirst({ where: { ...where, deletedAt: null } });
	}

	async getProfile(id: string) {
		const user = await this.findActive({ id });
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	async create(data: { email: string; fullName: string; password: string }) {
		try {
			return await this.prisma.user.create({ data, omit: HIDDEN_FIELDS });
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
				throw new ConflictException('Email already registered');
			throw error;
		}
	}

	async updateProfile(id: string, data: { fullName: string }) {
		const { count } = await this.prisma.user.updateMany({ where: { id, deletedAt: null }, data });
		if (count === 0) throw new NotFoundException('User not found');
	}

	async updatePassword(id: string, password: string) {
		await this.prisma.user.update({ where: { id }, data: { password } });
	}
}
