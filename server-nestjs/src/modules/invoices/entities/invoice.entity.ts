import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { ServiceEntity } from '../../services/entities/service.entity';
import { UserEntity } from '../../users/entities/user.entity';

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type InvoiceDocumentType = 'ESTIMATE' | 'BILL';

@Entity('invoices')
@Index(['service'], { unique: true })
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  garageId?: string | null;

  @Column({ nullable: true })
  invoiceNumber?: string;

  @Column({ type: 'varchar', default: 'BILL' })
  documentType!: InvoiceDocumentType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  dueAmount!: number;

  @Column({ default: 'unpaid' })
  paymentStatus!: PaymentStatus;

  /** Snapshot of next-service block for A4 invoice print (BILL only). */
  @Column({ type: 'simple-json', nullable: true })
  billExtras?: {
    includeNextServiceOnBill?: boolean;
    nextServiceOdometer?: string;
    nextServiceAt?: string | null;
    futureWorksNotes?: string;
  };

  @ManyToOne(() => ServiceEntity, (service) => service.invoices, {
    eager: true,
    onDelete: 'CASCADE',
  })
  service!: ServiceEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  generatedBy!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
