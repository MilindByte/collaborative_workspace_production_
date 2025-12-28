import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { JobsService } from './jobs.service';
import { JobStatus } from '@prisma/client';

interface JobData {
  jobId: string;
  type: string;
  payload: any;
  userId: string;
}

@Processor('jobs')
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(private jobsService: JobsService) {}

  @Process('process-job')
  async handleJob(job: Job<JobData>) {
    const { jobId, type, payload, userId } = job.data;

    this.logger.log(`Processing job ${jobId} of type ${type}`);

    try {
      // Update job status to PROCESSING
      await this.jobsService.updateJobStatus(jobId, JobStatus.PROCESSING);
      await this.jobsService.incrementAttempts(jobId);

      // Simulate job processing based on type
      let result: any;

      switch (type) {
        case 'CODE_EXECUTION':
          result = await this.simulateCodeExecution(payload);
          break;
        case 'DATA_PROCESSING':
          result = await this.simulateDataProcessing(payload);
          break;
        case 'FILE_GENERATION':
          result = await this.simulateFileGeneration(payload);
          break;
        default:
          result = await this.simulateGenericProcessing(payload);
      }

      // Update job status to COMPLETED
      await this.jobsService.updateJobStatus(
        jobId,
        JobStatus.COMPLETED,
        JSON.stringify(result),
      );

      this.logger.log(`Job ${jobId} completed successfully`);

      return result;
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      // Get current job to check attempts
      const currentJob = await this.jobsService.getJobStatus(jobId, userId);

      if (currentJob && currentJob.attempts >= currentJob.maxAttempts) {
        // Max attempts reached, mark as failed
        await this.jobsService.updateJobStatus(
          jobId,
          JobStatus.FAILED,
          undefined,
          error.message,
        );
        this.logger.error(
          `Job ${jobId} failed permanently after ${currentJob.attempts} attempts`,
        );
      } else {
        // Will retry
        this.logger.warn(
          `Job ${jobId} will be retried. Attempt ${currentJob?.attempts || 0}`,
        );
      }

      throw error; // Re-throw to let Bull handle retry
    }
  }

  private async simulateCodeExecution(payload: any): Promise<any> {
    // Simulate code execution delay
    await this.delay(3000);

    return {
      success: true,
      output: 'Code executed successfully',
      executionTime: '3.2s',
      result: payload.code
        ? `Executed: ${payload.code.substring(0, 50)}...`
        : 'No code provided',
    };
  }

  private async simulateDataProcessing(payload: any): Promise<any> {
    // Simulate data processing delay
    await this.delay(2000);

    return {
      success: true,
      recordsProcessed: payload.records || 100,
      duration: '2.1s',
      summary: 'Data processing completed',
    };
  }

  private async simulateFileGeneration(payload: any): Promise<any> {
    // Simulate file generation delay
    await this.delay(4000);

    return {
      success: true,
      fileName: payload.fileName || 'generated-file.txt',
      size: '1.2 MB',
      location: '/files/generated-file.txt',
    };
  }

  private async simulateGenericProcessing(payload: any): Promise<any> {
    // Simulate generic processing
    await this.delay(1500);

    return {
      success: true,
      message: 'Job processed successfully',
      data: payload,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
