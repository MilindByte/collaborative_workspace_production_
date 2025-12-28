import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateWorkspaceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
