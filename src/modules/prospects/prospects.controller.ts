import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { QualifyDomainsDto } from './dto/qualify-domains.dto';
import { QualificationResultDto } from './dto/qualification-result.dto';
import { ProspectResponseDto } from './dto/prospect-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('prospects')
@UseGuards(JwtAuthGuard)
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Post('qualify/:companyId')
  async qualifyDomains(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() qualifyDomainsDto: QualifyDomainsDto,
  ): Promise<QualificationResultDto> {
    return this.prospectsService.qualifyDomains(companyId, qualifyDomainsDto);
  }

  @Get(':companyId')
  async getProspectsByCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
  ): Promise<ProspectResponseDto[]> {
    return this.prospectsService.getProspectsByCompany(companyId);
  }
}
