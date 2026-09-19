/**
 * Idempotent demo seed for local/Docker Postgres.
 * Run: npm run seed  (DATABASE_URL required)
 * Login: admin / 123456
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { UserEntity } from '../modules/users/entities/user.entity';
import { Role } from '../modules/users/enums/role.enum';
import { VehicleEntity } from '../modules/vehicles/entities/vehicle.entity';
import {
  ServiceEntity,
  ServiceStatus,
} from '../modules/services/entities/service.entity';
import { ServiceTaskEntity } from '../modules/services/entities/service-task.entity';
import { ServiceSubTaskEntity } from '../modules/services/entities/service-subtask.entity';
import { TaskPartEntity } from '../modules/services/entities/task-part.entity';
import { ServiceTaskCommentEntity } from '../modules/services/entities/service-task-comment.entity';
import { InvoiceEntity } from '../modules/invoices/entities/invoice.entity';
import { CatalogItemEntity } from '../modules/catalog/entities/catalog-item.entity';

const MARKER_USERNAME = 'demo_seed_v1';

function lineTotal(
  items: Array<{ rate: number; quantity: number; discountPercent: number }>,
) {
  return items.reduce((sum, item) => {
    const amount = item.rate * item.quantity;
    return sum + (amount - (amount * item.discountPercent) / 100);
  }, 0);
}

function item(
  description: string,
  rate: number,
  quantity = 1,
  discountPercent = 0,
) {
  return {
    id: crypto.randomUUID(),
    description,
    rate,
    quantity,
    discountPercent,
  };
}

async function upsertUser(
  ds: DataSource,
  data: Partial<UserEntity> & {
    username: string;
    email: string;
    mobile: string;
    name: string;
    password: string;
    role: Role;
  },
) {
  const repo = ds.getRepository(UserEntity);
  let user = await repo.findOne({ where: { username: data.username } });
  if (!user) {
    user = await repo.findOne({ where: { mobile: data.mobile } });
  }
  if (!user && data.customerCode) {
    user = await repo.findOne({ where: { customerCode: data.customerCode } });
  }
  if (!user && data.email) {
    user = await repo.findOne({ where: { email: data.email } });
  }
  const hashed = await bcrypt.hash(data.password, 10);
  if (user) {
    Object.assign(user, {
      name: data.name,
      username: data.username,
      email: data.email,
      mobile: data.mobile,
      address: data.address || user.address,
      designation: data.designation ?? user.designation,
      role: data.role,
      customerCode: data.customerCode ?? user.customerCode,
      isVerified: true,
      password: hashed,
    });
    return repo.save(user);
  }
  return repo.save(
    repo.create({
      ...data,
      password: hashed,
      address: data.address || 'Demo address',
      isVerified: true,
    }),
  );
}

async function upsertVehicle(
  ds: DataSource,
  data: {
    registrationNumber: string;
    vehicleCode: string;
    brand: string;
    model: string;
    year: string;
    owner: UserEntity;
    engineNumber?: string;
    chassisNumber?: string;
    mileage?: string;
  },
) {
  const repo = ds.getRepository(VehicleEntity);
  let vehicle = await repo.findOne({
    where: { registrationNumber: data.registrationNumber },
    relations: ['owner'],
  });
  if (!vehicle) {
    vehicle = await repo.findOne({
      where: { vehicleCode: data.vehicleCode },
      relations: ['owner'],
    });
  }
  if (!vehicle) {
    vehicle = repo.create({
      registrationNumber: data.registrationNumber,
      vehicleCode: data.vehicleCode,
      brand: data.brand,
      model: data.model,
      year: data.year,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
      mileage: data.mileage,
      owner: data.owner,
    });
  } else {
    Object.assign(vehicle, {
      registrationNumber: data.registrationNumber,
      vehicleCode: data.vehicleCode,
      brand: data.brand,
      model: data.model,
      year: data.year,
      owner: data.owner,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
      mileage: data.mileage,
    });
  }
  return repo.save(vehicle);
}

async function upsertJob(
  ds: DataSource,
  data: {
    jobCardNumber: string;
    status: ServiceStatus;
    customer: UserEntity;
    vehicle: VehicleEntity;
    createdBy: UserEntity;
    assignedMechanics: UserEntity[];
    problemDescription: string;
    notes?: string;
    lineItems: ReturnType<typeof item>[];
    petrolLevel?: number;
  },
) {
  const repo = ds.getRepository(ServiceEntity);
  let job = await repo.findOne({
    where: { jobCardNumber: data.jobCardNumber },
    relations: ['assignedMechanics', 'customer', 'vehicle'],
  });
  const total = Number(lineTotal(data.lineItems).toFixed(2));
  const payload = {
    status: data.status,
    customer: data.customer,
    vehicle: data.vehicle,
    createdBy: data.createdBy,
    assignedMechanics: data.assignedMechanics,
    problemDescription: data.problemDescription,
    notes: data.notes || '',
    lineItems: data.lineItems,
    petrolLevel: data.petrolLevel ?? 5,
    jobCardAt: new Date(),
    serviceDate: new Date(),
    subtotal: total,
    totalCost: total,
    grandTotal: total,
  };
  if (!job) {
    job = repo.create({
      jobCardNumber: data.jobCardNumber,
      ...payload,
    });
  } else {
    Object.assign(job, payload);
  }
  return repo.save(job);
}

async function upsertInvoice(
  ds: DataSource,
  data: {
    service: ServiceEntity;
    generatedBy: UserEntity;
    documentType: 'ESTIMATE' | 'BILL';
    invoiceNumber: string;
    paidAmount: number;
  },
) {
  const repo = ds.getRepository(InvoiceEntity);
  const total = Number(data.service.totalCost || 0);
  const paid = Math.max(0, data.paidAmount);
  const due = Math.max(total - paid, 0);
  let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
  if (total > 0 && paid >= total) paymentStatus = 'paid';
  else if (paid > 0) paymentStatus = 'partial';

  let invoice = await repo.findOne({
    where: {
      service: { id: data.service.id },
      documentType: data.documentType,
    },
  });
  if (!invoice) {
    invoice = repo.create({
      service: data.service,
      generatedBy: data.generatedBy,
      documentType: data.documentType,
      invoiceNumber: data.invoiceNumber,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus,
    });
  } else {
    Object.assign(invoice, {
      generatedBy: data.generatedBy,
      invoiceNumber: data.invoiceNumber,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus,
    });
  }
  return repo.save(invoice);
}

async function ensureCatalog(ds: DataSource) {
  const repo = ds.getRepository(CatalogItemEntity);
  const extras = [
    { name: 'Demo Fork Oil Seal', rate: 320 },
    { name: 'Demo Wheel Bearing', rate: 280 },
    { name: 'Demo Disc Pad Set', rate: 450 },
    { name: 'Demo Carburetor Cleaning', rate: 350 },
    { name: 'Demo Electrical Check', rate: 250 },
    { name: 'Demo Alignment', rate: 300 },
    { name: 'Demo Coolant Top-up', rate: 180 },
    { name: 'Demo Full Service Labour', rate: 800 },
  ];
  for (const row of extras) {
    const existing = await repo.findOne({ where: { name: row.name } });
    if (!existing) {
      await repo.save(repo.create({ ...row, isActive: true }));
    }
  }
}

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [
      UserEntity,
      VehicleEntity,
      ServiceEntity,
      ServiceTaskEntity,
      ServiceSubTaskEntity,
      TaskPartEntity,
      ServiceTaskCommentEntity,
      InvoiceEntity,
      CatalogItemEntity,
    ],
    synchronize: false,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  await ds.initialize();
  console.log('Connected. Seeding demo data...');

  const marker = await ds.getRepository(UserEntity).findOne({
    where: { username: MARKER_USERNAME },
  });
  if (marker) {
    console.log('Demo seed already applied (marker found). Upserting anyway...');
  }

  await ensureCatalog(ds);

  const password = '123456';

  const admin = await upsertUser(ds, {
    username: 'admin',
    email: 'admin@garage.demo',
    mobile: '9000000000',
    name: 'Garage Admin',
    password,
    role: Role.ADMIN,
    address: 'Main Garage, Demo City',
    designation: 'Owner',
  });

  const mech1 = await upsertUser(ds, {
    username: 'demo_mechanic',
    email: 'mech1@garage.demo',
    mobile: '9000000101',
    name: 'Ravi Mechanic',
    password,
    role: Role.MECHANIC,
    address: 'Workshop Bay 1',
    designation: 'Senior Mechanic',
  });

  const mech2 = await upsertUser(ds, {
    username: 'demo_mechanic_2',
    email: 'mech2@garage.demo',
    mobile: '9000000102',
    name: 'Suresh Mechanic',
    password,
    role: Role.MECHANIC,
    address: 'Workshop Bay 2',
    designation: 'Mechanic',
  });

  const customers = await Promise.all([
    upsertUser(ds, {
      username: 'cust_arun',
      email: 'arun@demo.customer',
      mobile: '9000001001',
      name: 'Arun Kumar',
      password,
      role: Role.USER,
      customerCode: 'JMC000001',
      address: '12 Anna Nagar, Chennai',
    }),
    upsertUser(ds, {
      username: 'cust_priya',
      email: 'priya@demo.customer',
      mobile: '9000001002',
      name: 'Priya Sharma',
      password,
      role: Role.USER,
      customerCode: 'JMC000002',
      address: '45 MG Road, Bengaluru',
    }),
    upsertUser(ds, {
      username: 'cust_vijay',
      email: 'vijay@demo.customer',
      mobile: '9000001003',
      name: 'Vijay Singh',
      password,
      role: Role.USER,
      customerCode: 'JMC000003',
      address: '88 Ring Road, Coimbatore',
    }),
    upsertUser(ds, {
      username: 'cust_meena',
      email: 'meena@demo.customer',
      mobile: '9000001004',
      name: 'Meena Devi',
      password,
      role: Role.USER,
      customerCode: 'JMC000004',
      address: '3 Lake View, Madurai',
    }),
    upsertUser(ds, {
      username: 'cust_karthik',
      email: 'karthik@demo.customer',
      mobile: '9000001005',
      name: 'Karthik R',
      password,
      role: Role.USER,
      customerCode: 'JMC000005',
      address: '21 Cross Street, Trichy',
    }),
  ]);

  const vehicles = await Promise.all([
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1001',
      vehicleCode: 'JMV000001',
      brand: 'Honda',
      model: 'Activa 6G',
      year: '2022',
      owner: customers[0],
      engineNumber: 'ENG1001',
      chassisNumber: 'CHS1001',
      mileage: '12400',
    }),
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1002',
      vehicleCode: 'JMV000002',
      brand: 'TVS',
      model: 'Apache RTR 160',
      year: '2021',
      owner: customers[1],
      engineNumber: 'ENG1002',
      chassisNumber: 'CHS1002',
      mileage: '18200',
    }),
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1003',
      vehicleCode: 'JMV000003',
      brand: 'Bajaj',
      model: 'Pulsar 150',
      year: '2020',
      owner: customers[2],
      engineNumber: 'ENG1003',
      chassisNumber: 'CHS1003',
      mileage: '24100',
    }),
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1004',
      vehicleCode: 'JMV000004',
      brand: 'Yamaha',
      model: 'FZ-S',
      year: '2023',
      owner: customers[3],
      engineNumber: 'ENG1004',
      chassisNumber: 'CHS1004',
      mileage: '5600',
    }),
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1005',
      vehicleCode: 'JMV000005',
      brand: 'Hero',
      model: 'Splendor Plus',
      year: '2019',
      owner: customers[4],
      engineNumber: 'ENG1005',
      chassisNumber: 'CHS1005',
      mileage: '32000',
    }),
    upsertVehicle(ds, {
      registrationNumber: 'TN09AB1006',
      vehicleCode: 'JMV000006',
      brand: 'Royal Enfield',
      model: 'Classic 350',
      year: '2022',
      owner: customers[0],
      engineNumber: 'ENG1006',
      chassisNumber: 'CHS1006',
      mileage: '9800',
    }),
  ]);

  const jobPending = await upsertJob(ds, {
    jobCardNumber: 'JC000001',
    status: ServiceStatus.PENDING,
    customer: customers[0],
    vehicle: vehicles[0],
    createdBy: admin,
    assignedMechanics: [mech1],
    problemDescription: 'General service and oil change',
    lineItems: [
      item('Engine Oil (1L)', 450, 1),
      item('Oil Filter', 120, 1),
      item('General Service Labour', 400, 1),
    ],
  });

  const jobProgress = await upsertJob(ds, {
    jobCardNumber: 'JC000002',
    status: ServiceStatus.IN_PROGRESS,
    customer: customers[1],
    vehicle: vehicles[1],
    createdBy: admin,
    assignedMechanics: [mech1, mech2],
    problemDescription: 'Brake noise and chain slack',
    lineItems: [
      item('Brake Shoe / Pad', 350, 1),
      item('Brake Oil', 120, 1),
      item('Chain Lubricant', 180, 1),
      item('Demo Full Service Labour', 800, 1, 5),
    ],
  });

  const jobDone1 = await upsertJob(ds, {
    jobCardNumber: 'JC000003',
    status: ServiceStatus.COMPLETED,
    customer: customers[2],
    vehicle: vehicles[2],
    createdBy: admin,
    assignedMechanics: [mech2],
    problemDescription: 'Battery drain and bulb replacement',
    lineItems: [
      item('Battery', 2500, 1),
      item('Headlight Bulb', 90, 1),
      item('Demo Electrical Check', 250, 1),
    ],
  });

  const jobDone2 = await upsertJob(ds, {
    jobCardNumber: 'JC000004',
    status: ServiceStatus.COMPLETED,
    customer: customers[3],
    vehicle: vehicles[3],
    createdBy: admin,
    assignedMechanics: [mech1],
    problemDescription: 'Puncture and tube replacement',
    lineItems: [
      item('Puncture Repair', 50, 1),
      item('Tube', 280, 1),
      item('Wash & Polish', 200, 1),
    ],
  });

  const jobEstimateOnly = await upsertJob(ds, {
    jobCardNumber: 'JC000005',
    status: ServiceStatus.IN_PROGRESS,
    customer: customers[4],
    vehicle: vehicles[4],
    createdBy: admin,
    assignedMechanics: [mech2],
    problemDescription: 'Clutch slipping — estimate shared',
    lineItems: [
      item('Clutch Plate', 650, 1),
      item('Clutch Cable', 150, 1),
      item('Demo Full Service Labour', 800, 1),
    ],
  });

  await upsertInvoice(ds, {
    service: jobProgress,
    generatedBy: admin,
    documentType: 'ESTIMATE',
    invoiceNumber: 'JME000001',
    paidAmount: 0,
  });

  await upsertInvoice(ds, {
    service: jobEstimateOnly,
    generatedBy: admin,
    documentType: 'ESTIMATE',
    invoiceNumber: 'JME000002',
    paidAmount: 0,
  });

  await upsertInvoice(ds, {
    service: jobDone1,
    generatedBy: admin,
    documentType: 'BILL',
    invoiceNumber: 'JMI000001',
    paidAmount: Number(jobDone1.totalCost),
  });

  await upsertInvoice(ds, {
    service: jobDone2,
    generatedBy: admin,
    documentType: 'BILL',
    invoiceNumber: 'JMI000002',
    paidAmount: Math.round(Number(jobDone2.totalCost) * 0.5),
  });

  await upsertInvoice(ds, {
    service: jobPending,
    generatedBy: admin,
    documentType: 'ESTIMATE',
    invoiceNumber: 'JME000003',
    paidAmount: 0,
  });

  // Unpaid bill on a completed job (estimate already exists for progress job)
  const jobUnpaid = await upsertJob(ds, {
    jobCardNumber: 'JC000006',
    status: ServiceStatus.COMPLETED,
    customer: customers[0],
    vehicle: vehicles[5],
    createdBy: admin,
    assignedMechanics: [mech1],
    problemDescription: 'Fork seal leak — billed, awaiting payment',
    lineItems: [
      item('Demo Fork Oil Seal', 320, 2),
      item('Demo Full Service Labour', 800, 1),
    ],
  });

  await upsertInvoice(ds, {
    service: jobUnpaid,
    generatedBy: admin,
    documentType: 'BILL',
    invoiceNumber: 'JMI000003',
    paidAmount: 0,
  });

  await upsertUser(ds, {
    username: MARKER_USERNAME,
    email: 'seed.marker@garage.demo',
    mobile: '9000000999',
    name: 'Demo Seed Marker',
    password,
    role: Role.ADMIN,
    address: 'Internal',
    designation: 'System',
  });

  await ds.destroy();
  console.log('Demo seed complete.');
  console.log('Login: admin / 123456');
  console.log('Mechanics: demo_mechanic / demo_mechanic_2 (password 123456)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
