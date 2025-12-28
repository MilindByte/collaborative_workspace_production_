import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationGateway } from './collaboration.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketWithAuth } from '../common/interfaces/socket-with-auth.interface';

const mockJwtService = {
    verifyAsync: jest.fn(),
};

const mockConfigService = {
    get: jest.fn(),
};

describe('CollaborationGateway', () => {
    let gateway: CollaborationGateway;
    let jwtService: typeof mockJwtService;
    let configService: typeof mockConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CollaborationGateway,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        gateway = module.get<CollaborationGateway>(CollaborationGateway);
        jwtService = module.get(JwtService);
        configService = module.get(ConfigService);

        // Mock server
        gateway.server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            except: jest.fn().mockReturnThis(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should authenticate client', async () => {
            const client = {
                handshake: {
                    auth: { token: 'token' },
                    headers: {},
                },
                data: {},
                disconnect: jest.fn(),
                id: 'client-1',
            } as unknown as SocketWithAuth;

            mockConfigService.get.mockReturnValue('secret');
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'test@example.com' });

            await gateway.handleConnection(client);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'secret' });
            expect(client.data.userId).toBe('user-1');
            expect(client.data.email).toBe('test@example.com');
        });

        it('should disconnect if no token', async () => {
            const client = {
                handshake: {
                    auth: {},
                    headers: {},
                },
                disconnect: jest.fn(),
            } as unknown as SocketWithAuth;

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect if verification fails', async () => {
            const client = {
                handshake: {
                    auth: { token: 'invalid-token' },
                    headers: {},
                },
                disconnect: jest.fn(),
            } as unknown as SocketWithAuth;

            mockConfigService.get.mockReturnValue('secret');
            mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleUserJoin', () => {
        it('should join room and emit event', () => {
            const client = {
                id: 'client-1',
                data: { userId: 'user-1', email: 'test@example.com' },
                join: jest.fn(),
            } as unknown as SocketWithAuth;

            const payload = { workspaceId: 'ws-1', projectId: 'prj-1', userName: 'User 1' };

            gateway.handleUserJoin(payload, client);

            expect(client.join).toHaveBeenCalledWith('ws-1:prj-1');
            expect(gateway.server.to).toHaveBeenCalledWith('ws-1:prj-1');
            expect(gateway.server.emit).toHaveBeenCalledWith('user:joined', expect.objectContaining({
                userId: 'user-1',
                userName: 'User 1',
            }));
        });
    });
});
