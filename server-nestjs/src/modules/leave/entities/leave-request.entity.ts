import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

@Entity('leave_requests')
export class LeaveRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  mechanicId!: string;

  @Column()
  mechanicName!: string;

  @Column()
  leaveType!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: LeaveStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
