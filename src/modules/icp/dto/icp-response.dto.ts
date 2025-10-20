export class ICPResponseDto {
  id: string;
  companyId: string;
  title: string | null;
  description: string | null;
  personas: any;
  companySizeRange: string | null;
  revenueRange: string | null;
  industries: any;
  regions: any;
  fundingStages: any;
  createdAt: Date;
  updatedAt: Date;
}
