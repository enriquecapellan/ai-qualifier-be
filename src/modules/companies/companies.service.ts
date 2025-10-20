import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { companies } from '../../db/schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { db } from 'src/db';
import { OpenAIService } from '../../services/openai.service';
import { ICPService } from '../icp/icp.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class CompaniesService {
  constructor(
    private openaiService: OpenAIService,
    private icpService: ICPService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    ownerId: string,
  ): Promise<CompanyResponseDto> {
    const { domain } = createCompanyDto;

    this.webSocketGateway.broadcastProgress(ownerId, {
      userId: ownerId,
      step: 'validating',
      message: 'Validating domain...',
      progress: 10,
      completed: false,
    });

    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.domain, domain))
      .limit(1);

    if (existingCompany.length > 0) {
      throw new ConflictException('Company with this domain already exists');
    }

    this.webSocketGateway.broadcastProgress(ownerId, {
      userId: ownerId,
      step: 'scraping',
      message: 'Scraping website...',
      progress: 20,
      completed: false,
    });

    // Extract company info using OpenAI and web scraping
    const companyInfo = await this.openaiService.extractCompanyInfo(
      domain,
      ownerId,
      this.webSocketGateway,
    );

    this.webSocketGateway.broadcastProgress(ownerId, {
      userId: ownerId,
      step: 'creating',
      message: 'Creating company record...',
      progress: 70,
      completed: false,
    });

    // Create new company
    const [newCompany] = await db
      .insert(companies)
      .values({
        ownerId,
        domain: domain,
        name: companyInfo.name,
        summary: companyInfo.summary,
      })
      .returning();

    this.webSocketGateway.broadcastProgress(ownerId, {
      userId: ownerId,
      companyId: newCompany.id,
      step: 'generating-icp',
      message: 'Generating Ideal Customer Profile...',
      progress: 80,
      completed: false,
    });

    let newICP: { id: string } | undefined;
    try {
      newICP = await this.icpService.generateICP(newCompany.id, {
        title: companyInfo.name || undefined,
        description: companyInfo.summary || undefined,
      });
    } catch (error) {
      console.error('Error generating ICP:', error);
      this.webSocketGateway.broadcastProgress(ownerId, {
        userId: ownerId,
        companyId: newCompany.id,
        step: 'error',
        message: 'Failed to generate ICP',
        progress: 90,
        completed: false,
        error: (error as Error).message,
      });
    }

    this.webSocketGateway.broadcastProgress(ownerId, {
      userId: ownerId,
      companyId: newCompany.id,
      step: 'complete',
      message: newICP
        ? 'Company and ICP created successfully!'
        : 'Company created. ICP generation failed.',
      progress: 100,
      completed: true,
    });

    return newCompany;
  }

  async findById(id: string): Promise<CompanyResponseDto> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async findByOwnerId(ownerId: string): Promise<CompanyResponseDto> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, ownerId))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }
}
