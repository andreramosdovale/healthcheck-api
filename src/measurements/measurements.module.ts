import { Module } from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsRepository } from './measurements.repository';

@Module({
  controllers: [MeasurementsController],
  providers: [MeasurementsService, MeasurementsRepository],
})
export class MeasurementsModule {}
