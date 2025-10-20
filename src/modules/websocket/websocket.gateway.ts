import {
  WebSocketGateway as SocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtWebSocketAuthGuard } from '../auth/jwt-websocket.guard';

export interface ProgressUpdate {
  userId: string;
  companyId?: string;
  step: string;
  message: string;
  progress: number;
  completed: boolean;
  error?: string;
}

type SocketWithUser = Socket & {
  user: {
    id: string;
  };
};

@SocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-user-room')
  @UseGuards(JwtWebSocketAuthGuard)
  async handleJoinRoom(@ConnectedSocket() client: Socket) {
    // Get user from the authenticated socket
    const user = (client as SocketWithUser).user;
    if (!user) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    await client.join(`user-${user.id}`);
    client.emit('joined-room', { userId: user.id });
  }

  @SubscribeMessage('leave-user-room')
  @UseGuards(JwtWebSocketAuthGuard)
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const user = (client as SocketWithUser).user;
    if (user) {
      await client.leave(`user-${user.id}`);
    }
  }

  broadcastProgress(userId: string, update: ProgressUpdate) {
    this.server.to(`user-${userId}`).emit('progress-update', update);
  }
}
