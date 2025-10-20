import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { WebScraperService } from './web-scraper.service';
import { ICP } from 'src/db/types';
import { WebSocketGateway } from 'src/modules/websocket/websocket.gateway';

@Injectable()
export class OpenAIService {
  private client: OpenAI;

  constructor(private webScraperService: WebScraperService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    this.client = new OpenAI({ apiKey });
  }

  async extractCompanyInfo(
    domain: string,
    ownerId: string,
    webSocketGateway?: WebSocketGateway,
  ) {
    // First, try to scrape the website
    const scrapedData = await this.webScraperService.scrapeCompanyInfo(domain);

    if (webSocketGateway) {
      webSocketGateway.broadcastProgress(ownerId, {
        userId: ownerId,
        step: 'analyzing',
        message: 'Analyzing company information...',
        progress: 50,
        completed: false,
      });
    }

    const prompt = `Given the domain "${domain}" and the following scraped website data, extract and return a JSON object with:
    - name: The company name (extract from title, h1, or infer from domain)
    - summary: A comprehensive description of what this company does based on the scraped content

    Scraped data:
    ${
      scrapedData
        ? `
    Title: ${scrapedData.title}
    Description: ${scrapedData.description}
    H1: ${scrapedData.h1}
    About Section: ${scrapedData.aboutSection}
    Main Content: ${scrapedData.mainContent}
    `
        : 'No website data available - domain may not be accessible'
    }

    If you cannot determine the company information from the scraped data, try to infer from the domain name and common knowledge.

    Return only valid JSON in this format:
    {
      "name": "Company Name or null",
      "summary": "Comprehensive description of the company's business, products, and services or null"
    }`;

    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    try {
      return this.extractJsonFromOpenaiResponse<{
        name: string | null;
        summary: string | null;
      }>(res);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return { name: null, summary: null };
    }
  }

  async generateICP(companySummary: string, companyName?: string) {
    const prompt = `Generate a comprehensive Ideal Customer Profile (ICP) JSON for a company with this information:
    
    Company: ${companyName || 'Unknown'}
    Description: ${companySummary}
    
    Return a JSON object with the following structure:
    {
      "title": "ICP Title (e.g., 'Enterprise SaaS Companies')",
      "description": "Detailed description of the ideal customer profile",
      "personas": [
        {
          "role": "Decision Maker Role",
          "title": "Job Title",
          "responsibilities": ["Responsibility 1", "Responsibility 2"],
          "painPoints": ["Pain Point 1", "Pain Point 2"],
          "goals": ["Goal 1", "Goal 2"]
        }
      ],
      "companySizeRange": "Size range (e.g., '50-500 employees', 'Enterprise 1000+')",
      "revenueRange": "Revenue range (e.g., '$1M-$10M ARR', '$10M+ ARR')",
      "industries": ["Industry 1", "Industry 2", "Industry 3"],
      "regions": ["North America", "Europe", "Asia-Pacific"],
      "fundingStages": ["Series A", "Series B", "Growth Stage"]
    }
    
    Make the ICP structured, detailed, actionable, and based on the company's likely target market. Make sure to generate 3-5 personas.`;

    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    try {
      return this.extractJsonFromOpenaiResponse<{
        title: string;
        description: string;
        personas: any[];
        companySizeRange: string;
        revenueRange: string;
        industries: string[];
        regions: string[];
        fundingStages: string[];
      }>(res);
    } catch (error) {
      console.error('Failed to parse ICP response:', error);
      throw new Error('Invalid ICP response format');
    }
  }

  async analyzeProspectQualification(
    prospectDomain: string,
    companySummary: string,
    icp: ICP,
  ) {
    // First, try to scrape the prospect's website
    const scrapedData =
      await this.webScraperService.scrapeCompanyInfo(prospectDomain);

    const prompt = `Analyze the qualification of a prospect company against an Ideal Customer Profile (ICP).

    PROSPECT COMPANY:
    Domain: ${prospectDomain}
    ${
      scrapedData
        ? `
    Website Title: ${scrapedData.title}
    Description: ${scrapedData.description}
    Main Content: ${scrapedData.mainContent}
    `
        : 'No website data available'
    }

    TARGET COMPANY (for context):
    Description: ${companySummary}

    IDEAL CUSTOMER PROFILE (ICP):
    Title: ${icp.title}
    Description: ${icp.description}
    Company Size Range: ${icp.companySizeRange}
    Revenue Range: ${icp.revenueRange}
    Industries: ${JSON.stringify(icp.industries)}
    Regions: ${JSON.stringify(icp.regions)}
    Funding Stages: ${JSON.stringify(icp.fundingStages)}
    Personas: ${JSON.stringify(icp.personas)}

    Analyze the prospect company and return a JSON object with:
    {
      "qualificationScore": 85.5,
      "explanation": "Detailed explanation of why this prospect fits or doesn't fit the ICP",
      "status": "qualified",
      "enrichedData": {
        "companyName": "Extracted company name",
        "industry": "Detected industry",
        "companySize": "Estimated company size",
        "revenue": "Estimated revenue range",
        "location": "Company location",
        "businessModel": "Type of business model",
        "keyFeatures": ["Feature 1", "Feature 2"],
        "painPoints": ["Pain point 1", "Pain point 2"]
      }
    }

    Scoring criteria:
    - 90-100: Perfect match, highly qualified
    - 70-89: Good match, qualified
    - 50-69: Moderate match, needs review
    - 30-49: Poor match, likely rejected
    - 0-29: No match, rejected

    Status should be:
    - "qualified" for scores 70+
    - "rejected" for scores below 50
    - "pending" for scores 50-69

    Be thorough in your analysis and provide specific reasons for the score.`;

    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    try {
      return this.extractJsonFromOpenaiResponse<{
        qualificationScore: number;
        explanation: string;
        status: 'qualified' | 'rejected' | 'pending';
        enrichedData: {
          companyName: string;
          industry: string;
          companySize: string;
          revenue: string;
          location: string;
          businessModel: string;
          keyFeatures: string[];
          painPoints: string[];
        };
      }>(res);
    } catch (error) {
      console.error('Failed to parse qualification response:', error);
      throw new Error('Invalid qualification response format');
    }
  }

  private extractJsonFromOpenaiResponse<T>(
    openaiResponse: OpenAI.Chat.Completions.ChatCompletion,
  ): T {
    const content = openaiResponse.choices[0].message?.content;
    if (!content) {
      throw new Error('Failed to extract JSON from OpenAI response');
    }

    const jsonString = content
      .replace(/```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    return JSON.parse(jsonString) as T;
  }
}
