import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectMemberDto,
} from './dto/project.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    // Verify user is a member of the workspace
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: dto.workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: dto.workspaceId,
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        workspace: true,
      },
    });

    return project;
  }

  async findAll(userId: string, workspaceId?: string) {
    const where: any = {
      members: {
        some: {
          userId,
        },
      },
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        workspace: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = project.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return { ...project, userRole: member.role };
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.checkPermission(id, userId, Role.OWNER);

    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.checkPermission(id, userId, Role.OWNER);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async addMember(
    projectId: string,
    requesterId: string,
    dto: AddProjectMemberDto,
  ) {
    await this.checkPermission(projectId, requesterId, Role.OWNER);

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: dto.userId,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.projectMember.create({
      data: {
        userId: dto.userId,
        projectId,
        role: dto.role || Role.VIEWER,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async removeMember(projectId: string, requesterId: string, memberId: string) {
    await this.checkPermission(projectId, requesterId, Role.OWNER);

    return this.prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId,
        },
      },
    });
  }

  private async checkPermission(
    projectId: string,
    userId: string,
    requiredRole: Role,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (member.role !== requiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
