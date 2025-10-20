import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface SocketRequest {
  handshake: {
    auth?: { token?: string };
    query?: { token?: string };
  };
}

@Injectable()
export class JwtWebSocketStrategy extends PassportStrategy(
  Strategy,
  'jwt-websocket',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: SocketRequest) => {
          // Extract JWT from socket handshake auth
          if (
            request &&
            request.handshake &&
            request.handshake.auth &&
            request.handshake.auth.token
          ) {
            return request.handshake.auth.token;
          }
          // Also try to extract from query parameters
          if (
            request &&
            request.handshake &&
            request.handshake.query &&
            request.handshake.query.token
          ) {
            return request.handshake.query.token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
