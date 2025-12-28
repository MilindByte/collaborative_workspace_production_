import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  workspaceId: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AddProjectMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
