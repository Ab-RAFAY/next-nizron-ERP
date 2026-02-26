import { pgTable, serial, text, integer, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { clients } from './clients';

export const chat_threads = pgTable(
  'chat_threads',
  {
    id: serial('id').primaryKey(),
    client_id: integer('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    target_employee_id: integer('target_employee_id'),
    last_message: text('last_message'),
    last_message_sender: text('last_message_sender'),
    last_message_at: timestamp('last_message_at').defaultNow(),
    is_read_by_admin: boolean('is_read_by_admin').default(true),
    is_read_by_client: boolean('is_read_by_client').default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => [unique('chat_threads_client_employee_unique').on(table.client_id, table.target_employee_id)],
);

export const chat_messages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  thread_id: integer('thread_id')
    .notNull()
    .references(() => chat_threads.id, { onDelete: 'cascade' }),
  sender_type: text('sender_type').notNull(),
  sender_id: integer('sender_id').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
