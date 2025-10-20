import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const icps = pgTable('icps', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  personas: jsonb('personas'),
  companySizeRange: varchar('company_size_range', { length: 100 }),
  revenueRange: varchar('revenue_range', { length: 100 }),
  industries: jsonb('industries'),
  regions: jsonb('regions'),
  fundingStages: jsonb('funding_stages'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const icpsRelations = relations(icps, ({ one }) => ({
  company: one(companies, {
    fields: [icps.companyId],
    references: [companies.id],
  }),
}));
