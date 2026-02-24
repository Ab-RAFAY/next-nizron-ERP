import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.roles);
  }

  async findOne(id: number) {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id));
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, createRoleDto.name));
    
    if (existing.length > 0) {
      throw new ConflictException(`Role with name "${createRoleDto.name}" already exists`);
    }

    const [id] = await this.db
      .insert(schema.roles)
      .values({
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions || [],
      })
      .returning({ id: schema.roles.id });

    return this.findOne(id.id);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);

    await this.db
      .update(schema.roles)
      .set({
        ...updateRoleDto,
      })
      .where(eq(schema.roles.id, id));

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    
    // Check if any employees are using this role
    const employeesUsingRole = await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.role_id, id))
      .limit(1);

    if (employeesUsingRole.length > 0) {
      throw new ConflictException('Cannot delete role that is assigned to employees');
    }

    await this.db.delete(schema.roles).where(eq(schema.roles.id, id));
    return { message: 'Role deleted successfully' };
  }
}
