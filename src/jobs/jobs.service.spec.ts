import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { JobStatus } from '@prisma/client';

const mockQueue = {
    add: jest.fn(),
};

const mockPrismaService = {
    job: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    },
};

describe('JobsService', () => {
    let service: JobsService;
    let prisma: typeof mockPrismaService;
    let queue: typeof mockQueue;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: getQueueToken('jobs'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<JobsService>(JobsService);
        prisma = module.get(PrismaService);
        queue = module.get(getQueueToken('jobs'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createJob', () => {
        it('should create a job and add it to the queue', async () => {
            const userId = 'user-1';
            const dto = {
                type: 'CODE_EXECUTION',
                payload: '{"code":"print(\'hello\')"}',
                idempotencyKey: 'key-1',
            };

            const createdJob = {
                id: 'job-1',
                ...dto,
                userId,
                status: JobStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.job.findUnique.mockResolvedValue(null);
            mockPrismaService.job.create.mockResolvedValue(createdJob);
            mockQueue.add.mockResolvedValue({ id: 'job-1' });

            const result = await service.createJob(userId, dto);

            expect(prisma.job.findUnique).toHaveBeenCalledWith({
                where: { idempotencyKey: dto.idempotencyKey },
            });
            expect(prisma.job.create).toHaveBeenCalled();
            expect(queue.add).toHaveBeenCalledWith(
                'process-job',
                expect.objectContaining({
                    jobId: 'job-1',
                    type: dto.type,
                }),
                expect.any(Object),
            );
            expect(result).toEqual(createdJob);
        });

        it('should return existing job if idempotency key exists', async () => {
            const userId = 'user-1';
            const dto = {
                type: 'CODE_EXECUTION',
                payload: '{}',
                idempotencyKey: 'key-1',
            };

            const existingJob = {
                id: 'job-1',
                ...dto,
                userId,
                status: JobStatus.PENDING,
            };

            mockPrismaService.job.findUnique.mockResolvedValue(existingJob);

            const result = await service.createJob(userId, dto);

            expect(prisma.job.findUnique).toHaveBeenCalled();
            expect(prisma.job.create).not.toHaveBeenCalled();
            expect(queue.add).not.toHaveBeenCalled();
            expect(result).toEqual(existingJob);
        });
    });

    describe('getJobStatus', () => {
        it('should return job status', async () => {
            const jobId = 'job-1';
            const userId = 'user-1';
            const job = { id: jobId, userId, status: JobStatus.COMPLETED };

            mockPrismaService.job.findFirst.mockResolvedValue(job);

            const result = await service.getJobStatus(jobId, userId);

            expect(prisma.job.findFirst).toHaveBeenCalledWith({
                where: { id: jobId, userId },
            });
            expect(result).toEqual(job);
        });
    });

    describe('getUserJobs', () => {
        it('should return all user jobs', async () => {
            const userId = 'user-1';
            const jobs = [{ id: 'job-1' }, { id: 'job-2' }];

            mockPrismaService.job.findMany.mockResolvedValue(jobs);

            const result = await service.getUserJobs(userId);

            expect(prisma.job.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            expect(result).toEqual(jobs);
        });
    });

    describe('updateJobStatus', () => {
        it('should update job status', async () => {
            const jobId = 'job-1';
            const status = JobStatus.COMPLETED;
            const resultData = '{"success":true}';

            mockPrismaService.job.update.mockResolvedValue({ id: jobId, status, result: resultData });

            const result = await service.updateJobStatus(jobId, status, resultData);

            expect(prisma.job.update).toHaveBeenCalledWith({
                where: { id: jobId },
                data: expect.objectContaining({
                    status,
                    result: resultData,
                    completedAt: expect.any(Date),
                }),
            });
            expect(result).toEqual({ id: jobId, status, result: resultData });
        });
    });

    describe('incrementAttempts', () => {
        it('should increment job attempts', async () => {
            const jobId = 'job-1';

            mockPrismaService.job.update.mockResolvedValue({ id: jobId, attempts: 1 });

            await service.incrementAttempts(jobId);

            expect(prisma.job.update).toHaveBeenCalledWith({
                where: { id: jobId },
                data: {
                    attempts: { increment: 1 },
                },
            });
        });
    });
});
