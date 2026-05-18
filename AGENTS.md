
# AGENTS.md

## Repository Location

The real project root is: G:\project\auto-garage-services

Do not use: G:\project\nestjs\auto-garage-services

That path may contain old or incomplete files.

---

## Project Purpose

This project is a role-based garage and vehicle service management platform for admins, mechanics, and users/customers.

Portfolio summary:

This is a full-stack SaaS-style garage operations system built to demonstrate production-minded architecture across service operations, role-based workflows, inventory/procurement, invoicing, reporting, and dashboard analytics. It uses a NestJS REST API with TypeORM/PostgreSQL and a Next.js App Router frontend with React Query, forms, protected dashboards, and role-specific user experiences.

Core features:
- Admin dashboard with live users, vehicles, active/completed services, and daily/weekly/monthly revenue
- Admin management for users, vehicles, services/job cards, tasks, parts, comments, invoices, and payment updates
- Service/job card workflow with vehicle, customer, assigned mechanics, accountable technician, tasks, subtasks, parts, comments, cost totals, discount, tax, and invoice generation
- Mechanic dashboard for assigned services, active tasks, previous/completed tasks, task details, comments, and subtask progress/status updates
- User/customer dashboard for viewing own vehicles, own services, mechanic comments, adding comments/questions, and viewing own invoices
- Professional printable invoice view with service breakdown, task/subtask progress, parts needed, labour cost, totals, paid amount, and due amount
- Garage procurement/inventory workflow for tracking tools/parts, available stock, mechanic requests, issued items, and returned items
- Reports page for service status, invoice status, revenue, and outstanding payment summaries
- Settings page for garage profile and invoice print defaults
- Role-based authentication and authorization for admin, mechanic, and user

Recruiter-facing highlights:
- End-to-end full-stack CRUD with relational data modeling
- Role-based dashboards for admin, mechanic, and user/customer workflows
- Real operational flows: job cards, task assignment, progress updates, comments, inventory requests, invoice generation, payment updates, and printable invoices
- REST API proxy pattern where React pages call Next API routes, and Next API routes call the NestJS backend
- PostgreSQL relations through TypeORM entities, DTO validation, guards/interceptors/filters, and modular NestJS structure
- Analytics/reporting layer for revenue, service status, invoice status, and outstanding payments

---

## Source of Truth

This file is the source of truth for future agent work.

If package files or routes conflict with this file, inspect the real code first and report the mismatch before changing behavior.

---

## Application Folders

Backend/NestJS API: server-nestjs/

Frontend/Next.js app: client-nextjs/

---

# Tech Stack

## Backend
- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Passport JWT
- Class Validator
- Class Transformer

## Frontend
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

## Database
- PostgreSQL

## ORM
- TypeORM is the only ORM used for application database access
- Prisma may exist in frontend dependencies as unused/legacy config only

---

# Project Structure

## Frontend

Location:

client-nextjs/

Important folders:

app/
components/
lib/
lib/provider/
lib/store/
lib/validations/

## Backend
Location:

server-nestjs/

Important folders:

src/modules/
src/common/
src/config/

## Next.js routing rules

Use App Router.

Page routes:

- app/(admin)/dashboard/page.tsx
- app/(admin)/dashboard/Profile/page.tsx
- app/(admin)/dashboard/reports/page.tsx
- app/(admin)/dashboard/settings/page.tsx
- app/(admin)/dashboard/admin/services/page.tsx
- app/(admin)/dashboard/admin/services/list/page.tsx
- app/(admin)/dashboard/admin/services/create/page.tsx
- app/(admin)/dashboard/admin/services/[id]/page.tsx
- app/(admin)/dashboard/admin/services/[id]/edit/page.tsx
- app/(admin)/dashboard/admin/vehicles/page.tsx
- app/(admin)/dashboard/admin/vehicles/[id]/route.ts
- app/(admin)/dashboard/admin/users/page.tsx
- app/(admin)/dashboard/admin/invoices/page.tsx
- app/(admin)/dashboard/admin/invoices/[id]/page.tsx
- app/(admin)/dashboard/admin/invoices/[id]/payment/page.tsx
- app/(admin)/dashboard/admin/procurement/page.tsx
- app/(admin)/dashboard/mechanic/page.tsx
- app/(admin)/dashboard/mechanic/services/page.tsx
- app/(admin)/dashboard/mechanic/procurement/page.tsx
- app/(admin)/dashboard/user/page.tsx
- app/(admin)/dashboard/user/my-services/page.tsx
- app/(admin)/dashboard/user/my-invoices/page.tsx
- app/(admin)/dashboard/user/my-vehicles/page.tsx

Next API routes:

- app/api/login/route.ts
- app/api/logout/route.ts
- app/api/user/route.ts
- app/api/user/[id]/route.ts
- app/api/customer/vehicles/route.ts
- app/api/vehicles/route.ts
- app/api/vehicles/search/route.ts
- app/api/services/route.ts
- app/api/services/[serviceId]/route.ts
- app/api/tasks/[taskId]/route.ts
- app/api/tasks/[taskId]/accountable-technician/route.ts
- app/api/tasks/[taskId]/comments/route.ts
- app/api/tasks/[taskId]/mechanics/route.ts
- app/api/tasks/[taskId]/parts/route.ts
- app/api/tasks/[taskId]/subtasks/route.ts
- app/api/parts/[partId]/route.ts
- app/api/subtasks/[subtaskId]/route.ts
- app/api/task-comments/[commentId]/route.ts
- app/api/invoices/route.ts
- app/api/invoices/[id]/route.ts
- app/api/procurement/items/route.ts
- app/api/procurement/items/[id]/route.ts
- app/api/procurement/requests/route.ts
- app/api/procurement/requests/[id]/status/route.ts

Do not call NestJS directly from React pages. React pages should call Next API routes like:

fetch("/api/services")

Invoice page links must use the admin dashboard route:

- View invoice: /dashboard/admin/invoices/[id]
- Update payment: /dashboard/admin/invoices/[id]/payment

Do not link invoice pages to /dashboard/invoices/[id]; that route does not exist.

## Main Backend Modules

- auth
- users
- customers
- vehicles
- services
- tasks
- invoices
- procurement
- comments
- subtasks

## Backend Setup

Backend package file: server-nestjs/package.json
Backend TypeScript config: server-nestjs/tsconfig.json
Backend env file: server-nestjs/.env

Run backend from `server-nestjs`:

```bash
npm run start:dev
```

---

# Commands

## Backend Commands

Install:

npm install

Run dev server:

npm run start:dev

Build:

npm run build

Run production:

npm run start:prod

Lint:

npm run lint

Test:

npm run test

Test coverage:

npm run test:cov

E2E test:

npm run test:e2e

## Frontend Commands

Install:

npm install

Run dev:

npm run dev

Build:

npm run build

Start production:

npm run start

Lint:

npm run lint

---

# Environment Variables

## Backend .env keys

Required keys:

DATABASE_URL=
PORT=
JWT_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=

TYPEORM_CONNECTION=
TYPEORM_HOST=
TYPEORM_PORT=
TYPEORM_USERNAME=
TYPEORM_PASSWORD=
TYPEORM_DATABASE=
TYPEORM_SSL=
TYPEORM_ENTITIES=
TYPEORM_SYNCHRONIZE=
TYPEORM_LOGGING=

NODE_ENV=
ENABLE_CORS=

## Example values

PORT=4000

NODE_ENV=development

JWT_EXPIRES_IN=7d

TYPEORM_CONNECTION=postgres

TYPEORM_HOST=localhost

TYPEORM_PORT=5432

TYPEORM_USERNAME=postgres

TYPEORM_PASSWORD=postgres

TYPEORM_DATABASE=garage_service

## Frontend env

BACKEND_SERVER_URL=http://localhost:3001

Important:

Do not print or expose secret env values. Only inspect variable names unless the user explicitly asks.
---

# Database Information

Engine:
- PostgreSQL

Backend ORM:
- TypeORM

Migration workflow:
- Prefer TypeORM migrations
- Avoid synchronize=true in production

Seed workflow:
- Manual seed scripts
- Seed admin, mechanics, demo customers, demo vehicles

Important:
- Do not drop production tables
- Avoid destructive migration changes without backup

---

# API Conventions

API style:
- REST API

## Route conventions

Backend routes:

/services
/vehicles
/customers
/users
/invoices
/tasks
/comments

## Next.js API route conventions

React pages should NEVER directly call NestJS backend.

Frontend pages should call:

/api/services
/api/invoices

Next API routes should proxy requests to:

process.env.BACKEND_SERVER_URL

## DTO rules

Use:
- class-validator
- class-transformer

Validate:
- IDs
- enums
- numbers
- required fields

## Response conventions

Prefer:

{
  success: true,
  data: ...
}

Throw:
- NotFoundException
- BadRequestException
- UnauthorizedException

Avoid returning raw database errors.

---

# Authentication

Auth type:
- JWT Authentication
- Access token
- Refresh token

Backend:
- Passport JWT
- RolesGuard

Frontend:
- Middleware protected routes

## Roles

Supported roles:

- admin
- mechanic
- customer

## Permissions

Admin:
- Full access

Mechanic:
- View assigned services
- View tasks
- View comments
- Add comments
- Edit own comments

Customer:
- View own services/invoices only

---

# Service Domain Model

A service contains:
- vehicle
- customer
- createdBy
- status
- serviceDate
- deliveryDate
- notes
- discount
- tax
- tasks
- invoices

A task contains:
- title
- description
- laborCost
- additionalCost
- partsCost
- totalCost
- accountableTechnician
- mechanics
- parts
- subtasks
- comments

A part contains:
- name
- partNumber
- quantity
- unitPrice
- totalPrice

A comment contains:
- message
- internal
- status
- createdBy

An invoice contains:
- totalAmount
- paidAmount
- dueAmount
- paymentStatus

---

# Cost Calculation Rules

Task:

partsCost = sum(parts.quantity * parts.unitPrice)

task.totalCost =  laborCost +  additionalCost +  partsCost

Service:

subtotal = sum(task.totalCost)

service.totalCost =
  subtotal -
  discount +
  tax

Invoice:

dueAmount =
  totalAmount -
  paidAmount

paymentStatus:
- unpaid
- partial
- paid

---

# Backend Update Rules

When updating services:

DO:
- Remove old tasks using taskRepo.remove()
- Recreate tasks, parts, comments, subtasks
- Recalculate totals
- Return fresh findOne()

DO NOT:
- Use taskRepo.delete() for relational entities
- Load old tasks into update entity

Correct update pattern:

const service = await this.serviceRepo.findOne({
  where: { id },
  relations: ["createdBy"],
});

Avoid:

const service = await this.findOne(id);

inside update.

---

# Frontend Rules

## Forms

Use:
- React Hook Form
- Zod
- useFieldArray

Task tabs:
- TaskDetailsTab
- TaskPartsTab
- TaskSubtasksTab
- TaskCommentsTab

## Query Rules

Invalidate queries after update:

queryClient.invalidateQueries({
  queryKey: ["services"]
})

queryClient.invalidateQueries({
  queryKey: ["service", id]
})

## Vehicle selection rule

When vehicle selected:

setValue("vehicleId", vehicle.id)

setValue(
  "customerId",
  vehicle.owner?.id ?? ""
)

---

# UI Rules

Use shadcn/ui components:
- Card
- Button
- Input
- Textarea
- Tabs
- Select
- Popover

Tabs must:
- Have visible background
- Have clear active state
- Use spacing between header/content

---

# Coding Rules

## Naming

Entities:
- PascalCase

DTOs:
- CreateXDto
- UpdateXDto

Files:
- kebab-case or framework standard

Variables:
- camelCase

## Structure

Each Nest module should contain:
- controller
- service
- dto
- entities

Avoid huge services.

## Error Handling

Use Nest exceptions.

Never:
- swallow errors
- return raw SQL errors

## Frontend

Avoid direct backend fetches in pages.

Always use:
- Next API routes
- React Query

---

# Testing Expectations

Backend:
- Unit tests for services
- E2E tests for critical APIs

Frontend:
- Form validation tests
- API integration tests
- Role permission checks

Critical workflows to test:
- create service
- update service
- generate invoice
- update payment
- add/edit comments
- mechanic permissions

---

# Things Not To Touch

Avoid modifying:
- dist/
- generated Prisma files
- deployment configs
- legacy modules without review
- auth middleware unless required
- existing route conventions

Do not rename:
- API routes
- module names
- entity table names

without full project-wide update.

---

# Common Bugs

## 404 routes

Check:
- page.tsx spelling
- folder path
- dynamic segment naming

Then:
- delete .next
- restart dev server

## Unexpected token '<'

Means HTML returned instead of JSON.

Check:
- API route exists
- BACKEND_SERVER_URL
- backend server running

## Update not saving tasks/comments/parts

Check:
- browser PATCH payload
- Nest controller dto log
- taskRepo.remove usage
- query invalidation

## Delete not working

Check:
- Next API route has DELETE
- Nest controller has @Delete(':id')

## Frontend Database Rule

The frontend does not use Prisma.

Do not add, use, or generate Prisma code inside `client-nextjs`.

The frontend must not connect directly to PostgreSQL or any database.

All database access must happen through the NestJS backend in `server-nestjs`.

Frontend data flow should be:

React page/component
-> Next.js API route in `client-nextjs/app/api/`
-> NestJS REST API using `process.env.BACKEND_SERVER_URL`
-> PostgreSQL through TypeORM in `server-nestjs`

## Dependency Warning

If Prisma appears in `client-nextjs/package.json`, treat it as unused/legacy unless the user explicitly asks to clean it up.

Do not run:

```bash
prisma generate
prisma migrate
```
