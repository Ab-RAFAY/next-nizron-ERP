import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, desc, eq, asc, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../auth/auth.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly usersService: UsersService,
  ) {}

  async assertChatAccess(user: JwtPayload): Promise<{ type: 'user' | 'employee'; numericId: number }> {
    // Admin users
    if (!user.type || user.type === 'user') {
      const fullUser = await this.usersService.findOne(user.sub);
      const permissions = (fullUser as any).permissions || [];
      const isSuperuser = (fullUser as any).is_superuser || (fullUser as any).is_admin;
      if (!isSuperuser && !permissions.includes('chat')) {
        throw new ForbiddenException('Chat permission required');
      }
      return { type: 'user', numericId: (fullUser as any).id };
    }

    // Employees with chat permission
    if (user.type === 'employee') {
      const [employee] = await this.db
        .select({ id: schema.employees.id, role_id: schema.employees.role_id })
        .from(schema.employees)
        .where(eq(schema.employees.employee_id, String(user.sub)))
        .limit(1);
      if (!employee) throw new ForbiddenException('Employee not found');

      if (employee.role_id) {
        const [role] = await this.db
          .select({ permissions: schema.roles.permissions })
          .from(schema.roles)
          .where(eq(schema.roles.id, employee.role_id))
          .limit(1);
        const perms = (role?.permissions as string[]) || [];
        if (perms.includes('chat')) {
          return { type: 'employee', numericId: employee.id };
        }
      }
      throw new ForbiddenException('Chat permission required');
    }

    throw new ForbiddenException('Unauthorized');
  }

  // Keep backward compat alias
  async assertAdminChatAccess(user: JwtPayload) {
    return this.assertChatAccess(user);
  }

  async getOrCreateThreadForClient(clientId: number, targetEmployeeId: number) {
    const findThread = () =>
      this.db
        .select()
        .from(schema.chat_threads)
        .where(
          and(
            eq(schema.chat_threads.client_id, clientId),
            eq(schema.chat_threads.target_employee_id, targetEmployeeId),
          ),
        )
        .limit(1);

    const [existing] = await findThread();
    if (existing) {
      return existing;
    }

    try {
      const [created] = await this.db
        .insert(schema.chat_threads)
        .values({
          client_id: clientId,
          target_employee_id: targetEmployeeId,
          last_message_at: new Date(),
        })
        .returning();
      return created;
    } catch {
      // Race condition: another request already created this thread
      const [reFetched] = await findThread();
      if (reFetched) return reFetched;
      throw new Error('Failed to create or find chat thread');
    }
  }

  /** Get or create a direct admin↔client thread (no employee) */
  async getOrCreateDirectThread(clientId: number) {
    const findThread = () =>
      this.db
        .select()
        .from(schema.chat_threads)
        .where(
          and(
            eq(schema.chat_threads.client_id, clientId),
            sql`${schema.chat_threads.target_employee_id} IS NULL`,
          ),
        )
        .limit(1);

    const [existing] = await findThread();
    if (existing) return existing;

    try {
      const [created] = await this.db
        .insert(schema.chat_threads)
        .values({
          client_id: clientId,
          target_employee_id: null as any,
          last_message_at: new Date(),
        })
        .returning();
      return created;
    } catch {
      const [reFetched] = await findThread();
      if (reFetched) return reFetched;
      throw new Error('Failed to create or find direct chat thread');
    }
  }

  /** Get messages for a direct admin↔client thread */
  async getDirectClientMessages(clientId: number) {
    const thread = await this.getOrCreateDirectThread(clientId);
    const messages = await this.db
      .select()
      .from(schema.chat_messages)
      .where(eq(schema.chat_messages.thread_id, thread.id))
      .orderBy(asc(schema.chat_messages.created_at));
    return { thread, messages };
  }

  /** Client sends a direct message to admin */
  async sendDirectClientMessage(clientId: number, message: string) {
    const thread = await this.getOrCreateDirectThread(clientId);
    const [created] = await this.db
      .insert(schema.chat_messages)
      .values({
        thread_id: thread.id,
        sender_type: 'client',
        sender_id: clientId,
        message,
      })
      .returning();

    await this.db
      .update(schema.chat_threads)
      .set({
        last_message: message,
        last_message_sender: 'client',
        last_message_at: new Date(),
        is_read_by_admin: false,
        is_read_by_client: true,
        updated_at: new Date(),
      })
      .where(eq(schema.chat_threads.id, thread.id));
    return created;
  }

  /** Mark direct thread as read by client */
  async markDirectReadByClient(clientId: number) {
    const thread = await this.getOrCreateDirectThread(clientId);
    await this.db
      .update(schema.chat_threads)
      .set({ is_read_by_client: true, updated_at: new Date() })
      .where(eq(schema.chat_threads.id, thread.id));
    return { success: true };
  }

  /** List all clients for admin chat sidebar */
  async listAllClients() {
    return this.db
      .select({
        id: schema.clients.id,
        name: schema.clients.name,
        company_name: schema.clients.company_name,
        email: schema.clients.email,
      })
      .from(schema.clients)
      .orderBy(asc(schema.clients.company_name));
  }

  /** List direct (admin↔client) threads only */
  async listDirectThreads() {
    return this.db
      .select({
        id: schema.chat_threads.id,
        client_id: schema.chat_threads.client_id,
        client_name: schema.clients.name,
        client_company_name: schema.clients.company_name,
        client_email: schema.clients.email,
        last_message: schema.chat_threads.last_message,
        last_message_sender: schema.chat_threads.last_message_sender,
        last_message_at: schema.chat_threads.last_message_at,
        is_read_by_admin: schema.chat_threads.is_read_by_admin,
        is_read_by_client: schema.chat_threads.is_read_by_client,
      })
      .from(schema.chat_threads)
      .leftJoin(schema.clients, eq(schema.chat_threads.client_id, schema.clients.id))
      .where(sql`${schema.chat_threads.target_employee_id} IS NULL`)
      .orderBy(desc(schema.chat_threads.last_message_at));
  }

  /** Admin starts / gets direct thread with a client, then sends message */
  async sendDirectAdminMessage(senderId: number, clientId: number, message: string) {
    const thread = await this.getOrCreateDirectThread(clientId);
    const [created] = await this.db
      .insert(schema.chat_messages)
      .values({
        thread_id: thread.id,
        sender_type: 'user',
        sender_id: senderId,
        message,
      })
      .returning();

    await this.db
      .update(schema.chat_threads)
      .set({
        last_message: message,
        last_message_sender: 'user',
        last_message_at: new Date(),
        is_read_by_admin: true,
        is_read_by_client: false,
        updated_at: new Date(),
      })
      .where(eq(schema.chat_threads.id, thread.id));
    return created;
  }

  async listThreads() {
    return this.db
      .select({
        id: schema.chat_threads.id,
        client_id: schema.chat_threads.client_id,
        target_employee_id: schema.chat_threads.target_employee_id,
        client_name: schema.clients.name,
        client_company_name: schema.clients.company_name,
        client_email: schema.clients.email,
        employee_name: schema.employees.full_name,
        last_message: schema.chat_threads.last_message,
        last_message_sender: schema.chat_threads.last_message_sender,
        last_message_at: schema.chat_threads.last_message_at,
        is_read_by_admin: schema.chat_threads.is_read_by_admin,
        is_read_by_client: schema.chat_threads.is_read_by_client,
        updated_at: schema.chat_threads.updated_at,
      })
      .from(schema.chat_threads)
      .leftJoin(schema.clients, eq(schema.chat_threads.client_id, schema.clients.id))
      .leftJoin(schema.employees, eq(schema.chat_threads.target_employee_id, schema.employees.id))
      .orderBy(desc(schema.chat_threads.last_message_at));
  }

  async listThreadsForEmployee(employeeNumericId: number) {
    return this.db
      .select({
        id: schema.chat_threads.id,
        client_id: schema.chat_threads.client_id,
        target_employee_id: schema.chat_threads.target_employee_id,
        client_name: schema.clients.name,
        client_company_name: schema.clients.company_name,
        client_email: schema.clients.email,
        employee_name: schema.employees.full_name,
        last_message: schema.chat_threads.last_message,
        last_message_sender: schema.chat_threads.last_message_sender,
        last_message_at: schema.chat_threads.last_message_at,
        is_read_by_admin: schema.chat_threads.is_read_by_admin,
        is_read_by_client: schema.chat_threads.is_read_by_client,
        updated_at: schema.chat_threads.updated_at,
      })
      .from(schema.chat_threads)
      .leftJoin(schema.clients, eq(schema.chat_threads.client_id, schema.clients.id))
      .leftJoin(schema.employees, eq(schema.chat_threads.target_employee_id, schema.employees.id))
      .where(eq(schema.chat_threads.target_employee_id, employeeNumericId))
      .orderBy(desc(schema.chat_threads.last_message_at));
  }

  async ensureEmployeeThreadAccess(employeeNumericId: number, threadId: number) {
    const [thread] = await this.db
      .select()
      .from(schema.chat_threads)
      .where(
        and(
          eq(schema.chat_threads.id, threadId),
          eq(schema.chat_threads.target_employee_id, employeeNumericId),
        ),
      )
      .limit(1);
    if (!thread) throw new ForbiddenException('Thread access denied');
    return thread;
  }

  async getThreadMessages(threadId: number) {
    const [thread] = await this.db
      .select()
      .from(schema.chat_threads)
      .where(eq(schema.chat_threads.id, threadId))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Chat thread not found');
    }

    const messages = await this.db
      .select()
      .from(schema.chat_messages)
      .where(eq(schema.chat_messages.thread_id, threadId))
      .orderBy(asc(schema.chat_messages.created_at));

    return { thread, messages };
  }

  async getClientMessages(clientId: number, targetEmployeeId: number) {
    const thread = await this.getOrCreateThreadForClient(clientId, targetEmployeeId);

    const messages = await this.db
      .select()
      .from(schema.chat_messages)
      .where(eq(schema.chat_messages.thread_id, thread.id))
      .orderBy(asc(schema.chat_messages.created_at));

    return { thread, messages };
  }

  async sendClientMessage(clientId: number, targetEmployeeId: number, message: string) {
    const thread = await this.getOrCreateThreadForClient(clientId, targetEmployeeId);

    const [created] = await this.db
      .insert(schema.chat_messages)
      .values({
        thread_id: thread.id,
        sender_type: 'client',
        sender_id: clientId,
        message,
      })
      .returning();

    await this.db
      .update(schema.chat_threads)
      .set({
        last_message: message,
        last_message_sender: 'client',
        last_message_at: new Date(),
        is_read_by_admin: false,
        is_read_by_client: true,
        updated_at: new Date(),
      })
      .where(eq(schema.chat_threads.id, thread.id));

    return created;
  }

  async sendAdminMessage(senderId: number, threadId: number, message: string, senderType: 'user' | 'employee' = 'user') {
    const [thread] = await this.db
      .select()
      .from(schema.chat_threads)
      .where(eq(schema.chat_threads.id, threadId))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Chat thread not found');
    }

    const [created] = await this.db
      .insert(schema.chat_messages)
      .values({
        thread_id: threadId,
        sender_type: senderType,
        sender_id: senderId,
        message,
      })
      .returning();

    await this.db
      .update(schema.chat_threads)
      .set({
        last_message: message,
        last_message_sender: 'user',
        last_message_at: new Date(),
        is_read_by_admin: true,
        is_read_by_client: false,
        updated_at: new Date(),
      })
      .where(eq(schema.chat_threads.id, threadId));

    return created;
  }

  // ─── Mark-as-read methods ───────────────────────────────────

  async markReadByAdmin(threadId: number) {
    const [thread] = await this.db
      .select()
      .from(schema.chat_threads)
      .where(eq(schema.chat_threads.id, threadId))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Chat thread not found');
    }

    await this.db
      .update(schema.chat_threads)
      .set({ is_read_by_admin: true, updated_at: new Date() })
      .where(eq(schema.chat_threads.id, threadId));

    return { success: true };
  }

  async markReadByClient(clientId: number, targetEmployeeId: number) {
    const thread = await this.getOrCreateThreadForClient(clientId, targetEmployeeId);

    await this.db
      .update(schema.chat_threads)
      .set({ is_read_by_client: true, updated_at: new Date() })
      .where(eq(schema.chat_threads.id, thread.id));

    return { success: true };
  }

  async getTeamMembers() {
    // Get employees whose role has 'chat' permission
    const rows = await this.db
      .select({
        id: schema.employees.id,
        employee_id: schema.employees.employee_id,
        full_name: schema.employees.full_name,
        email: schema.employees.email,
        phone: schema.employees.phone,
        designation: schema.employees.designation,
        role_name: schema.roles.name,
        permissions: schema.roles.permissions,
        status: schema.employees.status,
      })
      .from(schema.employees)
      .leftJoin(schema.roles, eq(schema.employees.role_id, schema.roles.id))
      .where(eq(schema.employees.status, 'Active'));

    // Filter: only employees whose role includes 'chat' permission
    return rows
      .filter((emp) => {
        const perms = (emp.permissions as string[]) || [];
        return perms.includes('chat');
      })
      .map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        full_name: emp.full_name || emp.employee_id,
        email: emp.email || '',
        phone: emp.phone || '',
        designation: emp.designation || '',
        role: emp.role_name || 'Team Member',
      }));
  }

  async ensureClientThreadAccess(clientId: number, threadId: number) {
    const [thread] = await this.db
      .select()
      .from(schema.chat_threads)
      .where(
        and(
          eq(schema.chat_threads.id, threadId),
          eq(schema.chat_threads.client_id, clientId),
        ),
      )
      .limit(1);

    if (!thread) {
      throw new ForbiddenException('Chat thread access denied');
    }

    return thread;
  }
}
