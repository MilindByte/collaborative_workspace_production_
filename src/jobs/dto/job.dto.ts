import { IsString, IsOptional } from 'class-validator';

export class CreateJobDto {
  @IsString()
  type: string;

  @IsString()
  payload: string; // JSON stringified payload

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
