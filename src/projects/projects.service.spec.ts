import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project and add owner', async () => {
      const dto = { name: 'Test Project', workspaceId: 'ws-1' };
      const userId = 'user-1';

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: Role.OWNER,
      });
      mockPrismaService.project.create.mockResolvedValue({ id: 'p-1', ...dto });

      const result = await service.create(userId, dto);
      expect(result.id).toBe('p-1');
    });

    it('should throw ForbiddenException if user not member of workspace', async () => {
      const dto = { name: 'Test Project', workspaceId: 'ws-1' };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
