import { pgTable, serial, text, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const purchases = pgTable("purchases", {
	id: serial().primaryKey().notNull(),
	purchaseOrder: text("purchase_order").notNull(),
	date: text().notNull(),
	vendorId: integer("vendor_id"),
	amount: real().default(0),
	status: text().default('pending'),
	category: text(),
	priority: text().default('medium'),
	description: text(),
	paymentTerms: text("payment_terms"),
	deliveryDate: text("delivery_date"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const purchaseItems = pgTable("purchase_items", {
	id: serial().primaryKey().notNull(),
	purchaseId: integer("purchase_id").notNull(),
	name: text().notNull(),
	description: text(),
	quantity: integer().notNull(),
	unitPrice: real("unit_price").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const purchaseDocuments = pgTable("purchase_documents", {
	id: serial().primaryKey().notNull(),
	purchaseId: integer("purchase_id").notNull(),
	fileName: text("file_name").notNull(),
	filePath: text("file_path").notNull(),
	fileSize: integer("file_size"),
	mimeType: text("mime_type"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
});