import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('catalog_items')
export class CatalogItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  garageId?: string | null;

  @Column()
  name!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  rate!: number;

  /** GENERAL = parts/supplies; PROFIT = labour/profit lines for dashboard. */
  @Column({ type: 'varchar', length: 16, default: 'GENERAL' })
  itemKind!: 'GENERAL' | 'PROFIT';

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
