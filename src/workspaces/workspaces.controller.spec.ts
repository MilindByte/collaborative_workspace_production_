import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PrismaService } from '../prisma/prisma.service';

const mockWorkspacesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
};

const mockPrismaService = {
    workspaceMember: { findUnique: jest.fn() },
    projectMember: { findUnique: jest.fn() },
};

describe('WorkspacesController', () => {
    let controller: WorkspacesController;
    let service: typeof mockWorkspacesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkspacesController],
            providers: [
                {
                    provide: WorkspacesService,
                    useValue: mockWorkspacesService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        controller = module.get<WorkspacesController>(WorkspacesController);
        service = module.get(WorkspacesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    const mockReq = { user: { userId: 'user-1' } } as unknown as RequestWithUser;

    describe('create', () => {
        it('should create workspace', async () => {
            const dto = { name: 'WS' };
            mockWorkspacesService.create.mockResolvedValue({});

            await controller.create(mockReq, dto as CreateWorkspaceDto);

            expect(service.create).toHaveBeenCalledWith('user-1', dto);
        });
    });

    describe('findAll', () => {
        it('should find all', async () => {
            mockWorkspacesService.findAll.mockResolvedValue([]);
            await controller.findAll(mockReq);
            expect(service.findAll).toHaveBeenCalledWith('user-1');
        });
    });

    describe('findOne', () => {
        it('should find one', async () => {
            mockWorkspacesService.findOne.mockResolvedValue({});
            await controller.findOne('1', mockReq);
            expect(service.findOne).toHaveBeenCalledWith('1', 'user-1');
        });
    });

    describe('update', () => {
        it('should update', async () => {
            const dto = { name: 'New' };
            mockWorkspacesService.update.mockResolvedValue({});
            await controller.update('1', mockReq, dto as UpdateWorkspaceDto);
            expect(service.update).toHaveBeenCalledWith('1', 'user-1', dto);
        });
    });

    describe('remove', () => {
        it('should remove', async () => {
            mockWorkspacesService.remove.mockResolvedValue({});
            await controller.remove('1', mockReq);
            expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
        });
    });
});
