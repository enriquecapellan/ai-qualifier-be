import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'user']);
export const qualificationStatus = pgEnum('qualification_status', [
  'pending',
  'qualified',
  'rejected',
]);
