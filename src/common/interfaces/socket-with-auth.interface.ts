import { Socket } from 'socket.io';

export interface SocketWithAuth extends Socket {
  data: {
    userId: string;
    email: string;
    [key: string]: any;
  };
}
