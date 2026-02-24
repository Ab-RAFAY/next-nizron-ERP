import { Controller, Get, Post, UseGuards, Inject, Query, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, and, sql, or } from 'drizzle-orm';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('client-portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client-portal')
export class ClientPortalController {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  @Get('sites')
  @ApiOperation({ summary: 'Get all sites for the logged-in client' })
  async getSites(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    return this.db
      .select()
      .from(schema.client_sites)
      .where(eq(schema.client_sites.client_id, user.sub));
  }

  @Get('guards')
  @ApiOperation({ summary: 'Get all guards assigned to the client\'s sites' })
  async getGuards(
    @CurrentUser() user: JwtPayload,
    @Query('site_id') siteId?: string
  ) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    // 1. Get client sites to verify ownership
    const clientSites = await this.db
      .select({ id: schema.client_sites.id })
      .from(schema.client_sites)
      .where(eq(schema.client_sites.client_id, user.sub));

    if (clientSites.length === 0) return [];

    const siteIds = clientSites.map(s => s.id);
    
    // Filter by siteId if provided and ensure it belongs to the client
    const targetSiteIds = siteId && siteIds.includes(parseInt(siteId)) 
      ? [parseInt(siteId)] 
      : siteIds;

    // 2. Get assignments for these sites
    const assignments = await this.db
      .select({
        employee_id: schema.site_guard_assignments.employee_id,
        site_id: schema.site_guard_assignments.site_id,
        shift: schema.site_guard_assignments.shift,
        status: schema.site_guard_assignments.status,
      })
      .from(schema.site_guard_assignments)
      .where(
        and(
          inArray(schema.site_guard_assignments.site_id, targetSiteIds),
          eq(schema.site_guard_assignments.status, 'active')
        )
      );

    if (assignments.length === 0) return [];

    const employeeIds = assignments.map(a => a.employee_id);

    // 3. Get employee details
    const guards = await this.db
      .select()
      .from(schema.employees)
      .where(inArray(schema.employees.employee_id, employeeIds));

    // Join with assignment info
    return guards.map(guard => {
      const assignment = assignments.find(a => a.employee_id === guard.employee_id);
      return {
        ...guard,
        assignment_info: assignment
      };
    });
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance for guards assigned to client sites' })
  async getAttendance(
    @CurrentUser() user: JwtPayload,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string
  ) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    // 1. Get client sites
    const clientSites = await this.db
      .select({ id: schema.client_sites.id })
      .from(schema.client_sites)
      .where(eq(schema.client_sites.client_id, user.sub));

    if (clientSites.length === 0) return [];

    const siteIds = clientSites.map(s => s.id);

    // 2. Get guards assigned to these sites
    const assignments = await this.db
      .select({ employee_id: schema.site_guard_assignments.employee_id })
      .from(schema.site_guard_assignments)
      .where(inArray(schema.site_guard_assignments.site_id, siteIds));

    if (assignments.length === 0) return [];

    const employeeIds = Array.from(new Set(assignments.map(a => a.employee_id)));

    // 3. Get attendance
    let query = this.db
      .select()
      .from(schema.attendance)
      .where(inArray(schema.attendance.employee_id, employeeIds));

    if (fromDate && toDate) {
      query = this.db
        .select()
        .from(schema.attendance)
        .where(
          and(
            inArray(schema.attendance.employee_id, employeeIds),
            sql`${schema.attendance.date} >= ${fromDate}`,
            sql`${schema.attendance.date} <= ${toDate}`
          )
        );
    }

    return query;
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get unpaid invoices for the client' })
  async getInvoices(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    const clientId = Number(user.sub);
    const [client] = await this.db
      .select({ id: schema.clients.id, client_id: schema.clients.client_id })
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId));

    const clientKey = client?.client_id ?? String(user.sub);

    return this.db
      .select()
      .from(schema.invoices)
      .where(
        or(
          eq(schema.invoices.client_id, clientKey),
          eq(schema.invoices.client_id, String(user.sub))
        )
      );
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment history for the client' })
  async getPayments(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    const clientId = Number(user.sub);
    const [client] = await this.db
      .select({ id: schema.clients.id, client_id: schema.clients.client_id })
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId));

    const clientKey = client?.client_id ?? String(user.sub);

    return this.db
      .select()
      .from(schema.client_payments)
      .where(
        or(
          eq(schema.client_payments.client_id, clientKey),
          eq(schema.client_payments.client_id, String(user.sub))
        )
      );
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Get all complaints posted by the client' })
  async getComplaints(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    return this.db
      .select()
      .from(schema.client_complaints)
      .where(eq(schema.client_complaints.client_id, user.sub));
  }

  @Post('complaints')
  @ApiOperation({ summary: 'Create a new complaint' })
  async createComplaint(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { title: string; description: string; category?: string; priority?: string }
  ) {
    if (user.type !== 'client') {
      return { error: 'Unauthorized: Not a client' };
    }

    return this.db.insert(schema.client_complaints).values({
      client_id: parseInt(user.sub),
      title: dto.title,
      description: dto.description,
      category: dto.category || 'general',
      priority: dto.priority || 'medium',
      status: 'open',
    }).returning();
  }
}
