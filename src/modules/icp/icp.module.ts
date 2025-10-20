import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OpenAIService } from '../../services/openai.service';
import { WebScraperService } from '../../services/web-scraper.service';
import { ICPService } from './icp.service';
import { ICPController } from './icp.controller';

@Module({
  imports: [AuthModule],
  providers: [ICPService, OpenAIService, WebScraperService],
  controllers: [ICPController],
  exports: [ICPService],
})
export class ICPModule {}
