import { Test, TestingModule } from '@nestjs/testing';
import { JobProcessor } from './jobs.processor';
import { JobsService } from './jobs.service';
import { Job } from 'bull';
import { JobStatus } from '@prisma/client';

const mockJobsService = {
    updateJobStatus: jest.fn(),
    incrementAttempts: jest.fn(),
    getJobStatus: jest.fn(),
};

describe('JobProcessor', () => {
    let processor: JobProcessor;
    let jobsService: typeof mockJobsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobProcessor,
                {
                    provide: JobsService,
                    useValue: mockJobsService,
                },
            ],
        }).compile();

        processor = module.get<JobProcessor>(JobProcessor);
        jobsService = module.get(JobsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    describe('handleJob', () => {
        it('should process CODE_EXECUTION job successfully', async () => {
            const job = {
                data: {
                    jobId: 'job-1',
                    type: 'CODE_EXECUTION',
                    payload: { code: 'print("hello")' },
                    userId: 'user-1',
                },
            } as Job;

            await processor.handleJob(job);

            expect(jobsService.updateJobStatus).toHaveBeenCalledWith('job-1', JobStatus.PROCESSING);
            expect(jobsService.incrementAttempts).toHaveBeenCalledWith('job-1');
            expect(jobsService.updateJobStatus).toHaveBeenCalledWith(
                'job-1',
                JobStatus.COMPLETED,
                expect.any(String),
            );
        });

        it('should handle failure and retry', async () => {
            const job = {
                data: {
                    jobId: 'job-1',
                    type: 'UNKNOWN_TYPE', // This triggers generic processing which doesn't fail, but let's mock delay or something if possible.
                    // Wait, default switch case is generic processing which succeeds.
                    // To test failure, I should make simulate failing or mock a private method?
                    // I can't mock private methods easily.
                    // I'll rely on the logic that `updateJobStatus` failing (e.g. database error) would trigger catch block.
                    userId: 'user-1',
                },
            } as unknown as Job;

            // Let's force an error in updateJobStatus (first call)
            mockJobsService.updateJobStatus.mockRejectedValueOnce(new Error('DB Error'));
            mockJobsService.getJobStatus.mockResolvedValue({ attempts: 1, maxAttempts: 3 });

            await expect(processor.handleJob(job)).rejects.toThrow('DB Error');

            // Should check if it will be retried (not failed permanently)
            // The catch block logs warn and throws error.
            // It DOES check getJobStatus.
            expect(jobsService.getJobStatus).toHaveBeenCalled();
            // It should NOT call updateJobStatus with FAILED if attempts < maxAttempts
            expect(jobsService.updateJobStatus).not.toHaveBeenCalledWith(
                'job-1',
                JobStatus.FAILED,
                expect.anything(),
                expect.anything()
            );
        });

        it('should handle permanent failure', async () => {
            const job = {
                data: {
                    jobId: 'job-1',
                    type: 'CODE_EXECUTION',
                    payload: {},
                    userId: 'user-1',
                },
            } as Job;

            mockJobsService.updateJobStatus.mockRejectedValueOnce(new Error('DB Error'));
            mockJobsService.getJobStatus.mockResolvedValue({ attempts: 3, maxAttempts: 3 });

            await expect(processor.handleJob(job)).rejects.toThrow('DB Error');

            expect(jobsService.updateJobStatus).toHaveBeenCalledWith(
                'job-1',
                JobStatus.FAILED,
                undefined,
                'DB Error'
            );
        });
    });
});
