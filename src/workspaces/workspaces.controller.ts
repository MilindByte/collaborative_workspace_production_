import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
} from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceRolesGuard } from '../common/guards/resource-roles.guard';
import { ResourceRoles } from '../common/decorators/resource-roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ResourceRolesGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  create(@Req() req: RequestWithUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.userId, dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({ summary: 'Get all workspaces for current user' })
  findAll(@Req() req: RequestWithUser) {
    return this.workspacesService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.workspacesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ResourceRoles(Role.OWNER)
  @ApiOperation({ summary: 'Update workspace (Owner only)' })
  update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace (Owner only)' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.workspacesService.remove(id, req.user.userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace (Owner only)' })
  addMember(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspacesService.addMember(id, req.user.userId, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from workspace (Owner only)' })
  removeMember(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(id, req.user.userId, memberId);
  }
}
