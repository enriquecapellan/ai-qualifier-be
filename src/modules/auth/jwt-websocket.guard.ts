import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWebSocketAuthGuard
  extends AuthGuard('jwt-websocket')
  implements CanActivate
{
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Check if the socket has auth token
    const token = (client.handshake.auth?.token ||
      client.handshake.query?.token) as string | undefined;

    if (!token) {
      return false;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  getRequest(context: ExecutionContext) {
    const client: Socket = context.switchToWs().getClient();
    return client;
  }
}
