import { HttpStatus, SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'responseMessage';
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);

export const envelope = (status: number, message: string, data: unknown = null) => ({
	success: status >= HttpStatus.OK && status < HttpStatus.AMBIGUOUS,
	status,
	message,
	data,
});
