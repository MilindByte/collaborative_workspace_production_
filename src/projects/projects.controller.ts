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
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectMemberDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceRolesGuard } from '../common/guards/resource-roles.guard';
import { ResourceRoles } from '../common/decorators/resource-roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ResourceRolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@Req() req: RequestWithUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({ summary: 'Get all projects for current user' })
  @ApiQuery({ name: 'workspaceId', required: false })
  findAll(
    @Req() req: RequestWithUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.projectsService.findAll(req.user.userId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ResourceRoles(Role.OWNER, Role.COLLABORATOR)
  @ApiOperation({ summary: 'Update project (Owner or Collaborator only)' })
  update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (Owner only)' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.projectsService.remove(id, req.user.userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project (Owner only)' })
  addMember(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(id, req.user.userId, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from project (Owner only)' })
  removeMember(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Param('memberId') memberId: string,
  ) {
    return this.projectsService.removeMember(id, req.user.userId, memberId);
  }
}
