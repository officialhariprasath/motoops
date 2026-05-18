import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { ServiceTaskEntity } from './service-task.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum TaskCommentType {
  UPDATE = 'update',
  ISSUE = 'issue',
  COMPLETION_NOTE = 'completion_note',
  GENERAL = 'general',
}

@Entity('service_task_comments')
export class ServiceTaskCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: false })
  internal!: boolean;

  @Column({ nullable: true })
  status!: string;

  // ================= TASK =================
  @ManyToOne(
    () => ServiceTaskEntity,
    (task) => task.comments,
    {
      onDelete: 'CASCADE',
    },
  )
  task!: ServiceTaskEntity;

  // ================= AUTHOR (MECHANIC / USER) =================
  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  createdBy!: UserEntity;

  // ================= COMMENT =================
  @Column('text')
  message!: string;

  // ================= TYPE =================
  @Column({
    type: 'enum',
    enum: TaskCommentType,
    default: TaskCommentType.UPDATE,
  })
  type!: TaskCommentType;

  // ================= OPTIONAL PROGRESS =================
  @Column({ type: 'int', nullable: true })
  progressPercentage?: number;

  // ================= TIME =================
  @CreateDateColumn()
  createdAt!: Date;
}