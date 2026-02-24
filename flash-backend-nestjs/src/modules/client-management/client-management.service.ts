import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, or, sql, ilike, count } from 'drizzle-orm';
import { CloudStorageService } from '../../common/storage/cloud-storage.service';

@Injectable()
export class ClientManagementService {
  private logger = new Logger(ClientManagementService.name);

  private async generateClientId(): Promise<string> {
    const prefix = 'FCID-';

    const [lastClient] = await this.db
      .select({ id: schema.clients.id, client_id: schema.clients.client_id })
      .from(schema.clients)
      .orderBy(desc(schema.clients.id))
      .limit(1);

    const nextNumber = (lastClient?.id || 0) + 1;
    const padded = String(nextNumber).padStart(3, '0');
    return `${prefix}${padded}`;
  }

  private async generateContractNumber(): Promise<string> {
    const prefix = 'CTN-';

    const [lastContract] = await this.db
      .select({ id: schema.client_contracts.id })
      .from(schema.client_contracts)
      .orderBy(desc(schema.client_contracts.id))
      .limit(1);

    const nextNumber = (lastContract?.id || 0) + 1;
    const padded = String(nextNumber).padStart(4, '0');
    return `${prefix}${padded}`;
  }

  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
    private cloudStorageService: CloudStorageService,
  ) {}

  // Clients
  async listClients() {
    return this.db
      .select({
        id: schema.clients.id,
        client_id: schema.clients.client_id,
        name: schema.clients.name,
        company_name: schema.clients.company_name,
        email: schema.clients.email,
        phone: schema.clients.phone,
        address: schema.clients.address,
        industry: sql<string>`COALESCE(${schema.industries.name}, ${schema.clients.industry})`,
        industry_id: schema.clients.industry_id,
        status: schema.clients.status,
        notes: schema.clients.notes,
        created_at: schema.clients.created_at,
      })
      .from(schema.clients)
      .leftJoin(schema.industries, eq(schema.clients.industry_id, schema.industries.id))
      .orderBy(desc(schema.clients.id));
  }

  async getClient(id: number) {
    const [client] = await this.db
      .select({
        id: schema.clients.id,
        client_id: schema.clients.client_id,
        name: schema.clients.name,
        company_name: schema.clients.company_name,
        email: schema.clients.email,
        phone: schema.clients.phone,
        address: schema.clients.address,
        industry: sql<string>`COALESCE(${schema.industries.name}, ${schema.clients.industry})`,
        industry_id: schema.clients.industry_id,
        status: schema.clients.status,
        notes: schema.clients.notes,
        created_at: schema.clients.created_at,
      })
      .from(schema.clients)
      .leftJoin(schema.industries, eq(schema.clients.industry_id, schema.industries.id))
      .where(eq(schema.clients.id, id));
    if (!client) throw new NotFoundException('Client not found');

    const contacts = await this.db
      .select()
      .from(schema.client_contacts)
      .where(eq(schema.client_contacts.client_id, id));
    const addresses = await this.db
      .select()
      .from(schema.client_addresses)
      .where(eq(schema.client_addresses.client_id, id));
    const sites = await this.db
      .select()
      .from(schema.client_sites)
      .where(eq(schema.client_sites.client_id, id));
    const contracts = await this.db
      .select()
      .from(schema.client_contracts)
      .where(eq(schema.client_contracts.client_id, id));

    return { ...client, contacts, addresses, sites, contracts };
  }

  async createClient(dto: any) {
    const data: any = { ...dto };

    if (!data.client_id) {
      data.client_id = await this.generateClientId();
    }

    const [result] = await this.db
      .insert(schema.clients)
      .values(data)
      .returning();
    return result;
  }

  async updateClient(id: number, dto: any) {
    await this.getClient(id);
    const data: any = { ...dto };

    await this.db
      .update(schema.clients)
      .set(data)
      .where(eq(schema.clients.id, id));
    return this.getClient(id);
  }

  async deleteClient(id: number) {
    await this.getClient(id);
    await this.db.delete(schema.clients).where(eq(schema.clients.id, id));
    return { message: 'Deleted' };
  }

  // Contacts
  async listContacts(clientId: number) {
    return this.db
      .select()
      .from(schema.client_contacts)
      .where(eq(schema.client_contacts.client_id, clientId));
  }

  async createContact(clientId: number, dto: any) {
    const data: any = { ...dto, client_id: clientId };
    const [result] = await this.db
      .insert(schema.client_contacts)
      .values(data)
      .returning();
    return result;
  }

  async updateContact(clientId: number, id: number, dto: any) {
    const [contact] = await this.db
      .select()
      .from(schema.client_contacts)
      .where(
        and(
          eq(schema.client_contacts.id, id),
          eq(schema.client_contacts.client_id, clientId),
        ),
      );
    if (!contact) throw new NotFoundException('Contact not found');

    const data: any = { ...dto };

    await this.db
      .update(schema.client_contacts)
      .set(data)
      .where(eq(schema.client_contacts.id, id));
    const [updatedContact] = await this.db
      .select()
      .from(schema.client_contacts)
      .where(eq(schema.client_contacts.id, id));
    return updatedContact;
  }

  async deleteContact(clientId: number, id: number) {
    await this.db
      .delete(schema.client_contacts)
      .where(
        and(
          eq(schema.client_contacts.id, id),
          eq(schema.client_contacts.client_id, clientId),
        ),
      );
    return { message: 'Deleted' };
  }

  // Addresses
  async listAddresses(clientId: number) {
    return this.db
      .select()
      .from(schema.client_addresses)
      .where(eq(schema.client_addresses.client_id, clientId));
  }

  async createAddress(clientId: number, dto: any) {
    const data: any = { ...dto, client_id: clientId };
    const [result] = await this.db
      .insert(schema.client_addresses)
      .values(data)
      .returning();
    return result;
  }

  async updateAddress(clientId: number, id: number, dto: any) {
    const data: any = { ...dto };
    await this.db
      .update(schema.client_addresses)
      .set(data)
      .where(
        and(
          eq(schema.client_addresses.id, id),
          eq(schema.client_addresses.client_id, clientId),
        ),
      );
    const [updatedAddress] = await this.db
      .select()
      .from(schema.client_addresses)
      .where(eq(schema.client_addresses.id, id));
    return updatedAddress;
  }

  async deleteAddress(clientId: number, id: number) {
    await this.db
      .delete(schema.client_addresses)
      .where(
        and(
          eq(schema.client_addresses.id, id),
          eq(schema.client_addresses.client_id, clientId),
        ),
      );
    return { message: 'Deleted' };
  }

  // Sites
  async listSites(clientId: number) {
    return this.db
      .select()
      .from(schema.client_sites)
      .where(eq(schema.client_sites.client_id, clientId));
  }

  async createSite(clientId: number, dto: any) {
    const data: any = { ...dto, client_id: clientId };
    const [result] = await this.db
      .insert(schema.client_sites)
      .values(data)
      .returning();
    return result;
  }

  async updateSite(clientId: number, id: number, dto: any) {
    const data: any = { ...dto };
    await this.db
      .update(schema.client_sites)
      .set(data)
      .where(
        and(
          eq(schema.client_sites.id, id),
          eq(schema.client_sites.client_id, clientId),
        ),
      );
    const [updatedSite] = await this.db
      .select()
      .from(schema.client_sites)
      .where(eq(schema.client_sites.id, id));
    return updatedSite;
  }

  async deleteSite(clientId: number, id: number) {
    await this.db
      .delete(schema.client_sites)
      .where(
        and(
          eq(schema.client_sites.id, id),
          eq(schema.client_sites.client_id, clientId),
        ),
      );
    return { message: 'Deleted' };
  }

  // Contracts
  async listContracts(clientId: number) {
    return this.db
      .select()
      .from(schema.client_contracts)
      .where(eq(schema.client_contracts.client_id, clientId));
  }

  async createContract(clientId: number, dto: any) {
    const data: any = { ...dto, client_id: clientId };

    if (!data.contract_number) {
      data.contract_number = await this.generateContractNumber();
    }

    const [result] = await this.db
      .insert(schema.client_contracts)
      .values(data)
      .returning();
    return result;
  }

  async updateContract(clientId: number, id: number, dto: any) {
    const data: any = { ...dto };
    await this.db
      .update(schema.client_contracts)
      .set(data)
      .where(
        and(
          eq(schema.client_contracts.id, id),
          eq(schema.client_contracts.client_id, clientId),
        ),
      );
    const [updatedContract] = await this.db
      .select()
      .from(schema.client_contracts)
      .where(eq(schema.client_contracts.id, id));
    return updatedContract;
  }

  async deleteContract(clientId: number, id: number) {
    await this.db
      .delete(schema.client_contracts)
      .where(
        and(
          eq(schema.client_contracts.id, id),
          eq(schema.client_contracts.client_id, clientId),
        ),
      );
    return { message: 'Deleted' };
  }

  // Contract Documents
  async uploadContractDocument(contractId: number, file: Express.Multer.File) {
    try {
      // Upload to Cloud Storage
      this.logger.log(`Uploading contract document to cloud: contracts/${contractId}/${file.originalname}`);
      const { url } = await this.cloudStorageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype || 'application/octet-stream',
        `contracts/${contractId}`,
      );

      // Store reference in database
      const data: any = {
        contract_id: contractId,
        filename: file.originalname,
        file_path: url, 
        file_type: file.mimetype,
        file_size: file.size,
      };
      const [result] = await this.db
        .insert(schema.client_contract_documents)
        .values(data)
        .returning();
      
      this.logger.log(`Contract document uploaded successfully: ${file.originalname}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload contract document for contract ${contractId}:`, error);
      throw error;
    }
  }

  async listContractDocuments(contractId: number) {
    return this.db
      .select()
      .from(schema.client_contract_documents)
      .where(eq(schema.client_contract_documents.contract_id, contractId));
  }

  async deleteContractDocument(contractId: number, documentId: number) {
    await this.db
      .delete(schema.client_contract_documents)
      .where(
        and(
          eq(schema.client_contract_documents.id, documentId),
          eq(schema.client_contract_documents.contract_id, contractId),
        ),
      );
    return { message: 'Deleted' };
  }

  // Guard Assignments
  async assignGuard(siteId: number, dto: any) {
    const data: any = {
      site_id: siteId,
      employee_id: dto.employee_id,
      assignment_date: dto.assignment_date,
      shift: dto.shift,
      notes: dto.notes,
      status: 'active',
    };
    const [result] = await this.db
      .insert(schema.site_guard_assignments)
      .values(data)
      .returning();
    return result;
  }

  async listSiteGuards(siteId: number) {
    const assignments = await this.db
      .select()
      .from(schema.site_guard_assignments)
      .where(eq(schema.site_guard_assignments.site_id, siteId))
      .orderBy(desc(schema.site_guard_assignments.id));

    // Fetch employee details for each assignment
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const [employee] = await this.db
          .select()
          .from(schema.employees)
          .where(eq(schema.employees.employee_id, assignment.employee_id));
        return {
          ...assignment,
          employee_name:
            employee?.full_name || employee?.first_name || 'Unknown',
          employee_photo: employee?.profile_photo,
        };
      }),
    );

    return enriched;
  }

  async ejectGuard(siteId: number, assignmentId: number, dto: any) {
    await this.db
      .update(schema.site_guard_assignments)
      .set({
        status: 'ejected',
        end_date: dto.end_date,
        notes: dto.notes || null,
      })
      .where(
        and(
          eq(schema.site_guard_assignments.id, assignmentId),
          eq(schema.site_guard_assignments.site_id, siteId),
        ),
      );

    const [updated] = await this.db
      .select()
      .from(schema.site_guard_assignments)
      .where(eq(schema.site_guard_assignments.id, assignmentId));
    return updated;
  }

  async getAvailableGuards() {
    try {
      const allEmployees = await this.db
        .select()
        .from(schema.employees);
      
      const activeEmployees = allEmployees.filter(emp => 
        emp.status?.toLowerCase() === 'active' 
      );

      // Return all active employees, regardless of assignment status
      // This allows assigning guards to multiple sites/shifts
      return { guards: activeEmployees };
    } catch (error) {
      this.logger.error('Failed to get available guards:', error);
      throw error;
    }
  }

  async listAllActiveAssignments() {
    return this.db
      .select({
        assignment_id: schema.site_guard_assignments.id,
        employee_id: schema.site_guard_assignments.employee_id,
        site_id: schema.client_sites.id,
        site_name: schema.client_sites.name,
        client_id: schema.clients.id,
        client_name: schema.clients.name,
        shift: schema.site_guard_assignments.shift,
      })
      .from(schema.site_guard_assignments)
      .innerJoin(
        schema.client_sites,
        eq(schema.site_guard_assignments.site_id, schema.client_sites.id),
      )
      .innerJoin(
        schema.clients,
        eq(schema.client_sites.client_id, schema.clients.id),
      )
      .where(eq(schema.site_guard_assignments.status, 'active'));
  }

  // Industries
  async listIndustries() {
    return this.db
      .select()
      .from(schema.industries)
      .orderBy(desc(schema.industries.id));
  }

  async createIndustry(dto: any) {
    const [result] = await this.db
      .insert(schema.industries)
      .values(dto)
      .returning();
    return result;
  }

  async updateIndustry(id: number, dto: any) {
    await this.db
      .update(schema.industries)
      .set(dto)
      .where(eq(schema.industries.id, id));
    
    const [updated] = await this.db
      .select()
      .from(schema.industries)
      .where(eq(schema.industries.id, id));
    return updated;
  }

  async deleteIndustry(id: number) {
    await this.db.delete(schema.industries).where(eq(schema.industries.id, id));
    return { message: 'Deleted' };
  }

  // Complaints
  async listAllComplaints() {
    return this.db
      .select()
      .from(schema.client_complaints)
      .orderBy(desc(schema.client_complaints.id));
  }

  async updateComplaint(id: number, dto: any) {
    const data: any = { ...dto, updated_at: new Date() };

    await this.db
      .update(schema.client_complaints)
      .set(data)
      .where(eq(schema.client_complaints.id, id));

    const [updated] = await this.db
      .select()
      .from(schema.client_complaints)
      .where(eq(schema.client_complaints.id, id));
    return updated;
  }

  async deleteComplaint(id: number) {
    await this.db
      .delete(schema.client_complaints)
      .where(eq(schema.client_complaints.id, id));
    return { message: 'Deleted' };
  }

  // Vendors
  async listVendors(query: any = {}) {
    const { search, status, category } = query;
    
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        ilike(schema.vendors.name, `%${search}%`)
      );
    }
    
    if (status) {
      whereConditions.push(eq(schema.vendors.status, status));
    }
    
    if (category) {
      whereConditions.push(eq(schema.vendors.category, category));
    }

    const vendors = await this.db
      .select({
        id: schema.vendors.id,
        vendor_id: schema.vendors.vendorId,
        name: schema.vendors.name,
        company_name: schema.vendors.companyName,
        email: schema.vendors.email,
        phone: schema.vendors.phone,
        website: schema.vendors.website,
        category: schema.vendors.category,
        status: schema.vendors.status,
        address: schema.vendors.address,
        notes: schema.vendors.notes,
        created_at: schema.vendors.createdAt,
        updated_at: schema.vendors.updatedAt,
      })
      .from(schema.vendors)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.vendors.createdAt));

    return { vendors };
  }

  async createVendor(dto: any) {
    // Generate vendor ID if not provided
    if (!dto.vendor_id) {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      dto.vendor_id = `VND-${timestamp}-${randomNum}`;
    }

    const [vendor] = await this.db
      .insert(schema.vendors)
      .values({
        vendorId: dto.vendor_id,
        name: dto.name,
        companyName: dto.company_name,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        category: dto.category,
        status: dto.status || 'active',
        address: dto.address,
        notes: dto.notes,
      })
      .returning();

    return { vendor };
  }

  async getVendor(id: number) {
    const [vendor] = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id));

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return { vendor };
  }

  async updateVendor(id: number, dto: any) {
    const [vendor] = await this.db
      .update(schema.vendors)
      .set({
        vendorId: dto.vendor_id,
        name: dto.name,
        companyName: dto.company_name,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        category: dto.category,
        status: dto.status,
        address: dto.address,
        notes: dto.notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.vendors.id, id))
      .returning();

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return { vendor };
  }

  async deleteVendor(id: number) {
    const [deleted] = await this.db
      .delete(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .returning({ id: schema.vendors.id });

    if (!deleted) {
      throw new NotFoundException('Vendor not found');
    }

    return { message: 'Vendor deleted successfully' };
  }

  // Vendor Contacts
  async listVendorContacts(vendorId: number) {
    const contacts = await this.db
      .select()
      .from(schema.vendorContacts)
      .where(eq(schema.vendorContacts.vendorId, vendorId))
      .orderBy(desc(schema.vendorContacts.createdAt));

    return { contacts };
  }

  async createVendorContact(vendorId: number, dto: any) {
    const [contact] = await this.db
      .insert(schema.vendorContacts)
      .values({
        vendorId: vendorId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        notes: dto.notes,
      })
      .returning();

    return { contact };
  }

  async updateVendorContact(vendorId: number, contactId: number, dto: any) {
    const [contact] = await this.db
      .update(schema.vendorContacts)
      .set({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        notes: dto.notes,
      })
      .where(
        and(
          eq(schema.vendorContacts.id, contactId),
          eq(schema.vendorContacts.vendorId, vendorId)
        )
      )
      .returning();

    if (!contact) {
      throw new NotFoundException('Vendor contact not found');
    }

    return { contact };
  }

  async deleteVendorContact(vendorId: number, contactId: number) {
    const [deleted] = await this.db
      .delete(schema.vendorContacts)
      .where(
        and(
          eq(schema.vendorContacts.id, contactId),
          eq(schema.vendorContacts.vendorId, vendorId)
        )
      )
      .returning({ id: schema.vendorContacts.id });

    if (!deleted) {
      throw new NotFoundException('Vendor contact not found');
    }

    return { message: 'Vendor contact deleted successfully' };
  }

  // Vendor Purchases
  async listVendorPurchases(vendorId: number) {
    const purchases = await this.db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.vendorId, vendorId))
      .orderBy(desc(schema.purchases.createdAt));

    return { purchases };
  }

  // Purchases
  async listPurchases(query: any = {}) {
    const { search, status, category, priority, vendor_id, date_from, date_to } = query;
    
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        ilike(schema.purchases.purchaseOrder, `%${search}%`)
      );
    }
    
    if (status) {
      whereConditions.push(eq(schema.purchases.status, status));
    }

    if (category) {
      whereConditions.push(eq(schema.purchases.category, category));
    }

    if (priority) {
      whereConditions.push(eq(schema.purchases.priority, priority));
    }

    if (vendor_id) {
      whereConditions.push(eq(schema.purchases.vendorId, parseInt(vendor_id)));
    }

    if (date_from) {
      whereConditions.push(sql`${schema.purchases.date} >= ${date_from}`);
    }

    if (date_to) {
      whereConditions.push(sql`${schema.purchases.date} <= ${date_to}`);
    }

    const purchases = await this.db
      .select({
        id: schema.purchases.id,
        purchase_order: schema.purchases.purchaseOrder,
        date: schema.purchases.date,
        vendor_id: schema.purchases.vendorId,
        vendor_name: schema.vendors.name,
        amount: schema.purchases.amount,
        status: schema.purchases.status,
        category: schema.purchases.category,
        priority: schema.purchases.priority,
        description: schema.purchases.description,
        payment_terms: schema.purchases.paymentTerms,
        delivery_date: schema.purchases.deliveryDate,
        notes: schema.purchases.notes,
        created_at: schema.purchases.createdAt,
        updated_at: schema.purchases.updatedAt,
      })
      .from(schema.purchases)
      .leftJoin(schema.vendors, eq(schema.purchases.vendorId, schema.vendors.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.purchases.createdAt));

    return { purchases };
  }

  async createPurchase(dto: any) {
    // Generate purchase order number if not provided
    if (!dto.purchase_order) {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      dto.purchase_order = `PO-${timestamp}-${randomNum}`;
    }

    // Verify vendor exists if vendor_id is provided
    if (dto.vendor_id) {
      const [vendor] = await this.db
        .select({ id: schema.vendors.id })
        .from(schema.vendors)
        .where(eq(schema.vendors.id, dto.vendor_id));
      
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    const [purchase] = await this.db
      .insert(schema.purchases)
      .values({
        purchaseOrder: dto.purchase_order,
        date: dto.date || new Date().toISOString().split('T')[0],
        vendorId: dto.vendor_id,
        amount: dto.amount || 0,
        status: dto.status || 'pending',
        category: dto.category,
        priority: dto.priority || 'medium',
        description: dto.description,
        paymentTerms: dto.payment_terms,
        deliveryDate: dto.delivery_date,
        notes: dto.notes,
      })
      .returning();

    return { purchase };
  }

  async getPurchase(id: number) {
    const [purchase] = await this.db
      .select({
        id: schema.purchases.id,
        purchase_order: schema.purchases.purchaseOrder,
        date: schema.purchases.date,
        vendor_id: schema.purchases.vendorId,
        vendor_name: schema.vendors.name,
        vendor_company: schema.vendors.companyName,
        vendor_email: schema.vendors.email,
        vendor_phone: schema.vendors.phone,
        amount: schema.purchases.amount,
        status: schema.purchases.status,
        category: schema.purchases.category,
        priority: schema.purchases.priority,
        description: schema.purchases.description,
        payment_terms: schema.purchases.paymentTerms,
        delivery_date: schema.purchases.deliveryDate,
        notes: schema.purchases.notes,
        created_at: schema.purchases.createdAt,
        updated_at: schema.purchases.updatedAt,
      })
      .from(schema.purchases)
      .leftJoin(schema.vendors, eq(schema.purchases.vendorId, schema.vendors.id))
      .where(eq(schema.purchases.id, id));

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return { purchase };
  }

  async updatePurchase(id: number, dto: any) {
    // Verify vendor exists if vendor_id is being updated
    if (dto.vendor_id) {
      const [vendor] = await this.db
        .select({ id: schema.vendors.id })
        .from(schema.vendors)
        .where(eq(schema.vendors.id, dto.vendor_id));
      
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    const [purchase] = await this.db
      .update(schema.purchases)
      .set({
        purchaseOrder: dto.purchase_order,
        date: dto.date,
        vendorId: dto.vendor_id,
        amount: dto.amount,
        status: dto.status,
        category: dto.category,
        priority: dto.priority,
        description: dto.description,
        paymentTerms: dto.payment_terms,
        deliveryDate: dto.delivery_date,
        notes: dto.notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.purchases.id, id))
      .returning();

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return { purchase };
  }

  async deletePurchase(id: number) {
    const [deleted] = await this.db
      .delete(schema.purchases)
      .where(eq(schema.purchases.id, id))
      .returning({ id: schema.purchases.id });

    if (!deleted) {
      throw new NotFoundException('Purchase not found');
    }

    return { message: 'Purchase deleted successfully' };
  }

  // Purchase Items
  async listPurchaseItems(purchaseId: number) {
    const items = await this.db
      .select()
      .from(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, purchaseId))
      .orderBy(desc(schema.purchaseItems.createdAt));

    return { items };
  }

  async createPurchaseItem(purchaseId: number, dto: any) {
    const [item] = await this.db
      .insert(schema.purchaseItems)
      .values({
        purchaseId: purchaseId,
        name: dto.item_name || dto.name,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unit_price,
        notes: dto.notes,
      })
      .returning();

    // Update total purchase amount
    await this.updatePurchaseTotal(purchaseId);

    return { item };
  }

  async updatePurchaseItem(purchaseId: number, itemId: number, dto: any) {
    const [item] = await this.db
      .update(schema.purchaseItems)
      .set({
        name: dto.item_name || dto.name,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unit_price,
        notes: dto.notes,
      })
      .where(
        and(
          eq(schema.purchaseItems.id, itemId),
          eq(schema.purchaseItems.purchaseId, purchaseId)
        )
      )
      .returning();

    if (!item) {
      throw new NotFoundException('Purchase item not found');
    }

    // Update total purchase amount
    await this.updatePurchaseTotal(purchaseId);

    return { item };
  }

  async deletePurchaseItem(purchaseId: number, itemId: number) {
    const [deleted] = await this.db
      .delete(schema.purchaseItems)
      .where(
        and(
          eq(schema.purchaseItems.id, itemId),
          eq(schema.purchaseItems.purchaseId, purchaseId)
        )
      )
      .returning({ id: schema.purchaseItems.id });

    if (!deleted) {
      throw new NotFoundException('Purchase item not found');
    }

    // Update total purchase amount
    await this.updatePurchaseTotal(purchaseId);

    return { message: 'Purchase item deleted successfully' };
  }

  // Purchase Documents
  async listPurchaseDocuments(purchaseId: number) {
    const documents = await this.db
      .select()
      .from(schema.purchaseDocuments)
      .where(eq(schema.purchaseDocuments.purchaseId, purchaseId))
      .orderBy(desc(schema.purchaseDocuments.uploadedAt));

    return { documents };
  }

  async createPurchaseDocument(purchaseId: number, dto: any) {
    const [document] = await this.db
      .insert(schema.purchaseDocuments)
      .values({
        purchaseId: purchaseId,
        fileName: dto.file_name,
        filePath: dto.file_path,
        fileSize: dto.file_size,
        mimeType: dto.mime_type,
      })
      .returning();

    return { document };
  }

  async deletePurchaseDocument(purchaseId: number, documentId: number) {
    const [deleted] = await this.db
      .delete(schema.purchaseDocuments)
      .where(
        and(
          eq(schema.purchaseDocuments.id, documentId),
          eq(schema.purchaseDocuments.purchaseId, purchaseId)
        )
      )
      .returning({ id: schema.purchaseDocuments.id });

    if (!deleted) {
      throw new NotFoundException('Purchase document not found');
    }

    return { message: 'Purchase document deleted successfully' };
  }

  // Purchase Statistics
  async getPurchaseStatistics(query: any = {}) {
    const { date_from, date_to, vendor_id } = query;

    let whereConditions = [];

    if (date_from) {
      whereConditions.push(sql`${schema.purchases.date} >= ${date_from}`);
    }

    if (date_to) {
      whereConditions.push(sql`${schema.purchases.date} <= ${date_to}`);
    }

    if (vendor_id) {
      whereConditions.push(eq(schema.purchases.vendorId, parseInt(vendor_id)));
    }

    // Total purchases and amount
    const [totalStats] = await this.db
      .select({
        total_purchases: count(schema.purchases.id),
        total_amount: sql<number>`COALESCE(SUM(${schema.purchases.amount}), 0)`,
      })
      .from(schema.purchases)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Status breakdown
    const statusBreakdown = await this.db
      .select({
        status: schema.purchases.status,
        count: count(schema.purchases.id),
        amount: sql<number>`COALESCE(SUM(${schema.purchases.amount}), 0)`,
      })
      .from(schema.purchases)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(schema.purchases.status);

    return {
      total_purchases: totalStats.total_purchases,
      total_amount: totalStats.total_amount,
      status_breakdown: statusBreakdown,
    };
  }

  // Helper method to update purchase total amount
  private async updatePurchaseTotal(purchaseId: number) {
    const [totalResult] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.purchaseItems.quantity} * ${schema.purchaseItems.unitPrice}), 0)`,
      })
      .from(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, purchaseId));

    await this.db
      .update(schema.purchases)
      .set({
        amount: totalResult.total,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.purchases.id, purchaseId));
  }
}
