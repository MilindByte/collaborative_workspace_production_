import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PrismaService } from '../prisma/prisma.service';

const mockProjectsService = {
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
};\r

describe('ProjectsController', () => {
    let controller: ProjectsController;
    let service: typeof mockProjectsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProjectsController],
            providers: [
                {
                    provide: ProjectsService,
                    useValue: mockProjectsService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        controller = module.get<ProjectsController>(ProjectsController);
        service = module.get(ProjectsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    const mockReq = { user: { userId: 'user-1' } } as unknown as RequestWithUser;

    describe('create', () => {
        it('should create project', async () => {
            const dto = { name: 'Prj', workspaceId: 'ws-1' };
            mockProjectsService.create.mockResolvedValue({});

            await controller.create(mockReq, dto as CreateProjectDto);

            expect(service.create).toHaveBeenCalledWith('user-1', dto);
        });
    });

    describe('findAll', () => {
        it('should find all with query', async () => {
            mockProjectsService.findAll.mockResolvedValue([]);
            await controller.findAll(mockReq, 'ws-1');
            expect(service.findAll).toHaveBeenCalledWith('user-1', 'ws-1');
        });
    });

    describe('findOne', () => {
        it('should find one', async () => {
            mockProjectsService.findOne.mockResolvedValue({});
            await controller.findOne('1', mockReq);
            expect(service.findOne).toHaveBeenCalledWith('1', 'user-1');
        });
    });

    describe('update', () => {
        it('should update', async () => {
            const dto = { name: 'New' };
            mockProjectsService.update.mockResolvedValue({});
            await controller.update('1', mockReq, dto as UpdateProjectDto);
            expect(service.update).toHaveBeenCalledWith('1', 'user-1', dto);
        });
    });

    describe('remove', () => {
        it('should remove', async () => {
            mockProjectsService.remove.mockResolvedValue({});
            await controller.remove('1', mockReq);
            expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
        });
    });
});

