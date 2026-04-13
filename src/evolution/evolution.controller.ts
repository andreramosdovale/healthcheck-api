import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
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
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2025-01-01',
    description: 'ISO date filter (ignored when `weeks` is present)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2025-12-31',
    description: 'ISO date filter (ignored when `weeks` is present)',
  })
  @ApiQuery({
    name: 'weeks',
    required: false,
    type: Number,
    example: 12,
    description: 'Relative window ending today (1–104). Cannot be combined with `from` or `to`.',
  })
  @ApiResponse({ status: 200, description: 'Returns evolution summary' })
  @ApiResponse({ status: 400, description: 'Cannot combine `weeks` with `from`/`to`' })
  getSummary(
    @Request() req: { user: { id: string } },
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('weeks') weeksRaw?: string,
  ) {
    let weeks: number | undefined;

    if (weeksRaw !== undefined) {
      weeks = parseInt(weeksRaw, 10);
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104) {
        throw new BadRequestException('`weeks` must be an integer between 1 and 104.');
      }
    }

    return this.evolutionService.getSummary(req.user.id, { limit, from, to, weeks });
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

  @Get('delta/:measurementId')
  @Permissions('measurements:read')
  @ApiOperation({
    summary: 'Get per-field direction indicators vs the previous measurement',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns delta directions per field',
  })
  @ApiResponse({ status: 404, description: 'Measurement not found' })
  getDelta(
    @Request() req: { user: { id: string } },
    @Param('measurementId', ParseUUIDPipe) measurementId: string,
  ) {
    return this.evolutionService.getDelta(req.user.id, measurementId);
  }
}
