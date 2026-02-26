-- Add target_employee_id column to chat_threads for per-employee conversations
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS target_employee_id INTEGER;

-- Drop the old unique constraint (only client_id)
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_client_id_unique;

-- Add new unique constraint on (client_id, target_employee_id)
ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_client_employee_unique UNIQUE (client_id, target_employee_id);
