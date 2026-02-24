-- Create client_complaints table
CREATE TABLE IF NOT EXISTS client_complaints (
	id SERIAL PRIMARY KEY NOT NULL,
	client_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	category TEXT DEFAULT 'general',
	status TEXT DEFAULT 'open',
	priority TEXT DEFAULT 'medium',
	assigned_to TEXT,
	resolution TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS client_complaints_client_id_idx ON client_complaints(client_id);
CREATE INDEX IF NOT EXISTS client_complaints_status_idx ON client_complaints(status);
