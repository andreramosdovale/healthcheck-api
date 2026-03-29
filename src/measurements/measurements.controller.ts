import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { ListMeasurementsDto } from './dto/list-measurements.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import type {
  CreateMeasurementInput,
  UpdateMeasurementInput,
} from './types/measurements.types';

@ApiTags('measurements')
@ApiBearerAuth()
@Controller('measurements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post()
  @Permissions('measurements:create')
  @ApiOperation({ summary: 'Create a new measurement' })
  @ApiResponse({ status: 201, description: 'Measurement created successfully' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateMeasurementDto,
  ) {
    const input: CreateMeasurementInput = {
      measurementDate: dto.measurementDate,
      weight: dto.weight,
      triceps: dto.triceps,
      subscapular: dto.subscapular,
      chest: dto.chest,
      midaxillary: dto.midaxillary,
      suprailiac: dto.suprailiac,
      abdominal: dto.abdominal,
      thigh: dto.thigh,
      neck: dto.neck,
      waist: dto.waist,
      hip: dto.hip,
      shoulders: dto.shoulders,
      chestCirc: dto.chestCirc,
      leftThigh: dto.leftThigh,
      rightThigh: dto.rightThigh,
      leftCalf: dto.leftCalf,
      rightCalf: dto.rightCalf,
      leftBicepRelaxed: dto.leftBicepRelaxed,
      rightBicepRelaxed: dto.rightBicepRelaxed,
      leftBicepFlexed: dto.leftBicepFlexed,
      rightBicepFlexed: dto.rightBicepFlexed,
    };
    return this.measurementsService.create(req.user.id, input);
  }

  @Get()
  @Permissions('measurements:read')
  @ApiOperation({ summary: 'List all measurements for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns all measurements' })
  findAll(
    @Request() req: { user: { id: string } },
    @Query() query: ListMeasurementsDto,
  ) {
    return this.measurementsService.findAllByUser(req.user.id, {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      from: query.from,
      to: query.to,
    });
  }

  @Get(':id')
  @Permissions('measurements:read')
  @ApiOperation({ summary: 'Get a measurement by ID' })
  @ApiResponse({ status: 200, description: 'Returns the measurement' })
  @ApiResponse({ status: 404, description: 'Measurement not found' })
  findOne(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Permissions('measurements:update')
  @ApiOperation({ summary: 'Update a measurement' })
  @ApiResponse({ status: 200, description: 'Measurement updated successfully' })
  update(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeasurementDto,
  ) {
    const input: UpdateMeasurementInput = {
      measurementDate: dto.measurementDate,
      weight: dto.weight,
      triceps: dto.triceps,
      subscapular: dto.subscapular,
      chest: dto.chest,
      midaxillary: dto.midaxillary,
      suprailiac: dto.suprailiac,
      abdominal: dto.abdominal,
      thigh: dto.thigh,
      neck: dto.neck,
      waist: dto.waist,
      hip: dto.hip,
      shoulders: dto.shoulders,
      chestCirc: dto.chestCirc,
      leftThigh: dto.leftThigh,
      rightThigh: dto.rightThigh,
      leftCalf: dto.leftCalf,
      rightCalf: dto.rightCalf,
      leftBicepRelaxed: dto.leftBicepRelaxed,
      rightBicepRelaxed: dto.rightBicepRelaxed,
      leftBicepFlexed: dto.leftBicepFlexed,
      rightBicepFlexed: dto.rightBicepFlexed,
    };
    return this.measurementsService.update(id, req.user.id, input);
  }

  @Delete(':id')
  @Permissions('measurements:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a measurement' })
  @ApiResponse({ status: 204, description: 'Measurement deleted successfully' })
  remove(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.remove(id, req.user.id);
  }
}
