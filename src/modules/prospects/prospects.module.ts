import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ICPModule } from '../icp/icp.module';
import { OpenAIService } from '../../services/openai.service';
import { WebScraperService } from '../../services/web-scraper.service';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';

@Module({
  imports: [AuthModule, ICPModule],
  providers: [ProspectsService, OpenAIService, WebScraperService],
  controllers: [ProspectsController],
})
export class QualificationModule {}
