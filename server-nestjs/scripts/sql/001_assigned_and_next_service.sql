-- MotoOps: ASSIGNED + next-service + leave_requests
-- Run on Neon when TYPEORM_SYNC=false.

DO $$
BEGIN
  ALTER TYPE services_status_enum ADD VALUE IF NOT EXISTS 'ASSIGNED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN
    RAISE NOTICE 'Enum type not found; add ASSIGNED manually if needed.';
END $$;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS "nextServiceOdometer" character varying NULL,
  ADD COLUMN IF NOT EXISTS "nextServiceAt" date NULL,
  ADD COLUMN IF NOT EXISTS "futureWorksNotes" text NULL,
  ADD COLUMN IF NOT EXISTS "includeNextServiceOnBill" boolean NOT NULL DEFAULT false;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS "nextServiceAt" date NULL,
  ADD COLUMN IF NOT EXISTS "nextServiceOdometer" character varying NULL,
  ADD COLUMN IF NOT EXISTS "futureWorksNotes" text NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS "billExtras" text NULL;

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
