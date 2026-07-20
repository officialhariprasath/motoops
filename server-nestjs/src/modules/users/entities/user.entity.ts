import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { Role } from '../enums/role.enum';

/*
export enum Role {
  ADMIN = 'admin',
  MECHANIC = 'mechanic',
  USER = 'user',
} */

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  mobile!: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  designation?: string;

  @Column()
  @Exclude()
  password!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({ default: true })
  isVerified!: boolean;

  @Column({ type: 'text', nullable: true, select: false })
  verificationToken?: string | null;

  // 🔐 refresh token
  @Column({ type: 'text', nullable: true, select: false })
  refreshToken?: string;

  // ---------------- VEHICLES ----------------
  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.owner)
  vehicles!: VehicleEntity[];

  // ---------------- SERVICES CREATED BY USER ----------------
  @OneToMany(() => ServiceEntity, (service) => service.customer)
  customerServices!: ServiceEntity[];


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
