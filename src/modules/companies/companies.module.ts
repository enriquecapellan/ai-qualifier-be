import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AuthModule } from '../auth/auth.module';
import { OpenAIService } from '../../services/openai.service';
import { WebScraperService } from '../../services/web-scraper.service';
import { ICPService } from '../icp/icp.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AuthModule, WebSocketModule],
  providers: [CompaniesService, OpenAIService, WebScraperService, ICPService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
