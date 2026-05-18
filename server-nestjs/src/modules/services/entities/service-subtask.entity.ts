import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { ServiceTaskEntity } from './service-task.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('service_subtasks')
export class ServiceSubTaskEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  completed!: boolean;

  @Column({
  type: 'enum',
  enum: [
    'PENDING',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
  ],
  default: 'PENDING',
  })
  status!: string;

  @Column({
    type: 'int',
    default: 0,
  })
  estimatedDuration!: number;

  @Column({
    type: 'int',
    default: 0,
  })
  progress!: number;

  @ManyToOne(() => ServiceTaskEntity, (task) => task.subtasks, {
    onDelete: 'CASCADE',
  })
  task!: ServiceTaskEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
  })
  assignedTo!: UserEntity | null;

  @CreateDateColumn()
  createdAt!: Date;
}