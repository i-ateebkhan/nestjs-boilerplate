import { env, isProduction } from '@/config/env.config';
import { PrismaClient } from '@/generated/prisma/client';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		const adapter = new PrismaPg({ connectionString: env.PG_URL, max: 8 });

		super({
			adapter,
			log: isProduction
				? [{ level: 'error', emit: 'event' }]
				: [
						{ level: 'query', emit: 'event' },
						{ level: 'warn', emit: 'event' },
						{ level: 'error', emit: 'event' },
						{ level: 'info', emit: 'event' },
					],
		});

		this.$on('query' as never, ({ query, params, duration }) => {
			this.logger.debug(
				`QUERY: ${(query as string).replaceAll(`"public".`, '')} - PARAMS: ${params} - +${(duration as number).toFixed(2)}ms`,
			);
		});

		this.$on('error' as never, ({ error }) => {
			this.logger.error('ERROR:', error);
		});

		this.$on('info' as never, ({ message }) => {
			this.logger.log('INFO:', message);
		});

		this.$on('warn' as never, ({ message }) => {
			this.logger.warn('WARN:', message);
		});
	}

	async onModuleInit() {
		try {
			await this.$queryRawUnsafe('SELECT 1'); // Test the database connection
			this.logger.log('Database connected');
		} catch (err) {
			this.logger.error('Database connection failed', err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	}
}
