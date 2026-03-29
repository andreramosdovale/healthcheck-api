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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EvolutionService } from './evolution.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('evolution')
@ApiBearerAuth()
@Controller('evolution')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Get('summary')
  @Permissions('measurements:read')
  @ApiOperation({ summary: 'Get evolution summary for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 30 })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Returns evolution summary' })
  getSummary(
    @Request() req: { user: { id: string } },
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.evolutionService.getSummary(req.user.id, { limit, from, to });
  }

  @Get('compare')
  @Permissions('measurements:read')
  @ApiOperation({ summary: 'Compare two measurements' })
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    description: 'First measurement UUID',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    description: 'Second measurement UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns comparison between two measurements',
  })
  compare(
    @Request() req: { user: { id: string } },
    @Query('from', ParseUUIDPipe) fromId: string,
    @Query('to', ParseUUIDPipe) toId: string,
  ) {
    return this.evolutionService.compare(req.user.id, fromId, toId);
  }

  @Get('latest')
  @Permissions('measurements:read')
  @ApiOperation({
    summary: 'Get the latest measurement for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Returns the latest measurement' })
  getLatest(@Request() req: { user: { id: string } }) {
    return this.evolutionService.getLatest(req.user.id);
  }
}
