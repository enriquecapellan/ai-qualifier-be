export class CompanyResponseDto {
  id: string;
  name: string | null;
  ownerId: string;
  domain: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}
