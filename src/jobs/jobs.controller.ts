import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new background job' })
  create(@Req() req, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs for current user' })
  findAll(@Req() req) {
    return this.jobsService.getUserJobs(req.user.userId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get job status by ID' })
  getStatus(@Param('id') id: string, @Req() req) {
    return this.jobsService.getJobStatus(id, req.user.userId);
  }
}
