import os from 'node:os';
import cluster from 'node:cluster';
import { Logger, type INestApplication } from '@nestjs/common';
import { env, isProduction } from './config/env.config';

const RESTART_WINDOW_MS = 60_000;
const MAX_RESTARTS_PER_WINDOW = 10;
const RESTART_BACKOFF_MS = 2_000;

export async function RunCluster(bootstrap: () => Promise<INestApplication>) {
	const logger = new Logger('AppCluster');
	const cpus = os.availableParallelism();
	const numWorkers = Math.min(env.WEB_CONCURRENCY ?? cpus, cpus);

	if (!cluster.isPrimary || !isProduction || os.platform() !== 'linux' || numWorkers < 2) {
		const app = await bootstrap();
		app.enableShutdownHooks();
		return;
	}

	if (env.WEB_CONCURRENCY && env.WEB_CONCURRENCY > cpus)
		logger.warn(`WEB_CONCURRENCY=${env.WEB_CONCURRENCY} exceeds available CPUs, using ${cpus}`);
	if (!env.REDIS_URL) logger.warn('REDIS_URL not set, rate limits are enforced per worker');
	logger.log(`Primary ${process.pid} is running`);
	logger.log(`Starting ${numWorkers} workers...`);
	for (let i = 0; i < numWorkers; i++) cluster.fork();

	let shuttingDown = false;
	let restartCount = 0;
	const allWorkersDead = () =>
		Object.values(cluster.workers ?? {}).every((worker) => !worker || worker.isDead());

	cluster.on('exit', (worker, code, signal) => {
		if (shuttingDown) {
			if (allWorkersDead()) process.exit(0);
			return;
		}
		if (worker.exitedAfterDisconnect) return;

		logger.error(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}).`);
		restartCount++;
		setTimeout(() => restartCount--, RESTART_WINDOW_MS).unref();

		if (restartCount > MAX_RESTARTS_PER_WINDOW) {
			logger.error('Too many worker restarts, shutting down primary.');
			process.exit(1);
		}

		setTimeout(() => {
			if (shuttingDown) return;
			logger.log('Restarting worker...');
			cluster.fork();
		}, RESTART_BACKOFF_MS);
	});

	const shutdown = (signal: NodeJS.Signals) => {
		if (shuttingDown) return;
		shuttingDown = true;
		logger.log(`Received ${signal}, stopping workers...`);
		for (const worker of Object.values(cluster.workers ?? {})) worker?.process.kill(signal);
		if (allWorkersDead()) process.exit(0);
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
