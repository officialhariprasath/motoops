# MotoOps

Auto garage billing and job-card platform (Next.js + NestJS + PostgreSQL).

**Deploy:** see [DEPLOY.md](./DEPLOY.md) — same pattern as Finance Flow (Render API + Neon DB + Vercel UI).

---

# Auto Garage Management System

A full-stack, role-based garage operations platform built with Next.js, NestJS, TypeORM, and PostgreSQL.

This project is designed as a portfolio-grade SaaS-style application for managing real garage workflows: customers, vehicles, service job cards, mechanic assignments, task progress, comments, parts/tools procurement, invoices, payments, reports, and dashboard analytics.

## Why This Project Exists

Garage owners often track daily work manually: which vehicles are in service, which mechanic is assigned, what parts are needed, what tools are currently issued, what work has been completed, and which invoices are paid or pending.

This application centralizes those workflows into one system:

- Admins manage users, vehicles, services, invoices, inventory, reports, and settings.
- Mechanics view assigned jobs, update task/subtask progress, comment on work, and request needed tools or parts.
- Users/customers view their vehicles, service progress, mechanic comments, and invoices.

The goal is to demonstrate practical full-stack product development with real operational logic, not just CRUD screens.

## Demo Logins

```txt
Admin
Username: admin
Password: 123456

Mechanic
Username: demo_mechanic
Password: 123456

User / Customer
Username: demo_user
Password: 123456
```

## Run With Docker

```powershell
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:3001`

The Docker setup runs PostgreSQL, NestJS, and Next.js together. See [`DOCKER_GUIDE.md`](./DOCKER_GUIDE.md) for full Docker instructions, rebuild workflow, environment notes, and troubleshooting.

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- TanStack Query for server state
- React Hook Form
- Zod validation
- Lucide React icons

### Backend

- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL
- JWT authentication
- Passport JWT
- bcrypt password hashing
- class-validator and class-transformer
- Global response interceptor
- Global exception filter

### Architecture

- Frontend: `client-nextjs/`
- Backend API: `server-nestjs/`
- Database: PostgreSQL
- ORM: TypeORM
- API style: REST

React pages do not call the NestJS backend directly. They call Next.js API routes, and those routes proxy requests to the NestJS server through `BACKEND_SERVER_URL`.

## Main Features

### Role-Based Dashboards

The application supports three roles:

- Admin
- Mechanic
- User / Customer

Each role gets a different sidebar and dashboard experience.

Admins can maintain mechanic designations separately from role permissions. This lets the garage track whether a mechanic is junior, senior, lead, or another custom title while keeping the mechanic unable to edit that designation from their own profile.

### Admin Features

- Manage users
- Set mechanic designations such as Junior, Senior, Lead, or custom titles
- Manage vehicles
- Create and update service/job cards
- Assign accountable technicians and mechanics
- Add service tasks, subtasks, parts, and comments
- Generate invoices from service totals
- Update invoice payments
- Print professional invoices
- Track daily, weekly, and monthly revenue
- View service and invoice reports
- Manage garage procurement inventory
- Approve, reject, issue, and return tool/part requests
- Configure local garage/invoice settings

### Mechanic Features

- View assigned services
- View their admin-assigned designation on profile and workforce views
- See active tasks and previous/completed tasks
- View task details, required work, subtasks, and comments
- Update subtask progress from the mechanic dashboard
- Mark subtasks as pending, in progress, on hold, or completed
- Add work comments
- Request tools or parts needed for a job
- View what tools/parts are currently issued to them
- Track request status

### User / Customer Features

- View own vehicle list
- View own services
- Track service progress
- See mechanic comments
- Add comments or questions
- View own invoices
- Open printable invoice details

### Service Job Card Workflow

A service contains:

- Vehicle
- Customer
- Created by admin/user
- Status
- Problem description
- Notes
- Service date
- Delivery date
- Discount and tax
- Tasks
- Invoices

Each task can contain:

- Title and description
- Labor cost
- Additional cost
- Parts cost
- Total cost
- Accountable technician
- Assigned mechanics
- Parts
- Subtasks
- Comments

### Invoice System

Invoices are generated from service cost data.

The printable invoice includes:

- Garage header/logo
- Customer details
- Vehicle details
- Service status and dates
- Task breakdown
- Subtask progress
- Required parts
- Combined labor cost and additional cost
- Parts cost
- Subtotal
- Discount
- Tax
- Total amount
- Paid amount
- Due amount

### Procurement / Inventory System

Admins can track what the garage owns and who currently has what.

Inventory supports:

- Tools
- Parts
- SKU/code
- Total quantity
- Available quantity
- Storage location
- Notes

Mechanics can request items, and admins can:

- Approve and issue items
- Reject requests
- See currently issued tools/parts
- Mark items as returned

This models a real garage workflow where tools and parts move between storage and mechanics during daily work.

### Reports and Analytics

The dashboard and reports pages include:

- Total users
- Total vehicles
- Active services
- Completed services
- Daily revenue
- Weekly revenue
- Monthly revenue
- Paid, partial, and unpaid invoice counts
- Outstanding due amount
- Service status breakdown

## Security and Validation

Security-focused implementation details:

- Passwords hashed with bcrypt
- JWT-based authentication
- Role-based access flow
- Protected dashboard routes
- HTTP-only cookie-oriented auth flow
- DTO validation with class-validator
- Frontend validation with Zod
- NestJS exception filtering
- Centralized API response shape
- React pages use Next API proxy routes instead of calling backend directly
- Sensitive environment values are kept in `.env` files and should not be committed

## Project Structure

```txt
auto-garage-services/
  client-nextjs/
    app/
    components/
    lib/
    public/

  server-nestjs/
    src/
      modules/
        auth/
        users/
        vehicles/
        services/
        invoices/
        procurement/
      common/
      config/
```

## Key Frontend Routes

```txt
/dashboard
/dashboard/admin/users
/dashboard/admin/vehicles
/dashboard/admin/services
/dashboard/admin/services/create
/dashboard/admin/services/[id]
/dashboard/admin/services/[id]/edit
/dashboard/admin/invoices
/dashboard/admin/invoices/[id]
/dashboard/admin/invoices/[id]/payment
/dashboard/admin/procurement
/dashboard/mechanic
/dashboard/mechanic/services
/dashboard/mechanic/procurement
/dashboard/user
/dashboard/user/my-vehicles
/dashboard/user/my-services
/dashboard/user/my-invoices
/dashboard/reports
/dashboard/settings
```

## Key Backend Modules

- Auth
- Users
- Vehicles
- Services
- Service tasks
- Service subtasks
- Task parts
- Task comments
- Invoices
- Procurement

## Installation

### Backend

```bash
cd server-nestjs
npm install
npm run start:dev
```

### Frontend

```bash
cd client-nextjs
npm install
npm run dev
```

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3001
JWT_SECRET=your_secret
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=3600s
NODE_ENV=development
ENABLE_CORS=http://localhost:3000
```

### Frontend `.env`

```env
BACKEND_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## What This Project Demonstrates

This project demonstrates my ability to:

- Design a realistic business workflow from scratch
- Build role-based dashboards and protected user experiences
- Model relational data with TypeORM and PostgreSQL
- Create modular NestJS APIs
- Implement Next.js App Router pages and API proxy routes
- Build complex forms with nested tasks, parts, subtasks, and comments
- Handle service cost calculation and invoice generation
- Build printable business documents
- Add operational analytics and reporting
- Implement inventory/procurement workflows
- Debug and improve a growing full-stack codebase

## Future Improvements

- PDF invoice export
- Email/SMS notification for service updates
- File uploads for vehicle/service images
- Payment gateway integration
- Audit logs for inventory issue/return events
- More detailed mechanic productivity reports
- Docker deployment setup
- Automated test coverage for critical workflows

- ## License
MIT

## Author

Built as a full-stack portfolio project to demonstrate practical SaaS-style application development using Next.js, NestJS, PostgreSQL, TypeORM, and role-based business workflows.




