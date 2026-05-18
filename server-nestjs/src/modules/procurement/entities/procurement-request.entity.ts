import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { ProcurementItemEntity } from './procurement-item.entity';

export enum ProcurementRequestStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  RETURNED = 'returned',
  REJECTED = 'rejected',
}

@Entity('procurement_requests')
export class ProcurementRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProcurementItemEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  item!: ProcurementItemEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  mechanic!: UserEntity;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: ProcurementRequestStatus,
    default: ProcurementRequestStatus.PENDING,
  })
  status!: ProcurementRequestStatus;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
