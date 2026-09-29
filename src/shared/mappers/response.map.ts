import { HttpStatus } from '@nestjs/common';

type IResponse = {
	status?: number;
	message?: string;
	data?: unknown;
};

export class ResponseMapper {
	constructor(
		public status: number,
		public message: string,
		public data: unknown,
		public success: boolean,
	) {}

	static map(data?: IResponse) {
		const status = data?.status ?? HttpStatus.OK;
		return new ResponseMapper(
			status,
			data?.message ?? 'Success',
			data?.data ?? null,
			status >= HttpStatus.OK && status < HttpStatus.AMBIGUOUS,
		);
	}

	toJSON() {
		return {
			success: this.success,
			status: this.status,
			message: this.message,
			data: this.data,
		};
	}
}
