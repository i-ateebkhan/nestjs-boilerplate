import * as Sentry from '@sentry/nestjs';
import { env, isProduction } from './config/env.config';

Sentry.init({
	dsn: env.SENTRY_DSN,
	environment: env.NODE_ENV,
	release: env.SENTRY_RELEASE,
	tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? (isProduction ? 0.1 : 1.0),
});
