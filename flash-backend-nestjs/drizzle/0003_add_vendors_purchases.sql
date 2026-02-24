-- Add vendors table
CREATE TABLE IF NOT EXISTS "vendors" (
  "id" serial PRIMARY KEY NOT NULL,
  "vendor_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "company_name" text,
  "email" text,
  "phone" text,
  "website" text,
  "category" text,
  "status" text DEFAULT 'active' NOT NULL,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add vendor_contacts table
CREATE TABLE IF NOT EXISTS "vendor_contacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "vendor_id" integer NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "position" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add purchases table
CREATE TABLE IF NOT EXISTS "purchases" (
  "id" serial PRIMARY KEY NOT NULL,
  "purchase_order" text NOT NULL UNIQUE,
  "date" date NOT NULL,
  "vendor_id" integer REFERENCES "vendors"("id") ON DELETE SET NULL,
  "amount" numeric(10, 2) DEFAULT '0' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "category" text,
  "priority" text DEFAULT 'medium',
  "description" text,
  "payment_terms" text,
  "delivery_date" date,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add purchase_items table
CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "purchase_id" integer NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add purchase_documents table
CREATE TABLE IF NOT EXISTS "purchase_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "purchase_id" integer NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "uploaded_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_vendors_status" ON "vendors" ("status");
CREATE INDEX IF NOT EXISTS "idx_vendors_category" ON "vendors" ("category");
CREATE INDEX IF NOT EXISTS "idx_vendor_contacts_vendor" ON "vendor_contacts" ("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_purchases_vendor" ON "purchases" ("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_purchases_status" ON "purchases" ("status");
CREATE INDEX IF NOT EXISTS "idx_purchases_date" ON "purchases" ("date");
CREATE INDEX IF NOT EXISTS "idx_purchase_items_purchase" ON "purchase_items" ("purchase_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_documents_purchase" ON "purchase_documents" ("purchase_id");
