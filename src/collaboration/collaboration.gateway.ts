import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SocketWithAuth } from '../common/interfaces/socket-with-auth.interface';

interface UserJoinPayload {
  workspaceId: string;
  projectId: string;
  userName: string;
}

interface FileChangePayload {
  workspaceId: string;
  projectId: string;
  fileName: string;
  changeType: 'create' | 'update' | 'delete';
  content?: string;
}

interface CursorUpdatePayload {
  workspaceId: string;
  projectId: string;
  position: { line: number; column: number };
  fileName: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('CollaborationGateway');
  private connectedUsers = new Map<
    string,
    { userId: string; userName: string }
  >();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: SocketWithAuth) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const headers = client.handshake.headers as { authorization?: string };

      const token =
        auth.token ||
        (headers.authorization
          ? headers.authorization.split(' ')[1]
          : undefined);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id} (${payload.email})`);
    } catch (error) {
      this.logger.error('Authentication failed', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithAuth) {
    const userInfo = this.connectedUsers.get(client.id);

    if (userInfo) {
      this.logger.log(
        `Client disconnected: ${client.id} (${userInfo.userName})`,
      );
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('user:join')
  handleUserJoin(
    @MessageBody() data: UserJoinPayload,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `${data.workspaceId}:${data.projectId}`;
    client.join(room);

    this.connectedUsers.set(client.id, {
      userId: client.data.userId,
      userName: data.userName,
    });

    this.server.to(room).emit('user:joined', {
      userId: client.data.userId,
      userName: data.userName,
      email: client.data.email,
      timestamp: new Date(),
    });

    this.logger.log(`User ${data.userName} joined room: ${room}`);

    return { success: true, room };
  }

  @SubscribeMessage('user:leave')
  handleUserLeave(
    @MessageBody() data: { workspaceId: string; projectId: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `${data.workspaceId}:${data.projectId}`;
    const userInfo = this.connectedUsers.get(client.id);

    client.leave(room);

    if (userInfo) {
      this.server.to(room).emit('user:left', {
        userId: client.data.userId,
        userName: userInfo.userName,
        timestamp: new Date(),
      });
    }

    this.logger.log(`User left room: ${room}`);

    return { success: true };
  }

  @SubscribeMessage('file:change')
  handleFileChange(
    @MessageBody() data: FileChangePayload,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `${data.workspaceId}:${data.projectId}`;
    const userInfo = this.connectedUsers.get(client.id);

    this.server
      .to(room)
      .except(client.id)
      .emit('file:changed', {
        ...data,
        userId: client.data.userId,
        userName: userInfo?.userName,
        timestamp: new Date(),
      });

    this.logger.log(
      `File change in room ${room}: ${data.fileName} (${data.changeType})`,
    );

    return { success: true };
  }

  @SubscribeMessage('cursor:update')
  handleCursorUpdate(
    @MessageBody() data: CursorUpdatePayload,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `${data.workspaceId}:${data.projectId}`;
    const userInfo = this.connectedUsers.get(client.id);

    this.server
      .to(room)
      .except(client.id)
      .emit('cursor:updated', {
        ...data,
        userId: client.data.userId,
        userName: userInfo?.userName,
        timestamp: new Date(),
      });

    return { success: true };
  }

  @SubscribeMessage('activity:update')
  handleActivityUpdate(
    @MessageBody()
    data: { workspaceId: string; projectId: string; activity: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `${data.workspaceId}:${data.projectId}`;
    const userInfo = this.connectedUsers.get(client.id);

    this.server.to(room).except(client.id).emit('activity:updated', {
      activity: data.activity,
      userId: client.data.userId,
      userName: userInfo?.userName,
      timestamp: new Date(),
    });

    return { success: true };
  }
}
