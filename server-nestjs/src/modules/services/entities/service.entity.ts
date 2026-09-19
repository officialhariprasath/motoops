import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { ServiceTaskEntity } from './service-task.entity';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { InvoiceEntity } from '../../invoices/entities/invoice.entity';

export enum ServiceStatus {
   PENDING = "PENDING",
   INSPECTION = "INSPECTION",
   CONFIRMED = "CONFIRMED",
   IN_PROGRESS = "IN_PROGRESS",
   COMPLETED = "COMPLETED",
   CANCELLED = "CANCELLED",
}

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: "enum",
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status!: ServiceStatus;

  @Column({
    nullable: true,
    type: 'text',
  })
  problemDescription!: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  notes!: string;

  @Column({ unique: true, nullable: true })
  jobCardNumber?: string;

  @Column({ type: 'timestamptz', nullable: true })
  jobCardAt?: Date;

  @Column({ type: 'int', default: 0 })
  petrolLevel!: number;

  @Column({ type: 'simple-json', nullable: true })
  lineItems?: Array<{
    id: string;
    description: string;
    rate: number;
    quantity: number;
    discountPercent: number;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  damagePhotoUrls?: string[];

  @Column({ type: 'simple-json', nullable: true })
  repairProofPhotoUrls?: string[];

  @Column({
    nullable: true,
    type: "date",
  })
  serviceDate!: Date;

  @Column({
    nullable: true,
    type: "date",
  })
  deliveryDate!: Date;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  subtotal!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  laborCost!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  partsCost!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  discount!: number;
  

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  tax!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  grandTotal!: number;

  

  // ---------------- VEHICLE ----------------
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.services, {
    eager: true,
    onDelete: 'CASCADE',
  })
  vehicle!: VehicleEntity;

  // ---------------- CUSTOMER ----------------
  @ManyToOne(() => UserEntity, (user) => user.customerServices, {
    eager: true,
  })
  customer!: UserEntity;

  // ---------------- CREATED BY ----------------
  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  createdBy!: UserEntity;

  // ---------------- ASSIGNED MECHANICS ----------------
  @ManyToMany(() => UserEntity, { eager: true })
  @JoinTable({
    name: 'service_assigned_mechanics',
  })
  assignedMechanics!: UserEntity[];

  // ---------------- SERVICE Tasks ----------------
  @OneToMany(() => ServiceTaskEntity, (task) => task.service, {
    cascade: true,
  })
  tasks!: ServiceTaskEntity[];

  // ---------------- INVOICE ----------------
  @OneToMany(() => InvoiceEntity, (invoice) => invoice.service)
  invoices!: InvoiceEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
