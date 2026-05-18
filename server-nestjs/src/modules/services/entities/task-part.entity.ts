import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { ServiceTaskEntity } from './service-task.entity';

@Entity('task_parts')
export class TaskPartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    nullable: true,
  })
  partNumber!: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 1,
  })
  quantity!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  unitPrice!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  totalPrice!: number;

  // --------------------------------
  // TASK
  // --------------------------------
  @ManyToOne(() => ServiceTaskEntity, (task) => task.parts, {
    onDelete: 'CASCADE',
  })
  task!: ServiceTaskEntity;
}