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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type {
  CreateUserInput,
  UpdateUserInput,
  SanitizedUser,
} from './types/users.types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('admin:manage')
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email or nickname already in use' })
  create(@Body() dto: CreateUserDto) {
    const input: CreateUserInput = {
      email: dto.email,
      nickname: dto.nickname,
      password: dto.password,
      name: dto.name,
      birthDate: dto.birthDate,
      sex: dto.sex,
      height: dto.height,
      termsAccepted: dto.termsAccepted,
    };
    return this.usersService.create(input);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('admin:manage')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated users' })
  findAll(@Query() query: ListUsersDto) {
    return this.usersService.findAll({
      limit: query.limit,
      offset: query.offset,
      search: query.search,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, description: 'Returns the authenticated user' })
  getMe(@CurrentUser() user: SanitizedUser) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (name and/or height)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateMe(@CurrentUser() user: SanitizedUser, @Body() dto: UpdateUserDto) {
    const input: UpdateUserInput = { name: dto.name, height: dto.height };
    return this.usersService.update(user.id, input);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update user (admin)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    const input: UpdateUserInput = { name: dto.name, height: dto.height };
    return this.usersService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (irreversible)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
