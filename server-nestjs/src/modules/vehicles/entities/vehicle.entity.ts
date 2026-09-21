import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { ServiceEntity } from '../../services/entities/service.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  garageId?: string | null;

  @Column({ unique: true, nullable: true })
  vehicleCode?: string;

  @Column()
  registrationNumber!: string;

  @Column({ nullable: true })
  vinNumber!: string;

  @Column()
  brand!: string;

  @Column()
  model!: string;

  @Column()
  year!: string;

  @Column({ nullable: true })
  color!: string;

  @Column({ nullable: true })
  engineNumber!: string;

  @Column({ nullable: true })
  chassisNumber!: string;

  @Column({ nullable: true })
  mileage!: string;

  /** Next due service (copied from job card when bill / next-service is saved). */
  @Column({ type: 'date', nullable: true })
  nextServiceAt?: Date;

  @Column({ nullable: true })
  nextServiceOdometer?: string;

  @Column({ type: 'text', nullable: true })
  futureWorksNotes?: string;

  @Column({ type: 'text', nullable: true })
  photoUrl?: string;

  // ---------------- OWNER ----------------
  @ManyToOne(() => UserEntity, (user) => user.vehicles)
  owner!: UserEntity;

  // ---------------- SERVICES ----------------
  @OneToMany(() => ServiceEntity, (service) => service.vehicle)
  services!: ServiceEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
