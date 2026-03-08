import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { DRIZZLE } from '../../db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: any;
  email?: string;
  fss_no?: string;
  is_superuser?: boolean;
  type?: 'user' | 'employee' | 'employee-web' | 'client';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; token_type: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      // Fall back: check if this is an employee with a role
      const empResult = await this.tryEmployeeWebLogin(loginDto.email, loginDto.password);
      if (empResult) return empResult;
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(user as any).is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      is_superuser: (user as any).is_admin ?? false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'bearer',
    };
  }

  /**
   * Try to log in an employee (who has a role) via the web dashboard.
   * Only employees with role_id != null are allowed.
   */
  private async tryEmployeeWebLogin(
    email: string,
    password: string,
  ): Promise<{ access_token: string; token_type: string } | null> {
    // Find employee by email
    const [employee] = await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.email, email));

    if (!employee) return null;

    // Only allow employees with an assigned role
    if (!employee.role_id) return null;

    // Must have a password set
    if (!employee.password) return null;

    // Check status
    const status = (employee.status || '').toLowerCase();
    if (status !== 'active') return null;

    // Validate password
    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) return null;

    // Fetch the role to get permissions
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, employee.role_id));

    const payload: JwtPayload = {
      sub: employee.employee_id,
      email: employee.email || undefined,
      is_superuser: false,
      type: 'employee-web',
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'bearer',
    };
  }

  async validateUser(payload: JwtPayload) {
    if (payload.type === 'employee-web' || payload.type === 'employee') {
      const [employee] = await this.usersService.findEmployeeById(payload.sub);
      
      if (!employee) {
        console.warn(`Auth Failed: Employee not found for ID ${payload.sub}`);
        throw new UnauthorizedException();
      }

      // Check status case-insensitively
      const status = employee.status ? employee.status.toLowerCase() : '';
      if (status !== 'active') {
        console.warn(`Auth Failed: Employee ${payload.sub} status is '${employee.status}'`);
        throw new UnauthorizedException('Employee account is not active');
      }

      // For employee-web, verify they still have a role
      if (payload.type === 'employee-web' && !employee.role_id) {
        throw new UnauthorizedException('Employee no longer has web access');
      }

      return { ...employee, sub: employee.employee_id, type: payload.type };
    }

    if (payload.type === 'client') {
      const [client] = await this.usersService.findClientById(payload.sub);
      if (!client) {
        throw new UnauthorizedException('Client account not found');
      }
      return { ...client, sub: client.id, type: 'client' };
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user || !(user as any).is_active) {
      throw new UnauthorizedException();
    }
    return { ...user, sub: (user as any).id, type: 'user', is_superuser: (user as any).is_admin };
  }

  async getCurrentUser(payload: JwtPayload) {
    if (payload.type === 'employee-web') {
      const [employee] = await this.usersService.findEmployeeById(payload.sub);
      if (!employee) throw new UnauthorizedException('Employee not found');

      // Get role and permissions for the web dashboard
      let permissions: string[] = [];
      let roleName = '';
      if (employee.role_id) {
        const [role] = await this.db
          .select()
          .from(schema.roles)
          .where(eq(schema.roles.id, employee.role_id));
        if (role) {
          permissions = (role.permissions as string[]) || [];
          roleName = role.name;
        }
      }

      return {
        id: employee.employee_id,
        email: employee.email,
        full_name: employee.full_name,
        is_superuser: false,
        is_admin: false,
        roles: [roleName].filter(Boolean),
        permissions,
        type: 'employee-web',
      };
    }
    if (payload.type === 'employee') {
      const [employee] = await this.usersService.findEmployeeById(payload.sub);
      if (!employee) throw new UnauthorizedException('Employee not found');
      return employee;
    }
    if (payload.type === 'client') {
      const [client] = await this.usersService.findClientById(payload.sub);
      if (!client) throw new UnauthorizedException('Client not found');
      return client;
    }
    return this.usersService.findOne(payload.sub);
  }

  async getMyPermissions(userId: number) {
    return this.usersService.getUserPermissions(userId);
  }

  async getMyRoles(userId: number) {
    return this.usersService.getUserRoles(userId);
  }
}
