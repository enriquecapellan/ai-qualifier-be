import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ICPService } from './icp.service';
import { OpenAIService } from '../../services/openai.service';
import { db } from '../../db';
import { AuthService } from '../auth/auth.service';

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
    and: jest.fn(() => ({})),
  };
});

const jwtMock = { sign: jest.fn(), verify: jest.fn(), decode: jest.fn() };
const authMock = {
  validateUser: jest.fn(),
  login: jest.fn(),
  signup: jest.fn(),
};

describe('ICPService', () => {
  let service: ICPService;
  const mockOpenAI = {
    generateICP: jest.fn().mockResolvedValue({
      title: 'Enterprise SaaS',
      description: 'B2B ICP',
      personas: [],
      companySizeRange: '50-500',
      revenueRange: '$1M-$10M',
      industries: ['SaaS'],
      regions: ['NA'],
      fundingStages: ['Series A'],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ICPService,
        { provide: OpenAIService, useValue: mockOpenAI },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuthService, useValue: authMock }, // add this line
      ],
    }).compile();

    service = module.get(ICPService);

    // Company exists
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => [
            { id: 'co-1', name: 'Acme', summary: 'We sell anvils' },
          ],
        }),
      }),
    });

    // No existing ICP for company
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    // Insert icp
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: () => ({
        returning: () => [
          {
            id: 'icp-1',
            companyId: 'co-1',
            title: 'Enterprise SaaS',
            description: 'B2B ICP',
          },
        ],
      }),
    });
  });

  it('generates ICP when none exists', async () => {
    const result = await service.generateICP('co-1', {
      title: undefined,
      description: undefined,
    });
    expect(result.id).toBe('icp-1');
    expect(mockOpenAI.generateICP).toHaveBeenCalledWith(
      'We sell anvils',
      'Acme',
    );
  });
});
