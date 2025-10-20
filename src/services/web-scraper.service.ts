import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WebScraperService {
  async scrapeCompanyInfo(domain: string) {
    try {
      // Try to get the main page
      const response = await axios.get(`https://${domain}`, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);

      // Extract common elements
      const title = $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      const ogDescription =
        $('meta[property="og:description"]').attr('content') || '';
      const h1 = $('h1').first().text() || '';

      // Try to find about section
      const aboutSection =
        $(
          'section:contains("About"), div:contains("About"), p:contains("About")',
        )
          .first()
          .text() || '';

      // Get first few paragraphs of main content
      const mainContent = $('main p, .content p, .description p')
        .slice(0, 3)
        .map((i, el) => $(el).text())
        .get()
        .join(' ');

      return {
        title: title.trim(),
        description: description.trim() || ogDescription.trim(),
        h1: h1.trim(),
        aboutSection: aboutSection.trim(),
        mainContent: mainContent.trim(),
        rawHtml: (response.data as string)?.substring(0, 5000), // First 5KB for AI analysis
      };
    } catch (error) {
      console.error(`Failed to scrape ${domain}:`, (error as Error)?.message);
      return null;
    }
  }
}
