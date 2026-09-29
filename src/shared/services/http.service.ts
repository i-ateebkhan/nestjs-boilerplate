import type { AxiosRequestConfig } from 'axios';
import { HttpService as NestHttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpService {
	private readonly logger = new Logger(HttpService.name);

	constructor(private readonly http: NestHttpService) {}

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		this.logger.log(`Making GET request to: ${url}`);

		return lastValueFrom(
			this.http.get<T>(url, config).pipe(
				catchError((error) => {
					this.logger.error(`Failed GET request to: ${url}`);
					throw error;
				}),
			),
		).then((response) => response.data);
	}

	async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		this.logger.log(`Making POST request to: ${url}`);

		return lastValueFrom(
			this.http.post<T>(url, data, config).pipe(
				catchError((error) => {
					this.logger.error(`Failed POST request to: ${url}`);
					throw error;
				}),
			),
		).then((response) => response.data);
	}

	async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		this.logger.log(`Making PUT request to: ${url}`);

		return lastValueFrom(
			this.http.put<T>(url, data, config).pipe(
				catchError((error) => {
					this.logger.error(`Failed PUT request to: ${url}`);
					throw error;
				}),
			),
		).then((response) => response.data);
	}

	async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		this.logger.log(`Making PATCH request to: ${url}`);

		return lastValueFrom(
			this.http.patch<T>(url, data, config).pipe(
				catchError((error) => {
					this.logger.error(`Failed PATCH request to: ${url}`);
					throw error;
				}),
			),
		).then((response) => response.data);
	}

	async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		this.logger.log(`Making DELETE request to: ${url}`);

		return lastValueFrom(
			this.http.delete<T>(url, config).pipe(
				catchError((error) => {
					this.logger.error(`Failed DELETE request to: ${url}`);
					throw error;
				}),
			),
		).then((response) => response.data);
	}
}
