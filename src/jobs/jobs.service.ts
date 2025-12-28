import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/job.dto';
import { JobStatus, Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('jobs') private jobQueue: Queue,
    private prisma: PrismaService,
  ) {} // Prisma client has been regenerated to include idempotencyKey

  async createJob(userId: string, dto: CreateJobDto) {
    // Check for idempotency
    if (dto.idempotencyKey) {
      const existingJob = await this.prisma.job.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (existingJob) {
        return existingJob;
      }
    }

    // Create job record in database
    const job = await this.prisma.job.create({
      data: {
        type: dto.type,
        payload: dto.payload,
        userId,
        status: JobStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    // Push to queue
    await this.jobQueue.add(
      'process-job',
      {
        jobId: job.id,
        type: dto.type,
        payload: JSON.parse(dto.payload),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return job;
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        userId,
      },
    });

    return job;
  }

  async getUserJobs(userId: string) {
    return this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: string,
    error?: string,
  ) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        result,
        error,
        completedAt:
          status === JobStatus.COMPLETED || status === JobStatus.FAILED
            ? new Date()
            : null,
      },
    });
  }

  async incrementAttempts(jobId: string) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }
}
