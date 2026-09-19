// File: src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // For DTO validation
import cookieParser from 'cookie-parser';

//import * as dotenv from 'dotenv';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

//dotenv.config();
// Furure: integrate Swagger auto docs
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //console.log('DB URL in Nest:', process.env.DATABASE_URL);
  // Enable global validation pipe (for DTO validation)
  const allowedOrigins = process.env.ENABLE_CORS?.split(",").map((origin) => origin.trim()) ?? [];

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        return callback(null, true);
      }

      const isAllowedOrigin = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === requestOrigin) {
          return true;
        }

        if (allowedOrigin.startsWith("http://localhost") || allowedOrigin.startsWith("https://localhost")) {
          const localhostPattern = new RegExp(`^${allowedOrigin.replace(/:\/\//, "\\://").replace(/:\d+$/, "(:\\d+)?")}$`);
          return localhostPattern.test(requestOrigin);
        }

        return false;
      });

      callback(isAllowedOrigin ? null : new Error("CORS policy does not allow this origin."), isAllowedOrigin);
    },
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
