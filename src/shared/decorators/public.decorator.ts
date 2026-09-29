import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () =>
	applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), SetMetadata(DECORATORS.API_SECURITY, [{}]));
