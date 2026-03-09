import { Module } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';
import { EvolutionRepository } from './evolution.repository';

@Module({
  controllers: [EvolutionController],
  providers: [EvolutionService, EvolutionRepository],
})
export class EvolutionModule {}
