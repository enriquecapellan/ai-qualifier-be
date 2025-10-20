import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { db } from '../../db';

jest.mock('../../db', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
}));

jest.mock('drizzle-orm', () => {
  const actual =
    jest.requireActual<typeof import('drizzle-orm')>('drizzle-orm');
  return {
    ...actual,
    eq: jest.fn(() => ({})),
  };
});

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));
describe('AuthService', () => {
  let service: AuthService;

  const jwtMock = {
    sign: jest.fn().mockReturnValue('token'),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: JwtService, useValue: jwtMock }],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signup creates user and returns tokens', async () => {
    // existing user check -> empty
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });
    // insert new user -> returning
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: () => ({
        returning: () => [{ id: 'u1', email: 'a@b.com', role: 'user' }],
      }),
    });

    const res = await service.signup({ email: 'a@b.com', password: 'pass' });
    expect(res.user.id).toBe('u1');
    expect(jwtMock.sign).toHaveBeenCalled();
  });

  it('login returns tokens when password matches', async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => [
            {
              id: 'u1',
              email: 'a@b.com',
              role: 'user',
              passwordHash: 'hashed',
            },
          ],
        }),
      }),
    });

    const res = await service.login({ email: 'a@b.com', password: 'pass' });
    expect(res.user.email).toBe('a@b.com');
    expect(jwtMock.sign).toHaveBeenCalled();
  });
});
