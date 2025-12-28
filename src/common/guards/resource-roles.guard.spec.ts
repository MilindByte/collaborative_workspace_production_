import { ResourceRolesGuard } from './resource-roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

const mockPrismaService = {
    workspaceMember: { findUnique: jest.fn() },
    projectMember: { findUnique: jest.fn() },
};

describe('ResourceRolesGuard', () => {
    let guard: ResourceRolesGuard;
    let reflector: Reflector;
    let prisma: typeof mockPrismaService;

    beforeEach(() => {
        reflector = new Reflector();
        prisma = mockPrismaService;
        guard = new ResourceRolesGuard(reflector, prisma as any);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should return true if no roles required', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as any;
        expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw if user not authenticated', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ params: {}, body: {}, query: {} }),
            }),
        } as any;
        await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should check workspace role', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { userId: '1' },
                    params: { id: 'ws-1' },
                    body: {}, query: {}
                }),
            }),
        } as any;

        prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.OWNER });

        expect(await guard.canActivate(context)).toBe(true);
    });

    it('should check project role', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { userId: '1' },
                    params: { projectId: 'prj-1' },
                    body: {}, query: {}
                }),
            }),
        } as any;

        prisma.projectMember.findUnique.mockResolvedValue({ role: Role.OWNER });

        expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw if insufficient permissions', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { userId: '1' },
                    params: { id: 'ws-1' },
                    body: {}, query: {}
                }),
            }),
        } as any;

        prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.VIEWER });
        prisma.projectMember.findUnique.mockResolvedValue(null);

        await expect(guard.canActivate(context)).rejects.toThrow('Insufficient permissions');
    });
});
