import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

import { ServiceTasksController } from './controller/service-tasks.controller';
import { ServiceSubTasksController } from './controller/service-subtasks.controller';
import { ServiceTaskCommentsController } from './controller/service-task-comments.controller';
import { TaskPartsController } from './controller/task-parts.controller';

import { ServiceTasksService } from './services/service-tasks.service';
import { ServiceSubTasksService } from './services/service-subtasks.service';
import { ServiceTaskCommentsService } from './services/service-task-comments.service';
import { TaskPartsService } from './services/task-parts.service';

import { ServiceEntity } from './entities/service.entity';
import { ServiceTaskEntity } from './entities/service-task.entity';
import { ServiceSubTaskEntity } from './entities/service-subtask.entity';
import { ServiceTaskCommentEntity } from './entities/service-task-comment.entity';
import { TaskPartEntity } from './entities/task-part.entity';

import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InvoiceEntity } from '../invoices/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceEntity,
      ServiceTaskEntity,
      ServiceSubTaskEntity,
      ServiceTaskCommentEntity,
      TaskPartEntity,
      VehicleEntity,
      UserEntity,
      InvoiceEntity,
    ]),
  ],
  controllers: [
    ServicesController,
    ServiceTasksController,
    ServiceSubTasksController,
    ServiceTaskCommentsController,
    TaskPartsController,
  ],
  providers: [
    ServicesService,
    ServiceTasksService,
    ServiceSubTasksService,
    ServiceTaskCommentsService,
    TaskPartsService,
  ],
})
export class ServicesModule {}
