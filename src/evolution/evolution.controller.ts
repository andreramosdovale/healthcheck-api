import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@Controller('evolution')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Get('summary')
  @Permissions('measurements:read')
  getSummary(
    @Request() req: { user: { id: string } },
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.evolutionService.getSummary(req.user.id, limit);
  }

  @Get('compare')
  @Permissions('measurements:read')
  compare(
    @Request() req: { user: { id: string } },
    @Query('from', ParseUUIDPipe) fromId: string,
    @Query('to', ParseUUIDPipe) toId: string,
  ) {
    return this.evolutionService.compare(req.user.id, fromId, toId);
  }

  @Get('latest')
  @Permissions('measurements:read')
  getLatest(@Request() req: { user: { id: string } }) {
    return this.evolutionService.getLatest(req.user.id);
  }
}
