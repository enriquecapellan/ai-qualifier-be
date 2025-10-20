import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { companies, icps, prospects } from 'src/db/schema';
import { db } from 'src/db';
import { OpenAIService } from 'src/services/openai.service';
import { QualifyDomainsDto } from './dto/qualify-domains.dto';
import { QualificationResultDto } from './dto/qualification-result.dto';
import { ProspectResponseDto } from './dto/prospect-response.dto';

@Injectable()
export class ProspectsService {
  constructor(private openaiService: OpenAIService) {}

  async qualifyDomains(
    companyId: string,
    qualifyDomainsDto: QualifyDomainsDto,
  ): Promise<QualificationResultDto> {
    // Check if company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Get the ICP for this company
    const [icp] = await db
      .select()
      .from(icps)
      .where(eq(icps.companyId, companyId))
      .limit(1);

    if (!icp) {
      throw new NotFoundException(
        'ICP not found for this company. Please generate an ICP first.',
      );
    }

    // Parse domains from comma-separated string
    const domains = qualifyDomainsDto.domains
      .split(',')
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0);

    if (domains.length === 0) {
      throw new BadRequestException('No valid domains provided');
    }

    // Process each domain
    const prospectResults: ProspectResponseDto[] = [];
    let totalScore = 0;
    let qualifiedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    for (const domain of domains) {
      try {
        // Check if prospect already exists
        const [existingProspect] = await db
          .select()
          .from(prospects)
          .where(
            and(
              eq(prospects.domain, domain),
              eq(prospects.companyId, companyId),
            ),
          )
          .limit(1);

        if (existingProspect) {
          // Return existing prospect data
          prospectResults.push(existingProspect);

          // Update counters
          totalScore += Number(existingProspect.qualificationScore || '0');
          if (existingProspect.status === 'qualified') qualifiedCount++;
          else if (existingProspect.status === 'rejected') rejectedCount++;
          else pendingCount++;

          continue;
        }

        // Analyze prospect qualification
        const analysis = await this.openaiService.analyzeProspectQualification(
          domain,
          company.summary || '',
          icp,
        );

        // Create prospect record
        const [newProspect] = await db
          .insert(prospects)
          .values({
            companyId,
            domain,
            enrichedData: analysis.enrichedData,
            qualificationScore: analysis.qualificationScore.toString(),
            explanation: analysis.explanation,
            status: analysis.status,
          })
          .returning();

        // Add to results
        prospectResults.push(newProspect);

        // Update counters
        totalScore += analysis.qualificationScore;
        if (analysis.status === 'qualified') qualifiedCount++;
        else if (analysis.status === 'rejected') rejectedCount++;
        else pendingCount++;
      } catch (error) {
        console.error(`Failed to analyze domain ${domain}:`, error);

        // Create prospect record with error status
        const [errorProspect] = await db
          .insert(prospects)
          .values({
            companyId,
            domain,
            enrichedData: null,
            qualificationScore: null,
            explanation: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'pending',
          })
          .returning();

        prospectResults.push(errorProspect);

        pendingCount++;
      }
    }

    // Calculate summary
    const averageScore =
      prospectResults.length > 0
        ? totalScore /
          prospectResults.filter((p) => p.qualificationScore !== null).length
        : 0;

    return {
      prospects: prospectResults,
      summary: {
        total: prospectResults.length,
        qualified: qualifiedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        averageScore: Math.round(averageScore * 100) / 100,
      },
    };
  }

  async getProspectsByCompany(
    companyId: string,
  ): Promise<ProspectResponseDto[]> {
    const companyProspects = await db
      .select()
      .from(prospects)
      .where(eq(prospects.companyId, companyId));

    return companyProspects;
  }
}
