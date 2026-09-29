import z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
	PORT: z.coerce.number().default(5000),
	NODE_ENV: z.enum(['development', 'qa', 'production', 'staging']).default('development'),
	PG_URL: z.url(),
	JWT_ACCESS_SECRET: z.string().min(32),
	JWT_REFRESH_SECRET: z.string().min(32),
	JWT_ACCESS_EXP: z.coerce.number(),
	JWT_REFRESH_EXP: z.coerce.number(),
	SWAGGER_TITLE: z.string().default('Nest.JS API Documentation'),
	SWAGGER_DESCRIPTION: z.string().default('API description'),
	SWAGGER_VERSION: z.string().default('1.0'),
	REDIS_URL: z.url().optional(),
	RATE_LIMIT_TTL: z.coerce.number().default(6000),
	RATE_LIMIT_MAX: z.coerce.number().default(5),
	TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
	WEB_CONCURRENCY: z.coerce.number().int().positive().optional(),
});

export const env = (() => {
	const parsed = envSchema.safeParse(process.env);
	if (parsed.success) return Object.freeze(parsed.data);

	console.error(z.treeifyError(parsed.error));
	process.exit(1);
})();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';
export const isQA = env.NODE_ENV === 'qa';
