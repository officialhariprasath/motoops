import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ServiceEntity } from '../../services/entities/service.entity';
import { UserEntity } from '../../users/entities/user.entity';

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  dueAmount!: number;

  @Column({ default: 'unpaid' })
  paymentStatus!: PaymentStatus;

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