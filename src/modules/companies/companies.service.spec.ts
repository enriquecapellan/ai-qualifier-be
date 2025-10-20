import { Test } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { ICPService } from '../icp/icp.service';
import { OpenAIService } from '../../services/openai.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { db } from '../../db';

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

jest.mock('../../db', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
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

describe('CompaniesService', () => {
  let service: CompaniesService;
  const mockOpenAI = {
    extractCompanyInfo: jest
      .fn()
      .mockResolvedValue({ name: 'Acme', summary: 'We sell anvils' }),
  };
  const mockICP = {
    generateICP: jest.fn().mockResolvedValue({ id: 'icp-1' }),
  };
  const mockWS = {
    broadcastProgress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: OpenAIService, useValue: mockOpenAI },
        { provide: ICPService, useValue: mockICP },
        { provide: WebSocketGateway, useValue: mockWS },
      ],
    }).compile();

    service = module.get(CompaniesService);
  });

  it('creates a company and generates ICP, emitting progress events', async () => {
    // No existing company
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    // Insert company → returning row
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: () => ({
        returning: () => [
          {
            id: 'co-1',
            ownerId: 'u-1',
            domain: 'acme.com',
            name: 'Acme',
            summary: 'We sell anvils',
          },
        ],
      }),
    });

    const result = await service.create({ domain: 'acme.com' }, 'u-1');

    expect(result.id).toBe('co-1');
    expect(mockOpenAI.extractCompanyInfo).toHaveBeenCalled();
    expect((mockOpenAI.extractCompanyInfo.mock.calls[0] as string[])[0]).toBe(
      'acme.com',
    );
    expect(mockICP.generateICP).toHaveBeenCalledWith('co-1', {
      title: 'Acme',
      description: 'We sell anvils',
    });
    expect(mockWS.broadcastProgress).toHaveBeenCalled(); // multiple calls across steps
  });

  it('handles ICP generation failure but still completes company creation', async () => {
    // No existing company
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    // Insert company → returning row
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: () => ({
        returning: () => [
          {
            id: 'co-2',
            ownerId: 'u-2',
            domain: 'bad.com',
            name: 'Bad',
            summary: 'Oops',
          },
        ],
      }),
    });

    mockICP.generateICP.mockRejectedValueOnce(new Error('OpenAI down'));

    const result = await service.create({ domain: 'bad.com' }, 'u-2');

    expect(result.id).toBe('co-2');
    expect(mockICP.generateICP).toHaveBeenCalled();
    // Should have broadcasted an error and final complete
    const messages = mockWS.broadcastProgress.mock.calls.map(
      (c: { step: { error: any; complete: boolean } }[]) => c[1].step,
    );
    expect(messages).toContain('error');
    expect(messages).toContain('complete');
  });

  it('throws conflict if company exists', async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => [{}] }) }),
    });
    await expect(
      service.create({ domain: 'exists.com' }, 'u-1'),
    ).rejects.toThrow('Company with this domain already exists');
  });
});
