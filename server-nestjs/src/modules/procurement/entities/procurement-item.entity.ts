import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProcurementItemType {
  TOOL = 'tool',
  PART = 'part',
}

@Entity('procurement_items')
export class ProcurementItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: ProcurementItemType,
    default: ProcurementItemType.TOOL,
  })
  type!: ProcurementItemType;

  @Column({ nullable: true })
  sku?: string;

  @Column({ type: 'int', default: 0 })
  totalQuantity!: number;

  @Column({ type: 'int', default: 0 })
  availableQuantity!: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
