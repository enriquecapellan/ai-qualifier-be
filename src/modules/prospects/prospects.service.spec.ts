import { Test } from '@nestjs/testing';
import { ProspectsService } from './prospects.service';
import { OpenAIService } from '../../services/openai.service';
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
    and: jest.fn(() => ({})),
  };
});

describe('ProspectsService', () => {
  let service: ProspectsService;
  const mockOpenAI = {
    analyzeProspectQualification: jest.fn().mockResolvedValue({
      qualificationScore: 82.5,
      explanation: 'Solid fit',
      status: 'qualified',
      enrichedData: { industry: 'SaaS', keyFeatures: ['Cloud', 'API'] },
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ProspectsService,
        { provide: OpenAIService, useValue: mockOpenAI },
      ],
    }).compile();

    service = module.get(ProspectsService);

    // Company exists
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => [{ id: 'co-1', summary: 'We sell anvils' }],
        }),
      }),
    });

    // ICP exists
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => [{ id: 'icp-1', title: 'ICP', description: 'desc' }],
        }),
      }),
    });
  });

  it('qualifies new domains and de-duplicates existing prospects', async () => {
    // First domain already exists
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => [
            {
              id: 'p-1',
              companyId: 'co-1',
              domain: 'exists.com',
              qualificationScore: '70',
              status: 'qualified',
            },
          ],
        }),
      }),
    });
    // Second domain doesn't exist (returns [])
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    // Insert returning
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: () => ({
        returning: () => [
          {
            id: 'p-2',
            companyId: 'co-1',
            domain: 'new.com',
            qualificationScore: '82.5',
            status: 'qualified',
          },
        ],
      }),
    });

    const result = await service.qualifyDomains('co-1', {
      domains: 'exists.com, new.com',
    });

    expect(result.prospects.length).toBe(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.qualified).toBeGreaterThan(0);
    expect(mockOpenAI.analyzeProspectQualification).toHaveBeenCalledWith(
      'new.com',
      'We sell anvils',
      expect.any(Object),
    );
  });
});
