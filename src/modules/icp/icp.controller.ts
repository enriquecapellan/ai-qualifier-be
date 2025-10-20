import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ICPService } from './icp.service';
import { GenerateICPDto } from './dto/generate-icp.dto';
import { ICPResponseDto } from './dto/icp-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('icps')
@UseGuards(JwtAuthGuard)
export class ICPController {
  constructor(private readonly icpService: ICPService) {}

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ICPResponseDto> {
    return this.icpService.findById(id);
  }

  @Post('generate/:companyId')
  async generateICP(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() generateICPDto: GenerateICPDto,
  ): Promise<ICPResponseDto> {
    return this.icpService.generateICP(companyId, generateICPDto);
  }

  @Get('company/:companyId')
  async findByCompanyId(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
  ): Promise<ICPResponseDto> {
    return this.icpService.findByCompanyId(companyId);
  }
}
