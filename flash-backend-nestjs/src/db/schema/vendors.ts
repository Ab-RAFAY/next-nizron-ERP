import { pgTable, serial, text, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const vendors = pgTable("vendors", {
	id: serial().primaryKey().notNull(),
	vendorId: text("vendor_id").notNull(),
	name: text().notNull(),
	companyName: text("company_name"),
	email: text(),
	phone: text(),
	website: text(),
	category: text(),
	status: text().default('active'),
	address: text(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const vendorContacts = pgTable("vendor_contacts", {
	id: serial().primaryKey().notNull(),
	vendorId: integer("vendor_id").notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	position: text(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});