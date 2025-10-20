import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @User('id') userId: string,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.create(createCompanyDto, userId);
  }

  @Get('me')
  async findUserCompany(
    @User('id', new ParseUUIDPipe()) userId: string,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.findByOwnerId(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.findById(id);
  }
}
