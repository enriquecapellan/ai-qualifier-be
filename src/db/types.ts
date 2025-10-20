import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, companies, icps, prospects } from './schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

export type ICP = InferSelectModel<typeof icps>;
export type NewICP = InferInsertModel<typeof icps>;

export type Prospect = InferSelectModel<typeof prospects>;
export type NewProspect = InferInsertModel<typeof prospects>;
