import { existsSync } from 'node:fs';
import z from 'zod';

if (existsSync('.env')) process.loadEnvFile('.env');

const envSchema = z
	.object({
		PORT: z.coerce.number().int().min(1).max(65535).default(5000),
		NODE_ENV: z.enum(['development', 'qa', 'production', 'staging']).default('development'),
		PG_URL: z.url(),
		JWT_ACCESS_SECRET: z.string().min(32),
		JWT_REFRESH_SECRET: z.string().min(32),
		JWT_ACCESS_EXP: z.coerce.number().int().min(60).max(86_400),
		JWT_REFRESH_EXP: z.coerce.number().int().min(300).max(7_776_000),
		SWAGGER_TITLE: z.string().max(200).default('Nest.JS API Documentation'),
		SWAGGER_DESCRIPTION: z.string().max(2000).default('API description'),
		SWAGGER_VERSION: z.string().max(50).default('1.0'),
		REDIS_URL: z.url().optional(),
		RATE_LIMIT_TTL: z.coerce.number().int().min(1000).max(3_600_000).default(6000),
		RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),
		RATE_LIMIT_USER_MAX: z.coerce.number().int().min(1).max(10_000).default(100),
		TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
		WEB_CONCURRENCY: z.coerce.number().int().positive().optional(),
		SENTRY_DSN: z.url().optional(),
		SENTRY_RELEASE: z.string().min(1).max(200).optional(),
		SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
	})
	.refine((e) => e.JWT_REFRESH_EXP > e.JWT_ACCESS_EXP, {
		message: 'JWT_REFRESH_EXP must be greater than JWT_ACCESS_EXP',
		path: ['JWT_REFRESH_EXP'],
	});

export const env = (() => {
	const parsed = envSchema.safeParse(process.env);
	if (parsed.success) return Object.freeze(parsed.data);

	console.error(z.prettifyError(parsed.error));
	process.exit(1);
})();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';
export const isQA = env.NODE_ENV === 'qa';
