import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const RESOURCE_ROLES_KEY = 'resource_roles';
export const ResourceRoles = (...roles: Role[]) =>
  SetMetadata(RESOURCE_ROLES_KEY, roles);
