import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should return true if no roles required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as any;
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw if user has no role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ user: {} }),
            }),
        } as any;
        expect(() => guard.canActivate(context)).toThrow('User role not found');
    });

    it('should throw if user has insufficient permissions', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ user: { role: Role.VIEWER } }),
            }),
        } as any;
        expect(() => guard.canActivate(context)).toThrow('Insufficient permissions');
    });

    it('should return true if user has permission', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ user: { role: Role.OWNER } }),
            }),
        } as any;
        expect(guard.canActivate(context)).toBe(true);
    });
});
