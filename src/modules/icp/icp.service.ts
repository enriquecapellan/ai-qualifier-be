import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { icps, companies } from '../../db/schema';
import { db } from 'src/db';
import { OpenAIService } from '../../services/openai.service';
import { GenerateICPDto } from './dto/generate-icp.dto';
import { ICPResponseDto } from './dto/icp-response.dto';

@Injectable()
export class ICPService {
  constructor(private openaiService: OpenAIService) {}

  async generateICP(
    companyId: string,
    generateICPDto: GenerateICPDto,
  ): Promise<ICPResponseDto> {
    // Check if company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if ICP already exists for this company
    const [existingICP] = await db
      .select()
      .from(icps)
      .where(eq(icps.companyId, companyId))
      .limit(1);

    if (existingICP) {
      throw new ConflictException('ICP already exists for this company');
    }

    // Generate ICP using OpenAI
    const icpData = await this.openaiService.generateICP(
      company.summary || '',
      company.name || undefined,
    );

    // Create ICP record
    const [newICP] = await db
      .insert(icps)
      .values({
        companyId,
        title: generateICPDto.title || icpData.title,
        description: generateICPDto.description || icpData.description,
        personas: icpData.personas,
        companySizeRange: icpData.companySizeRange,
        revenueRange: icpData.revenueRange,
        industries: icpData.industries,
        regions: icpData.regions,
        fundingStages: icpData.fundingStages,
      })
      .returning();

    return newICP;
  }

  async findById(id: string): Promise<ICPResponseDto> {
    const [icp] = await db.select().from(icps).where(eq(icps.id, id)).limit(1);

    if (!icp) {
      throw new NotFoundException('ICP not found');
    }

    return icp;
  }

  async findByCompanyId(companyId: string): Promise<ICPResponseDto> {
    const [icp] = await db
      .select()
      .from(icps)
      .where(eq(icps.companyId, companyId))
      .limit(1);

    if (!icp) {
      throw new NotFoundException('ICP not found');
    }

    return icp;
  }
}
