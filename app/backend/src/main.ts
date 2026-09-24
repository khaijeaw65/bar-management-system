import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap/configure-app.js';
import { AppConfigService } from './providers/config/config.service.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = app.get(AppConfigService).app.port;
  await app.listen(port);
}

await bootstrap();
