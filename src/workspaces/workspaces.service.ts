import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
} from './dto/workspace.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
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
      },
    });

    return workspace;
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
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
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
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
        projects: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return { ...workspace, userRole: member.role };
  }

  async update(id: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.checkPermission(id, userId, Role.OWNER);

    return this.prisma.workspace.update({
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

    return this.prisma.workspace.delete({
      where: { id },
    });
  }

  async addMember(workspaceId: string, requesterId: string, dto: AddMemberDto) {
    await this.checkPermission(workspaceId, requesterId, Role.OWNER);

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: dto.userId,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.workspaceMember.create({
      data: {
        userId: dto.userId,
        workspaceId,
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

  async removeMember(
    workspaceId: string,
    requesterId: string,
    memberId: string,
  ) {
    await this.checkPermission(workspaceId, requesterId, Role.OWNER);

    return this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });
  }

  private async checkPermission(
    workspaceId: string,
    userId: string,
    requiredRole: Role,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (member.role !== requiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
