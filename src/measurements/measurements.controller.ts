import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@Controller('measurements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post()
  @Permissions('measurements:create')
  create(
    @Request() req: { user: { id: string } },
    @Body() createMeasurementDto: CreateMeasurementDto,
  ) {
    return this.measurementsService.create(req.user.id, createMeasurementDto);
  }

  @Get()
  @Permissions('measurements:read')
  findAll(@Request() req: { user: { id: string } }) {
    return this.measurementsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @Permissions('measurements:read')
  findOne(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.findOne(id, req.user.id);
  }

  @Put(':id')
  @Permissions('measurements:update')
  update(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMeasurementDto: UpdateMeasurementDto,
  ) {
    return this.measurementsService.update(
      id,
      req.user.id,
      updateMeasurementDto,
    );
  }

  @Delete(':id')
  @Permissions('measurements:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.remove(id, req.user.id);
  }
}
