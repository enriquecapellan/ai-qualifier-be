export class ProspectResponseDto {
  id: string;
  companyId: string;
  domain: string;
  enrichedData: any;
  qualificationScore: string | null;
  explanation: string | null;
  status: 'pending' | 'qualified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
