-- Add chat_threads table
CREATE TABLE IF NOT EXISTS "chat_threads" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" integer NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "last_message" text,
  "last_message_sender" text,
  "last_message_at" timestamp DEFAULT now() NOT NULL,
  "is_read_by_admin" boolean DEFAULT true NOT NULL,
  "is_read_by_client" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_threads_client_id_unique" ON "chat_threads" ("client_id");

-- Add chat_messages table
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "thread_id" integer NOT NULL REFERENCES "chat_threads"("id") ON DELETE CASCADE,
  "sender_type" text NOT NULL,
  "sender_id" integer NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_chat_messages_thread" ON "chat_messages" ("thread_id");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_created_at" ON "chat_messages" ("created_at");
