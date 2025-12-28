import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RESOURCE_ROLES_KEY } from '../decorators/resource-roles.decorator';
import type { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class ResourceRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      RESOURCE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.userId;
    const workspaceId =
      request.params.id ||
      request.body.workspaceId ||
      request.query.workspaceId;
    const projectId = request.params.projectId || request.params.id; // Heuristic for project context

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check Workspace Role
    if (workspaceId) {
      const member = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId, workspaceId },
        },
      });

      if (member && requiredRoles.includes(member.role)) {
        return true;
      }
    }

    // Check Project Role (if applicable)
    if (projectId) {
      const projectMember = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId, projectId: projectId },
        },
      });

      if (projectMember && requiredRoles.includes(projectMember.role)) {
        return true;
      }
    }

    throw new ForbiddenException('Insufficient permissions for this resource');
  }
}
