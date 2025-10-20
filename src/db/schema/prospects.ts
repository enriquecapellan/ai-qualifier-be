import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { qualificationStatus } from './enums';

export const prospects = pgTable('prospects', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  domain: varchar('domain', { length: 255 }).notNull(),
  enrichedData: jsonb('enriched_data'),
  qualificationScore: numeric('qualification_score', {
    precision: 5,
    scale: 2,
  }),
  explanation: text('explanation'),
  status: qualificationStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const prospectsRelations = relations(prospects, ({ one }) => ({
  company: one(companies, {
    fields: [prospects.companyId],
    references: [companies.id],
  }),
}));
