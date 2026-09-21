import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('garage_settings')
export class GarageSettingsEntity {
  @PrimaryColumn({ type: 'uuid' })
  garageId!: string;

  @Column({ type: 'simple-json', nullable: true })
  settings?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
