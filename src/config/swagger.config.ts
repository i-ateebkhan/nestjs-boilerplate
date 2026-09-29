import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';
import type { NestJSReferenceConfiguration } from '@scalar/nestjs-api-reference';
import { env } from './env.config';

export const SwaggerConfig = new DocumentBuilder()
	.setTitle(env.SWAGGER_TITLE)
	.setDescription(env.SWAGGER_DESCRIPTION)
	.setVersion(env.SWAGGER_VERSION)
	.addBearerAuth(
		{
			description: `Please enter token in following format: Bearer <JWT>`,
			name: 'Authorization',
			bearerFormat: 'Bearer',
			scheme: 'Bearer',
			type: 'http',
			in: 'Header',
		},
		'access-token',
	)
	.addSecurityRequirements('access-token')
	.build();

export const ScalarConfig = (document: OpenAPIObject): NestJSReferenceConfiguration => ({
	theme: 'saturn',
	layout: 'modern',
	content: document,
	showToolbar: 'never',
	hideModels: true,
	documentDownloadType: 'none',
	hideDarkModeToggle: true,
	hideDownloadButton: true,
	withFastify: true,
	pageTitle: env.SWAGGER_TITLE,
});
