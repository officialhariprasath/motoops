import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';

import { ServiceEntity } from './service.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ServiceSubTaskEntity } from './service-subtask.entity';
import {TaskPartEntity} from './task-part.entity';

import { CreateDateColumn } from 'typeorm';
import { ServiceTaskCommentEntity } from './service-task-comment.entity';

export enum TaskStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  
}

@Entity('service_tasks')
export class ServiceTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

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

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalCost!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalCost!: number;

  @OneToMany(() => ServiceTaskCommentEntity, (comment) => comment.task, {
    cascade: true,
  })
  comments!: ServiceTaskCommentEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  // --------------------------------
  // SERVICE
  // --------------------------------
  @ManyToOne(() => ServiceEntity, (service) => service.tasks, {
    onDelete: 'CASCADE',
  })
  service!: ServiceEntity;

  // --------------------------------
  // ACCOUNTABLE TECHNICIAN
  // Main owner responsible
  // --------------------------------
  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
  })
  accountableTechnician!: UserEntity | null;

  // --------------------------------
  // TASK CREATED / ASSIGNED BY
  // --------------------------------
  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
  })
  assignedBy!: UserEntity | null;

  // --------------------------------
  // ASSIGNED MECHANICS
  // Multiple helpers
  // --------------------------------
  @ManyToMany(() => UserEntity, {
    eager: true,
  })
  @JoinTable({
    name: 'service_task_mechanics',
  })
  mechanics!: UserEntity[];

  @OneToMany(() => TaskPartEntity, (part) => part.task, {
      cascade: true,
      eager: true,
  })
  parts!: TaskPartEntity[];

  // --------------------------------
  // SUBTASKS
  // --------------------------------
  @OneToMany(() => ServiceSubTaskEntity, (subtask) => subtask.task, {
    cascade: true,
    eager: true,
  })
  subtasks!: ServiceSubTaskEntity[];

 
  
}