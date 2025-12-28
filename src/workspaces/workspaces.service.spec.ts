import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    workspace: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace and add owner', async () => {
      const dto = { name: 'Test Workspace', description: 'Test Desc' };
      const userId = 'user-1';
      mockPrismaService.workspace.create.mockResolvedValue({
        id: 'ws-1',
        ...dto,
      });

      const result = await service.create(userId, dto);
      expect(result.id).toBe('ws-1');
      expect(mockPrismaService.workspace.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);
      await expect(service.findOne('ws-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user not a member', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        members: [{ userId: 'user-2' }],
      });
      await expect(service.findOne('ws-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return workspace if user is member', async () => {
      const workspace = {
        id: 'ws-1',
        members: [{ userId: 'user-1', role: Role.OWNER }],
      };
      mockPrismaService.workspace.findUnique.mockResolvedValue(workspace);
      const result = await service.findOne('ws-1', 'user-1');
      expect(result.id).toBe('ws-1');
    });
  });
});
