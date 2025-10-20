import { ProspectResponseDto } from './prospect-response.dto';

export class QualificationResultDto {
  prospects: ProspectResponseDto[];
  summary: {
    total: number;
    qualified: number;
    rejected: number;
    pending: number;
    averageScore: number;
  };
}
