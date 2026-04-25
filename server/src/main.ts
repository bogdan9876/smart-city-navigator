import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors();

  // ── Validation ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,        // auto-transform query strings to numbers etc.
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
    }),
  );

  // ── Swagger ────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart City Navigator API')
    .setDescription('REST API для розумної навігації містом зі світлофорною аналітикою')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('Traffic', 'Маршрути та рекомендації швидкості')
    .addTag('Favorites', 'Улюблені маршрути користувача')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Start ──────────────────────────────────────────────────────────────────
  await app.listen(appConfig.port, '0.0.0.0');
  console.log(`🚀 Server running on port ${appConfig.port}`);
  console.log(`📚 Swagger: http://localhost:${appConfig.port}/api`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
