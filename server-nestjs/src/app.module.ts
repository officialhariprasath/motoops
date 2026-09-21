// File: src/app.module.ts
// Use Render (for deployment)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { LeaveModule } from './modules/leave/leave.module';
import { GarageSettingsModule } from './modules/garage-settings/garage-settings.module';
import { SchemaEnsureService } from './common/schema-ensure.service';

// DB CONNECTED THROUGH app.module.ts VIA importing TypeOrmModule and configuring it with the database connection details.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Neon/prod: set TYPEORM_SYNC=true on first deploy to create tables, then set false.
      synchronize:
        process.env.TYPEORM_SYNC === 'true' ||
        process.env.NODE_ENV !== 'production',
      ssl:
        process.env.DATABASE_SSL === 'true' ||
        process.env.NODE_ENV === 'production' ||
        Boolean(process.env.DATABASE_URL?.includes('neon.tech'))
          ? { rejectUnauthorized: false }
          : false,
    }),

    UsersModule,
    VehiclesModule,
    AuthModule,
    ServicesModule,
    InvoicesModule,
    CatalogModule,
    LeaveModule,
    GarageSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchemaEnsureService],
})
export class AppModule {}
