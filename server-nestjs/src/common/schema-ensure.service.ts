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

    // ---------- Per-garage tenancy ----------
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);
    await q(`ALTER TABLE services ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);
    await q(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);
    await q(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);
    await q(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS "garageId" uuid NULL`);

    await q(`
      CREATE TABLE IF NOT EXISTS garage_settings (
        "garageId" uuid PRIMARY KEY,
        settings text NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Drop global uniques that break multi-tenant (best-effort)
    await this.dropUniqueOnColumn('services', 'jobCardNumber');
    await this.dropUniqueOnColumn('vehicles', 'registrationNumber');
    await this.dropUniqueOnColumn('vehicles', 'vehicleCode');
    await this.dropUniqueOnColumn('invoices', 'invoiceNumber');
    await this.dropUniqueOnColumn('users', 'customerCode');

    // Backfill garageId
    await q(`
      UPDATE users
      SET "garageId" = id
      WHERE role::text = 'admin' AND ("garageId" IS NULL OR "garageId"::text = '');
    `);

    await q(`
      UPDATE services s
      SET "garageId" = u.id
      FROM users u
      WHERE s."garageId" IS NULL
        AND s."createdById" = u.id;
    `);

    await q(`
      UPDATE services s
      SET "garageId" = u."garageId"
      FROM users u
      WHERE s."garageId" IS NULL
        AND s."createdById" = u.id
        AND u."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE vehicles v
      SET "garageId" = s."garageId"
      FROM services s
      WHERE v."garageId" IS NULL
        AND s."vehicleId" = v.id
        AND s."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE vehicles v
      SET "garageId" = u."garageId"
      FROM users u
      WHERE v."garageId" IS NULL
        AND v."ownerId" = u.id
        AND u."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE invoices i
      SET "garageId" = s."garageId"
      FROM services s
      WHERE i."garageId" IS NULL
        AND i."serviceId" = s.id
        AND s."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE users u
      SET "garageId" = s."garageId"
      FROM services s
      WHERE u."garageId" IS NULL
        AND u.role::text IN ('user', 'mechanic')
        AND s."customerId" = u.id
        AND s."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE users u
      SET "garageId" = v."garageId"
      FROM vehicles v
      WHERE u."garageId" IS NULL
        AND u.role::text = 'user'
        AND v."ownerId" = u.id
        AND v."garageId" IS NOT NULL;
    `);

    await q(`
      UPDATE leave_requests lr
      SET "garageId" = u."garageId"
      FROM users u
      WHERE lr."garageId" IS NULL
        AND lr."mechanicId" = u.id::text
        AND u."garageId" IS NOT NULL;
    `);

    // Composite uniqueness (nullable garageId rows excluded)
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_services_garage_jobCard"
      ON services ("garageId", "jobCardNumber")
      WHERE "garageId" IS NOT NULL AND "jobCardNumber" IS NOT NULL;
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicles_garage_reg"
      ON vehicles ("garageId", "registrationNumber")
      WHERE "garageId" IS NOT NULL;
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invoices_garage_number"
      ON invoices ("garageId", "invoiceNumber")
      WHERE "garageId" IS NOT NULL AND "invoiceNumber" IS NOT NULL;
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_garage_customerCode"
      ON users ("garageId", "customerCode")
      WHERE "garageId" IS NOT NULL AND "customerCode" IS NOT NULL;
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicles_garage_vehicleCode"
      ON vehicles ("garageId", "vehicleCode")
      WHERE "garageId" IS NOT NULL AND "vehicleCode" IS NOT NULL;
    `);

    // One invoice document per job card (estimate upgrades to bill in place)
    await q(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN (
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public'
            AND t.relname = 'invoices'
            AND c.contype = 'u'
            AND pg_get_constraintdef(c.oid) ILIKE '%serviceId%'
            AND pg_get_constraintdef(c.oid) ILIKE '%documentType%'
        ) LOOP
          EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS %I', r.conname);
        END LOOP;
      END $$;
    `);

    await q(`
      DELETE FROM invoices i
      USING invoices j
      WHERE i."serviceId" = j."serviceId"
        AND i.id <> j.id
        AND (
          (j."documentType" = 'BILL' AND i."documentType" <> 'BILL')
          OR (
            i."documentType" = j."documentType"
            AND i."createdAt" < j."createdAt"
          )
        );
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invoices_service_one"
      ON invoices ("serviceId");
    `);
  }

  private async dropUniqueOnColumn(table: string, column: string) {
    try {
      await this.dataSource.query(`
        DO $$
        DECLARE r record;
        BEGIN
          FOR r IN (
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
              AND t.relname = '${table}'
              AND c.contype = 'u'
              AND pg_get_constraintdef(c.oid) ILIKE '%${column}%'
          ) LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', '${table}', r.conname);
          END LOOP;

          FOR r IN (
            SELECT i.relname AS idxname
            FROM pg_index x
            JOIN pg_class i ON i.oid = x.indexrelid
            JOIN pg_class t ON t.oid = x.indrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(x.indkey)
            WHERE n.nspname = 'public'
              AND t.relname = '${table}'
              AND x.indisunique
              AND NOT x.indisprimary
              AND a.attname = '${column}'
          ) LOOP
            EXECUTE format('DROP INDEX IF EXISTS %I', r.idxname);
          END LOOP;
        END $$;
      `);
    } catch (error) {
      this.logger.warn(
        `Could not drop unique on ${table}.${column}: ${(error as Error).message}`,
      );
    }
  }
}
