import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Additive schema fixes for production when TYPEORM_SYNC=false.
 * Safe to run on every boot (IF NOT EXISTS / exception-guarded).
 */
@Injectable()
export class SchemaEnsureService implements OnModuleInit {
  private readonly logger = new Logger(SchemaEnsureService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensure();
      this.logger.log('Schema ensure completed');
    } catch (error) {
      this.logger.error('Schema ensure failed', error as Error);
    }
  }

  private async ensure() {
    const q = (sql: string) => this.dataSource.query(sql);

    // ASSIGNED job status (Postgres enum)
    await q(`
      DO $$
      BEGIN
        ALTER TYPE services_status_enum ADD VALUE IF NOT EXISTS 'ASSIGNED';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN undefined_object THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);

    await q(`
      ALTER TABLE services
        ADD COLUMN IF NOT EXISTS "nextServiceOdometer" character varying NULL,
        ADD COLUMN IF NOT EXISTS "nextServiceAt" date NULL,
        ADD COLUMN IF NOT EXISTS "futureWorksNotes" text NULL,
        ADD COLUMN IF NOT EXISTS "includeNextServiceOnBill" boolean NOT NULL DEFAULT false;
    `);

    await q(`
      ALTER TABLE vehicles
        ADD COLUMN IF NOT EXISTS "nextServiceAt" date NULL,
        ADD COLUMN IF NOT EXISTS "nextServiceOdometer" character varying NULL,
        ADD COLUMN IF NOT EXISTS "futureWorksNotes" text NULL;
    `);

    await q(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS "billExtras" text NULL;
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS service_assigned_mechanics (
        "servicesId" uuid NOT NULL,
        "usersId" uuid NOT NULL,
        PRIMARY KEY ("servicesId", "usersId")
      );
    `);

    await q(`
      DO $$
      BEGIN
        ALTER TABLE service_assigned_mechanics
          ADD CONSTRAINT "FK_service_assigned_mechanics_service"
          FOREIGN KEY ("servicesId") REFERENCES services(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await q(`
      DO $$
      BEGIN
        ALTER TABLE service_assigned_mechanics
          ADD CONSTRAINT "FK_service_assigned_mechanics_user"
          FOREIGN KEY ("usersId") REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mechanicId" character varying NOT NULL,
        "mechanicName" character varying NOT NULL,
        "leaveType" character varying NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        reason text NULL,
        status character varying NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }
}
