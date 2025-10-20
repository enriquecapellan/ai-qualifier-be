import { IsString, IsNotEmpty } from 'class-validator';

export class QualifyDomainsDto {
  @IsString()
  @IsNotEmpty()
  domains: string; // Comma-separated list of domains
}
