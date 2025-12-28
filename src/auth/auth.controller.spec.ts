import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
};

describe('AuthController', () => {
    let controller: AuthController;
    let service: typeof mockAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const dto: RegisterDto = {
                email: 'test@example.com',
                password: 'password',
                name: 'Test user',
            };

            mockAuthService.register.mockResolvedValue({ user: { id: '1' }, accessToken: 'at' });

            const result = await controller.register(dto);

            expect(service.register).toHaveBeenCalledWith(dto);
            expect(result).toEqual({ user: { id: '1' }, accessToken: 'at' });
        });
    });

    describe('login', () => {
        it('should login user', async () => {
            const dto: LoginDto = {
                email: 'test@example.com',
                password: 'password',
            };
            mockAuthService.login.mockResolvedValue({ user: { id: '1' }, accessToken: 'at' });

            const result = await controller.login(dto);

            expect(service.login).toHaveBeenCalledWith(dto);
            expect(result).toEqual({ user: { id: '1' }, accessToken: 'at' });
        });
    });

    describe('refresh', () => {
        it('should refresh tokens', async () => {
            const req = { user: { sub: '1', refreshToken: 'rt' } } as any;
            mockAuthService.refreshTokens.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

            const result = await controller.refresh(req);

            expect(service.refreshTokens).toHaveBeenCalledWith('1', 'rt');
            expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
        });
    });

    describe('logout', () => {
        it('should logout user', async () => {
            const req = { user: { sub: '1' } } as any;

            await controller.logout(req);

            expect(service.logout).toHaveBeenCalledWith('1');
        });
    });
});
