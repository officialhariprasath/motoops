import { IsIn } from 'class-validator';

export class UpdateLeaveStatusDto {
  @IsIn(['pending', 'approved', 'rejected'])
  status!: 'pending' | 'approved' | 'rejected';
}
