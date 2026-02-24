"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseDocuments = exports.purchaseItems = exports.purchases = exports.vendorContacts = exports.vendors = exports.rolesToPermissions = exports.usersToRoles = exports.vehicleTypes = exports.industries = exports.vehicleCategories = exports.employeeAdvances = exports.employeeAdvanceDeductions = exports.payrollSheetEntries = exports.payrollPaymentStatus = exports.leavePeriods = exports.employees = exports.siteGuardAssignments = exports.clientContractDocuments = exports.employeeFiles = exports.companySettings = exports.restrictedTransactions = exports.restrictedSerialUnits = exports.generalInventoryTransactions = exports.financeJournalLines = exports.fuelEntries = exports.clientAddresses = exports.restrictedInventoryItems = exports.clients = exports.invoices = exports.generalInventoryItems = exports.clientSites = exports.clientContracts = exports.clientContacts = exports.financeJournalEntries = exports.expenses = exports.financeAccounts = exports.advances = exports.clientPayments = exports.vehicles = exports.attendance = exports.vehicleMaintenance = exports.vehicleImages = exports.vehicleDocuments = exports.vehicleAssignments = exports.employeeWarnings = exports.roles = exports.permissions = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    email: (0, pg_core_1.text)().notNull(),
    password: (0, pg_core_1.text)().notNull(),
    fullName: (0, pg_core_1.text)("full_name"),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("users_email_unique").on(table.email),
]);
exports.permissions = (0, pg_core_1.pgTable)("permissions", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.unique)("permissions_name_unique").on(table.name),
]);
exports.roles = (0, pg_core_1.pgTable)("roles", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.unique)("roles_name_unique").on(table.name),
]);
exports.employeeWarnings = (0, pg_core_1.pgTable)("employee_warnings", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    warningNumber: (0, pg_core_1.text)("warning_number"),
    warningDate: (0, pg_core_1.text)("warning_date"),
    subject: (0, pg_core_1.text)(),
    description: (0, pg_core_1.text)(),
    foundWith: (0, pg_core_1.text)("found_with"),
    supervisorSignature: (0, pg_core_1.text)("supervisor_signature"),
    supervisorSignatureDate: (0, pg_core_1.text)("supervisor_signature_date"),
    issuedBy: (0, pg_core_1.text)("issued_by"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.vehicleAssignments = (0, pg_core_1.pgTable)("vehicle_assignments", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    employeeId: (0, pg_core_1.text)("employee_id"),
    route: (0, pg_core_1.text)(),
    assignmentDate: (0, pg_core_1.text)("assignment_date"),
    distanceKm: (0, pg_core_1.real)("distance_km"),
    cost: (0, pg_core_1.real)(),
    status: (0, pg_core_1.text)().default('active'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    fromDate: (0, pg_core_1.text)("from_date"),
    toDate: (0, pg_core_1.text)("to_date"),
    location: (0, pg_core_1.text)(),
    purpose: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vehicleId],
        foreignColumns: [exports.vehicles.vehicleId],
        name: "vehicle_assignments_vehicle_id_vehicles_vehicle_id_fk"
    }),
]);
exports.vehicleDocuments = (0, pg_core_1.pgTable)("vehicle_documents", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    filename: (0, pg_core_1.text)().notNull(),
    url: (0, pg_core_1.text)().notNull(),
    mimeType: (0, pg_core_1.text)("mime_type"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vehicleId],
        foreignColumns: [exports.vehicles.vehicleId],
        name: "vehicle_documents_vehicle_id_vehicles_vehicle_id_fk"
    }).onDelete("cascade"),
]);
exports.vehicleImages = (0, pg_core_1.pgTable)("vehicle_images", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    filename: (0, pg_core_1.text)().notNull(),
    url: (0, pg_core_1.text)().notNull(),
    mimeType: (0, pg_core_1.text)("mime_type"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vehicleId],
        foreignColumns: [exports.vehicles.vehicleId],
        name: "vehicle_images_vehicle_id_vehicles_vehicle_id_fk"
    }).onDelete("cascade"),
]);
exports.vehicleMaintenance = (0, pg_core_1.pgTable)("vehicle_maintenance", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    maintenanceDate: (0, pg_core_1.text)("maintenance_date").notNull(),
    description: (0, pg_core_1.text)().notNull(),
    cost: (0, pg_core_1.real)(),
    vendor: (0, pg_core_1.text)(),
    nextMaintenanceDate: (0, pg_core_1.text)("next_maintenance_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    maintenanceType: (0, pg_core_1.text)("maintenance_type"),
    odometerReading: (0, pg_core_1.integer)("odometer_reading"),
    status: (0, pg_core_1.text)().default('completed'),
    notes: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vehicleId],
        foreignColumns: [exports.vehicles.vehicleId],
        name: "vehicle_maintenance_vehicle_id_vehicles_vehicle_id_fk"
    }),
]);
exports.attendance = (0, pg_core_1.pgTable)("attendance", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    date: (0, pg_core_1.text)().notNull(),
    status: (0, pg_core_1.text)().notNull(),
    note: (0, pg_core_1.text)(),
    overtimeMinutes: (0, pg_core_1.integer)("overtime_minutes"),
    overtimeRate: (0, pg_core_1.real)("overtime_rate"),
    lateMinutes: (0, pg_core_1.integer)("late_minutes"),
    lateDeduction: (0, pg_core_1.real)("late_deduction"),
    leaveType: (0, pg_core_1.text)("leave_type"),
    fineAmount: (0, pg_core_1.real)("fine_amount"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    location: (0, pg_core_1.text)(),
    picture: (0, pg_core_1.text)(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
    initialLocation: (0, pg_core_1.text)("initial_location"),
});
exports.vehicles = (0, pg_core_1.pgTable)("vehicles", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    vehicleType: (0, pg_core_1.text)("vehicle_type").notNull(),
    category: (0, pg_core_1.text)().notNull(),
    makeModel: (0, pg_core_1.text)("make_model").notNull(),
    licensePlate: (0, pg_core_1.text)("license_plate").notNull(),
    chassisNumber: (0, pg_core_1.text)("chassis_number"),
    assetTag: (0, pg_core_1.text)("asset_tag"),
    year: (0, pg_core_1.integer)(),
    status: (0, pg_core_1.text)().default('active'),
    compliance: (0, pg_core_1.text)().default('compliant'),
    governmentPermit: (0, pg_core_1.text)("government_permit").default('valid'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    fuelLimitMonthly: (0, pg_core_1.real)("fuel_limit_monthly"),
    registrationDate: (0, pg_core_1.text)("registration_date"),
}, (table) => [
    (0, pg_core_1.unique)("vehicles_vehicle_id_unique").on(table.vehicleId),
]);
exports.clientPayments = (0, pg_core_1.pgTable)("client_payments", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.text)("client_id").notNull(),
    invoiceId: (0, pg_core_1.text)("invoice_id"),
    amount: (0, pg_core_1.real)().notNull(),
    paymentDate: (0, pg_core_1.text)("payment_date").notNull(),
    paymentMethod: (0, pg_core_1.text)("payment_method"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.invoiceId],
        foreignColumns: [exports.invoices.invoiceId],
        name: "client_payments_invoice_id_invoices_invoice_id_fk"
    }),
]);
exports.advances = (0, pg_core_1.pgTable)("advances", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    repaymentAmount: (0, pg_core_1.real)("repayment_amount").notNull(),
    balance: (0, pg_core_1.real)().notNull(),
    status: (0, pg_core_1.text)().default('active'),
    requestDate: (0, pg_core_1.text)("request_date").notNull(),
    approvedDate: (0, pg_core_1.text)("approved_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeId],
        foreignColumns: [exports.employees.employeeId],
        name: "advances_employee_id_employees_employee_id_fk"
    }),
]);
exports.financeAccounts = (0, pg_core_1.pgTable)("finance_accounts", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    code: (0, pg_core_1.text)().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    accountType: (0, pg_core_1.text)("account_type").notNull(),
    parentId: (0, pg_core_1.integer)("parent_id"),
    isSystem: (0, pg_core_1.boolean)("is_system").default(false),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("finance_accounts_code_unique").on(table.code),
]);
exports.expenses = (0, pg_core_1.pgTable)("expenses", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    expenseId: (0, pg_core_1.text)("expense_id").notNull(),
    category: (0, pg_core_1.text)().notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    description: (0, pg_core_1.text)().notNull(),
    expenseDate: (0, pg_core_1.text)("expense_date").notNull(),
    status: (0, pg_core_1.text)().default('pending'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    reference: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.unique)("expenses_expense_id_unique").on(table.expenseId),
]);
exports.financeJournalEntries = (0, pg_core_1.pgTable)("finance_journal_entries", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    entryNo: (0, pg_core_1.text)("entry_no").notNull(),
    entryDate: (0, pg_core_1.text)("entry_date").notNull(),
    memo: (0, pg_core_1.text)(),
    status: (0, pg_core_1.text)().default('draft'),
    postedAt: (0, pg_core_1.text)("posted_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    entryType: (0, pg_core_1.text)("entry_type").default('journal'),
    amount: (0, pg_core_1.real)().default(0),
    reference: (0, pg_core_1.text)(),
    category: (0, pg_core_1.text)(),
}, (table) => [
    (0, pg_core_1.unique)("finance_journal_entries_entry_no_unique").on(table.entryNo),
]);
exports.clientContacts = (0, pg_core_1.pgTable)("client_contacts", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.integer)("client_id").notNull(),
    name: (0, pg_core_1.text)().notNull(),
    email: (0, pg_core_1.text)(),
    phone: (0, pg_core_1.text)(),
    role: (0, pg_core_1.text)(),
    isPrimary: (0, pg_core_1.boolean)("is_primary").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.clientId],
        foreignColumns: [exports.clients.id],
        name: "client_contacts_client_id_clients_id_fk"
    }).onDelete("cascade"),
]);
exports.clientContracts = (0, pg_core_1.pgTable)("client_contracts", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.integer)("client_id").notNull(),
    contractNumber: (0, pg_core_1.text)("contract_number"),
    startDate: (0, pg_core_1.text)("start_date"),
    endDate: (0, pg_core_1.text)("end_date"),
    value: (0, pg_core_1.real)(),
    status: (0, pg_core_1.text)().default('active'),
    terms: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.clientId],
        foreignColumns: [exports.clients.id],
        name: "client_contracts_client_id_clients_id_fk"
    }).onDelete("cascade"),
]);
exports.clientSites = (0, pg_core_1.pgTable)("client_sites", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.integer)("client_id").notNull(),
    name: (0, pg_core_1.text)().notNull(),
    address: (0, pg_core_1.text)(),
    city: (0, pg_core_1.text)(),
    guardsRequired: (0, pg_core_1.integer)("guards_required").default(0),
    status: (0, pg_core_1.text)().default('active'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.clientId],
        foreignColumns: [exports.clients.id],
        name: "client_sites_client_id_clients_id_fk"
    }).onDelete("cascade"),
]);
exports.generalInventoryItems = (0, pg_core_1.pgTable)("general_inventory_items", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    itemCode: (0, pg_core_1.text)("item_code").notNull(),
    category: (0, pg_core_1.text)().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
    unitName: (0, pg_core_1.text)("unit_name").notNull(),
    quantityOnHand: (0, pg_core_1.integer)("quantity_on_hand").default(0),
    minQuantity: (0, pg_core_1.integer)("min_quantity"),
    imageUrl: (0, pg_core_1.text)("image_url"),
    status: (0, pg_core_1.text)().default('active'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("general_inventory_items_item_code_unique").on(table.itemCode),
]);
exports.invoices = (0, pg_core_1.pgTable)("invoices", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    invoiceId: (0, pg_core_1.text)("invoice_id").notNull(),
    clientId: (0, pg_core_1.text)("client_id").notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    dueDate: (0, pg_core_1.text)("due_date").notNull(),
    status: (0, pg_core_1.text)().default('unpaid'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("invoices_invoice_id_unique").on(table.invoiceId),
]);
exports.clients = (0, pg_core_1.pgTable)("clients", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.text)("client_id"),
    name: (0, pg_core_1.text)().notNull(),
    companyName: (0, pg_core_1.text)("company_name"),
    email: (0, pg_core_1.text)(),
    phone: (0, pg_core_1.text)(),
    address: (0, pg_core_1.text)(),
    industry: (0, pg_core_1.text)(),
    status: (0, pg_core_1.text)().default('active'),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    industryId: (0, pg_core_1.integer)("industry_id"),
}, (table) => [
    (0, pg_core_1.unique)("clients_client_id_unique").on(table.clientId),
]);
exports.restrictedInventoryItems = (0, pg_core_1.pgTable)("restricted_inventory_items", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    itemCode: (0, pg_core_1.text)("item_code").notNull(),
    category: (0, pg_core_1.text)().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
    isSerialTracked: (0, pg_core_1.boolean)("is_serial_tracked").default(false),
    unitName: (0, pg_core_1.text)("unit_name").notNull(),
    quantityOnHand: (0, pg_core_1.integer)("quantity_on_hand").default(0),
    minQuantity: (0, pg_core_1.integer)("min_quantity"),
    serialTotal: (0, pg_core_1.integer)("serial_total"),
    serialInStock: (0, pg_core_1.integer)("serial_in_stock"),
    makeModel: (0, pg_core_1.text)("make_model"),
    caliber: (0, pg_core_1.text)(),
    storageLocation: (0, pg_core_1.text)("storage_location"),
    requiresMaintenance: (0, pg_core_1.boolean)("requires_maintenance").default(false),
    requiresCleaning: (0, pg_core_1.boolean)("requires_cleaning").default(false),
    status: (0, pg_core_1.text)().default('active'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    licenseNumber: (0, pg_core_1.text)("license_number"),
    weaponRegion: (0, pg_core_1.text)("weapon_region"),
}, (table) => [
    (0, pg_core_1.unique)("restricted_inventory_items_item_code_unique").on(table.itemCode),
]);
exports.clientAddresses = (0, pg_core_1.pgTable)("client_addresses", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    clientId: (0, pg_core_1.integer)("client_id").notNull(),
    addressLine1: (0, pg_core_1.text)("address_line1").notNull(),
    addressLine2: (0, pg_core_1.text)("address_line2"),
    city: (0, pg_core_1.text)(),
    state: (0, pg_core_1.text)(),
    postalCode: (0, pg_core_1.text)("postal_code"),
    addressType: (0, pg_core_1.text)("address_type"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.clientId],
        foreignColumns: [exports.clients.id],
        name: "client_addresses_client_id_clients_id_fk"
    }).onDelete("cascade"),
]);
exports.fuelEntries = (0, pg_core_1.pgTable)("fuel_entries", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    entryDate: (0, pg_core_1.text)("entry_date").notNull(),
    fuelType: (0, pg_core_1.text)("fuel_type"),
    liters: (0, pg_core_1.real)().notNull(),
    pricePerLiter: (0, pg_core_1.real)("price_per_liter"),
    totalCost: (0, pg_core_1.real)("total_cost").notNull(),
    odometerKm: (0, pg_core_1.integer)("odometer_km"),
    vendor: (0, pg_core_1.text)(),
    location: (0, pg_core_1.text)(),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vehicleId],
        foreignColumns: [exports.vehicles.vehicleId],
        name: "fuel_entries_vehicle_id_vehicles_vehicle_id_fk"
    }),
]);
exports.financeJournalLines = (0, pg_core_1.pgTable)("finance_journal_lines", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    entryId: (0, pg_core_1.integer)("entry_id").notNull(),
    accountId: (0, pg_core_1.integer)("account_id").notNull(),
    description: (0, pg_core_1.text)(),
    debit: (0, pg_core_1.real)().default(0),
    credit: (0, pg_core_1.real)().default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.entryId],
        foreignColumns: [exports.financeJournalEntries.id],
        name: "finance_journal_lines_entry_id_finance_journal_entries_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.accountId],
        foreignColumns: [exports.financeAccounts.id],
        name: "finance_journal_lines_account_id_finance_accounts_id_fk"
    }),
]);
exports.generalInventoryTransactions = (0, pg_core_1.pgTable)("general_inventory_transactions", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    itemCode: (0, pg_core_1.text)("item_code").notNull(),
    employeeId: (0, pg_core_1.text)("employee_id"),
    action: (0, pg_core_1.text)().notNull(),
    quantity: (0, pg_core_1.integer)().notNull(),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.restrictedSerialUnits = (0, pg_core_1.pgTable)("restricted_serial_units", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    itemCode: (0, pg_core_1.text)("item_code").notNull(),
    serialNumber: (0, pg_core_1.text)("serial_number").notNull(),
    status: (0, pg_core_1.text)().default('in_stock'),
    issuedToEmployeeId: (0, pg_core_1.text)("issued_to_employee_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("restricted_serial_units_serial_number_unique").on(table.serialNumber),
]);
exports.restrictedTransactions = (0, pg_core_1.pgTable)("restricted_transactions", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    itemCode: (0, pg_core_1.text)("item_code").notNull(),
    employeeId: (0, pg_core_1.text)("employee_id"),
    serialUnitId: (0, pg_core_1.integer)("serial_unit_id"),
    action: (0, pg_core_1.text)().notNull(),
    quantity: (0, pg_core_1.integer)(),
    conditionNote: (0, pg_core_1.text)("condition_note"),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.companySettings = (0, pg_core_1.pgTable)("company_settings", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().default('Nizron Security Services').notNull(),
    address: (0, pg_core_1.text)(),
    phone: (0, pg_core_1.text)(),
    email: (0, pg_core_1.text)(),
    website: (0, pg_core_1.text)(),
    logoUrl: (0, pg_core_1.text)("logo_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
});
exports.employeeFiles = (0, pg_core_1.pgTable)("employee_files", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    category: (0, pg_core_1.text)().notNull(),
    subCategory: (0, pg_core_1.text)("sub_category"),
    filename: (0, pg_core_1.text)().notNull(),
    filePath: (0, pg_core_1.text)("file_path").notNull(),
    fileType: (0, pg_core_1.text)("file_type"),
    fileSize: (0, pg_core_1.integer)("file_size"),
    description: (0, pg_core_1.text)(),
    uploadedBy: (0, pg_core_1.text)("uploaded_by"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.clientContractDocuments = (0, pg_core_1.pgTable)("client_contract_documents", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    contractId: (0, pg_core_1.integer)("contract_id").notNull(),
    filename: (0, pg_core_1.text)().notNull(),
    filePath: (0, pg_core_1.text)("file_path").notNull(),
    fileType: (0, pg_core_1.text)("file_type"),
    fileSize: (0, pg_core_1.integer)("file_size"),
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at", { mode: 'string' }).defaultNow(),
});
exports.siteGuardAssignments = (0, pg_core_1.pgTable)("site_guard_assignments", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    siteId: (0, pg_core_1.integer)("site_id").notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    assignmentDate: (0, pg_core_1.text)("assignment_date").notNull(),
    endDate: (0, pg_core_1.text)("end_date"),
    shift: (0, pg_core_1.text)(),
    status: (0, pg_core_1.text)().default('active'),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.employees = (0, pg_core_1.pgTable)("employees", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    fullName: (0, pg_core_1.text)("full_name").notNull(),
    firstName: (0, pg_core_1.text)("first_name"),
    lastName: (0, pg_core_1.text)("last_name"),
    email: (0, pg_core_1.text)(),
    gender: (0, pg_core_1.text)(),
    dob: (0, pg_core_1.text)(),
    dateOfBirth: (0, pg_core_1.text)("date_of_birth"),
    profilePhoto: (0, pg_core_1.text)("profile_photo"),
    governmentId: (0, pg_core_1.text)("government_id"),
    cnic: (0, pg_core_1.text)(),
    cnicExpiryDate: (0, pg_core_1.text)("cnic_expiry_date"),
    domicile: (0, pg_core_1.text)(),
    languagesSpoken: (0, pg_core_1.text)("languages_spoken"),
    languagesProficiency: (0, pg_core_1.text)("languages_proficiency"),
    heightCm: (0, pg_core_1.real)("height_cm"),
    phone: (0, pg_core_1.text)(),
    mobileNumber: (0, pg_core_1.text)("mobile_number"),
    personalPhoneNumber: (0, pg_core_1.text)("personal_phone_number"),
    emergencyContactName: (0, pg_core_1.text)("emergency_contact_name"),
    emergencyContactNumber: (0, pg_core_1.text)("emergency_contact_number"),
    fatherName: (0, pg_core_1.text)("father_name"),
    previousEmployment: (0, pg_core_1.text)("previous_employment"),
    nextOfKinName: (0, pg_core_1.text)("next_of_kin_name"),
    nextOfKinCnic: (0, pg_core_1.text)("next_of_kin_cnic"),
    nextOfKinMobileNumber: (0, pg_core_1.text)("next_of_kin_mobile_number"),
    address: (0, pg_core_1.text)(),
    addressLine1: (0, pg_core_1.text)("address_line1"),
    addressLine2: (0, pg_core_1.text)("address_line2"),
    permanentAddress: (0, pg_core_1.text)("permanent_address"),
    temporaryAddress: (0, pg_core_1.text)("temporary_address"),
    city: (0, pg_core_1.text)(),
    state: (0, pg_core_1.text)(),
    postalCode: (0, pg_core_1.text)("postal_code"),
    department: (0, pg_core_1.text)(),
    designation: (0, pg_core_1.text)(),
    enrolledAs: (0, pg_core_1.text)("enrolled_as"),
    employmentType: (0, pg_core_1.text)("employment_type"),
    shiftType: (0, pg_core_1.text)("shift_type"),
    reportingManager: (0, pg_core_1.text)("reporting_manager"),
    baseLocation: (0, pg_core_1.text)("base_location"),
    interviewedBy: (0, pg_core_1.text)("interviewed_by"),
    introducedBy: (0, pg_core_1.text)("introduced_by"),
    securityClearance: (0, pg_core_1.text)("security_clearance"),
    basicSecurityTraining: (0, pg_core_1.boolean)("basic_security_training").default(false),
    fireSafetyTraining: (0, pg_core_1.boolean)("fire_safety_training").default(false),
    firstAidCertification: (0, pg_core_1.boolean)("first_aid_certification").default(false),
    agreement: (0, pg_core_1.boolean)().default(false),
    policeClearance: (0, pg_core_1.boolean)("police_clearance").default(false),
    fingerprintCheck: (0, pg_core_1.boolean)("fingerprint_check").default(false),
    backgroundScreening: (0, pg_core_1.boolean)("background_screening").default(false),
    referenceVerification: (0, pg_core_1.boolean)("reference_verification").default(false),
    guardCard: (0, pg_core_1.boolean)("guard_card").default(false),
    basicSalary: (0, pg_core_1.text)("basic_salary"),
    allowances: (0, pg_core_1.text)(),
    totalSalary: (0, pg_core_1.text)("total_salary"),
    salary: (0, pg_core_1.real)(),
    bankName: (0, pg_core_1.text)("bank_name"),
    accountNumber: (0, pg_core_1.text)("account_number"),
    ifscCode: (0, pg_core_1.text)("ifsc_code"),
    accountType: (0, pg_core_1.text)("account_type"),
    taxId: (0, pg_core_1.text)("tax_id"),
    employmentStatus: (0, pg_core_1.text)("employment_status").default('active'),
    status: (0, pg_core_1.text)().default('active'),
    lastSiteAssigned: (0, pg_core_1.text)("last_site_assigned"),
    remarks: (0, pg_core_1.text)(),
    leftReason: (0, pg_core_1.text)("left_reason"),
    serialNo: (0, pg_core_1.text)("serial_no"),
    fssNo: (0, pg_core_1.text)("fss_no"),
    rank: (0, pg_core_1.text)(),
    unit: (0, pg_core_1.text)(),
    serviceRank: (0, pg_core_1.text)("service_rank"),
    status2: (0, pg_core_1.text)(),
    unit2: (0, pg_core_1.text)(),
    rank2: (0, pg_core_1.text)(),
    cnicExpiry: (0, pg_core_1.text)("cnic_expiry"),
    documentsHeld: (0, pg_core_1.text)("documents_held"),
    documentsHandedOverTo: (0, pg_core_1.text)("documents_handed_over_to"),
    photoOnDoc: (0, pg_core_1.text)("photo_on_doc"),
    eobiNo: (0, pg_core_1.text)("eobi_no"),
    insurance: (0, pg_core_1.text)(),
    socialSecurity: (0, pg_core_1.text)("social_security"),
    mobileNo: (0, pg_core_1.text)("mobile_no"),
    homeContact: (0, pg_core_1.text)("home_contact"),
    verifiedBySho: (0, pg_core_1.text)("verified_by_sho"),
    verifiedByKhidmatMarkaz: (0, pg_core_1.text)("verified_by_khidmat_markaz"),
    verifiedBySsp: (0, pg_core_1.text)("verified_by_ssp"),
    enrolled: (0, pg_core_1.text)(),
    reEnrolled: (0, pg_core_1.text)("re_enrolled"),
    village: (0, pg_core_1.text)(),
    postOffice: (0, pg_core_1.text)("post_office"),
    thana: (0, pg_core_1.text)(),
    tehsil: (0, pg_core_1.text)(),
    district: (0, pg_core_1.text)(),
    dutyLocation: (0, pg_core_1.text)("duty_location"),
    policeTrgLtrDate: (0, pg_core_1.text)("police_trg_ltr_date"),
    vaccinationCert: (0, pg_core_1.text)("vaccination_cert"),
    volNo: (0, pg_core_1.text)("vol_no"),
    payments: (0, pg_core_1.text)(),
    category: (0, pg_core_1.text)(),
    allocationStatus: (0, pg_core_1.text)("allocation_status"),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
    photo: (0, pg_core_1.text)(),
    cnicNo: (0, pg_core_1.text)("cnic_no"),
    bloodGroup: (0, pg_core_1.text)("blood_group"),
    height: (0, pg_core_1.text)(),
    education: (0, pg_core_1.text)(),
    bioData: (0, pg_core_1.text)("bio_data"),
    dateOfEnrolment: (0, pg_core_1.text)("date_of_enrolment"),
    dateOfReEnrolment: (0, pg_core_1.text)("date_of_re_enrolment"),
    servedIn: (0, pg_core_1.text)("served_in"),
    experienceInSecurity: (0, pg_core_1.text)("experience_in_security"),
    causeOfDischarge: (0, pg_core_1.text)("cause_of_discharge"),
    medicalCategory: (0, pg_core_1.text)("medical_category"),
    deployedAt: (0, pg_core_1.text)("deployed_at"),
    payRs: (0, pg_core_1.integer)("pay_rs"),
    bdm: (0, pg_core_1.text)(),
    originalDocumentHeld: (0, pg_core_1.text)("original_document_held"),
    agreementDate: (0, pg_core_1.text)("agreement_date"),
    otherDocuments: (0, pg_core_1.text)("other_documents"),
    personalMobileNo: (0, pg_core_1.text)("personal_mobile_no"),
    permanentVillage: (0, pg_core_1.text)("permanent_village"),
    permanentPostOffice: (0, pg_core_1.text)("permanent_post_office"),
    permanentThana: (0, pg_core_1.text)("permanent_thana"),
    permanentTehsil: (0, pg_core_1.text)("permanent_tehsil"),
    permanentDistrict: (0, pg_core_1.text)("permanent_district"),
    presentVillage: (0, pg_core_1.text)("present_village"),
    presentPostOffice: (0, pg_core_1.text)("present_post_office"),
    presentThana: (0, pg_core_1.text)("present_thana"),
    presentTehsil: (0, pg_core_1.text)("present_tehsil"),
    presentDistrict: (0, pg_core_1.text)("present_district"),
    sons: (0, pg_core_1.integer)().default(0),
    daughters: (0, pg_core_1.integer)().default(0),
    brothers: (0, pg_core_1.integer)().default(0),
    sisters: (0, pg_core_1.integer)().default(0),
    nokName: (0, pg_core_1.text)("nok_name"),
    nokCnicNo: (0, pg_core_1.text)("nok_cnic_no"),
    nokMobileNo: (0, pg_core_1.text)("nok_mobile_no"),
    shoVerificationDate: (0, pg_core_1.text)("sho_verification_date"),
    sspVerificationDate: (0, pg_core_1.text)("ssp_verification_date"),
    signatureRecordingOfficer: (0, pg_core_1.text)("signature_recording_officer"),
    signatureIndividual: (0, pg_core_1.text)("signature_individual"),
    thumbImpression: (0, pg_core_1.text)("thumb_impression"),
    indexImpression: (0, pg_core_1.text)("index_impression"),
    middleImpression: (0, pg_core_1.text)("middle_impression"),
    ringImpression: (0, pg_core_1.text)("ring_impression"),
    littleImpression: (0, pg_core_1.text)("little_impression"),
    finalSignature: (0, pg_core_1.text)("final_signature"),
    biometricData: (0, pg_core_1.text)("biometric_data"),
    password: (0, pg_core_1.text)(),
    mainNumber: (0, pg_core_1.text)("main_number"),
}, (table) => [
    (0, pg_core_1.unique)("employees_employee_id_unique").on(table.employeeId),
]);
exports.leavePeriods = (0, pg_core_1.pgTable)("leave_periods", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    fromDate: (0, pg_core_1.text)("from_date").notNull(),
    toDate: (0, pg_core_1.text)("to_date").notNull(),
    leaveType: (0, pg_core_1.text)("leave_type").notNull(),
    reason: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    status: (0, pg_core_1.text)().default('approved'),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeId],
        foreignColumns: [exports.employees.employeeId],
        name: "leave_periods_employee_id_employees_employee_id_fk"
    }),
]);
exports.payrollPaymentStatus = (0, pg_core_1.pgTable)("payroll_payment_status", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeId: (0, pg_core_1.text)("employee_id").notNull(),
    month: (0, pg_core_1.text)().notNull(),
    status: (0, pg_core_1.text)().default('unpaid'),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeId],
        foreignColumns: [exports.employees.employeeId],
        name: "payroll_payment_status_employee_id_employees_employee_id_fk"
    }),
]);
exports.payrollSheetEntries = (0, pg_core_1.pgTable)("payroll_sheet_entries", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeDbId: (0, pg_core_1.integer)("employee_db_id").notNull(),
    fromDate: (0, pg_core_1.text)("from_date").notNull(),
    toDate: (0, pg_core_1.text)("to_date").notNull(),
    preDaysOverride: (0, pg_core_1.integer)("pre_days_override"),
    curDaysOverride: (0, pg_core_1.integer)("cur_days_override"),
    leaveEncashmentDays: (0, pg_core_1.integer)("leave_encashment_days"),
    allowOther: (0, pg_core_1.real)("allow_other"),
    eobi: (0, pg_core_1.real)(),
    tax: (0, pg_core_1.real)(),
    fineAdvExtra: (0, pg_core_1.real)("fine_adv_extra"),
    otRateOverride: (0, pg_core_1.real)("ot_rate_override"),
    remarks: (0, pg_core_1.text)(),
    bankCash: (0, pg_core_1.text)("bank_cash"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeDbId],
        foreignColumns: [exports.employees.id],
        name: "payroll_sheet_entries_employee_db_id_employees_id_fk"
    }),
]);
exports.employeeAdvanceDeductions = (0, pg_core_1.pgTable)("employee_advance_deductions", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeDbId: (0, pg_core_1.integer)("employee_db_id").notNull(),
    month: (0, pg_core_1.text)().notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    note: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeDbId],
        foreignColumns: [exports.employees.id],
        name: "employee_advance_deductions_employee_db_id_employees_id_fk"
    }),
]);
exports.employeeAdvances = (0, pg_core_1.pgTable)("employee_advances", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    employeeDbId: (0, pg_core_1.integer)("employee_db_id").notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    note: (0, pg_core_1.text)(),
    advanceDate: (0, pg_core_1.text)("advance_date").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.employeeDbId],
        foreignColumns: [exports.employees.id],
        name: "employee_advances_employee_db_id_employees_id_fk"
    }),
]);
exports.vehicleCategories = (0, pg_core_1.pgTable)("vehicle_categories", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.industries = (0, pg_core_1.pgTable)("industries", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.vehicleTypes = (0, pg_core_1.pgTable)("vehicle_types", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
});
exports.usersToRoles = (0, pg_core_1.pgTable)("users_to_roles", {
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    roleId: (0, pg_core_1.integer)("role_id").notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.users.id],
        name: "users_to_roles_user_id_users_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.roleId],
        foreignColumns: [exports.roles.id],
        name: "users_to_roles_role_id_roles_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.primaryKey)({ columns: [table.userId, table.roleId], name: "users_to_roles_user_id_role_id_pk" }),
]);
exports.rolesToPermissions = (0, pg_core_1.pgTable)("roles_to_permissions", {
    roleId: (0, pg_core_1.integer)("role_id").notNull(),
    permissionId: (0, pg_core_1.integer)("permission_id").notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.roleId],
        foreignColumns: [exports.roles.id],
        name: "roles_to_permissions_role_id_roles_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.permissionId],
        foreignColumns: [exports.permissions.id],
        name: "roles_to_permissions_permission_id_permissions_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.primaryKey)({ columns: [table.roleId, table.permissionId], name: "roles_to_permissions_role_id_permission_id_pk" }),
]);
exports.vendors = (0, pg_core_1.pgTable)("vendors", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vendorId: (0, pg_core_1.text)("vendor_id").notNull().unique(),
    name: (0, pg_core_1.text)().notNull(),
    companyName: (0, pg_core_1.text)("company_name"),
    email: (0, pg_core_1.text)(),
    phone: (0, pg_core_1.text)(),
    website: (0, pg_core_1.text)(),
    category: (0, pg_core_1.text)().notNull(),
    status: (0, pg_core_1.text)().notNull().default('active'),
    address: (0, pg_core_1.text)(),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
});
exports.vendorContacts = (0, pg_core_1.pgTable)("vendor_contacts", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    vendorId: (0, pg_core_1.integer)("vendor_id").notNull(),
    name: (0, pg_core_1.text)().notNull(),
    email: (0, pg_core_1.text)(),
    phone: (0, pg_core_1.text)(),
    position: (0, pg_core_1.text)(),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vendorId],
        foreignColumns: [exports.vendors.id],
        name: "vendor_contacts_vendor_id_vendors_id_fk"
    }).onDelete("cascade"),
]);
exports.purchases = (0, pg_core_1.pgTable)("purchases", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    purchaseOrder: (0, pg_core_1.text)("purchase_order").notNull().unique(),
    vendorId: (0, pg_core_1.integer)("vendor_id").notNull(),
    date: (0, pg_core_1.timestamp)({ mode: 'string' }).notNull(),
    amount: (0, pg_core_1.real)().notNull(),
    status: (0, pg_core_1.text)().notNull().default('pending'),
    category: (0, pg_core_1.text)().notNull(),
    priority: (0, pg_core_1.text)().default('medium'),
    paymentTerms: (0, pg_core_1.text)("payment_terms"),
    deliveryDate: (0, pg_core_1.timestamp)("delivery_date", { mode: 'string' }),
    deliveryAddress: (0, pg_core_1.text)("delivery_address"),
    referenceNumber: (0, pg_core_1.text)("reference_number"),
    contactPerson: (0, pg_core_1.text)("contact_person"),
    description: (0, pg_core_1.text)(),
    notes: (0, pg_core_1.text)(),
    termsConditions: (0, pg_core_1.text)("terms_conditions"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vendorId],
        foreignColumns: [exports.vendors.id],
        name: "purchases_vendor_id_vendors_id_fk"
    }),
]);
exports.purchaseItems = (0, pg_core_1.pgTable)("purchase_items", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    purchaseId: (0, pg_core_1.integer)("purchase_id").notNull(),
    name: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
    quantity: (0, pg_core_1.integer)().notNull(),
    unitPrice: (0, pg_core_1.real)("unit_price").notNull(),
    notes: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.purchaseId],
        foreignColumns: [exports.purchases.id],
        name: "purchase_items_purchase_id_purchases_id_fk"
    }).onDelete("cascade"),
]);
exports.purchaseDocuments = (0, pg_core_1.pgTable)("purchase_documents", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    purchaseId: (0, pg_core_1.integer)("purchase_id").notNull(),
    fileName: (0, pg_core_1.text)("file_name").notNull(),
    filePath: (0, pg_core_1.text)("file_path").notNull(),
    fileSize: (0, pg_core_1.integer)("file_size"),
    mimeType: (0, pg_core_1.text)("mime_type"),
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.purchaseId],
        foreignColumns: [exports.purchases.id],
        name: "purchase_documents_purchase_id_purchases_id_fk"
    }).onDelete("cascade"),
]);
//# sourceMappingURL=schema.js.map