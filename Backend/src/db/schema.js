import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // As per requirements: stored in plain text
  role: text('role').notNull().default('user'), // 'user' or 'admin'
  otp: text('otp'),
  otp_expiry: timestamp('otp_expiry'),
  is_verified: boolean('is_verified').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  complaint_text: text('complaint_text').notNull(),
  ai_question: text('ai_question'),
  user_answer: text('user_answer'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});
