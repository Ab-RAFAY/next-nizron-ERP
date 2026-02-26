import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── Client endpoints (per-employee threads) ───────────────

  @Get('thread')
  @ApiOperation({ summary: 'Get or create client chat thread for a specific employee' })
  @ApiQuery({ name: 'employeeId', required: true, type: Number })
  async getClientThread(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId', ParseIntPipe) employeeId: number,
  ) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.getOrCreateThreadForClient(user.sub, employeeId);
  }

  @Get('thread/messages')
  @ApiOperation({ summary: 'Get client chat messages for a specific employee' })
  @ApiQuery({ name: 'employeeId', required: true, type: Number })
  async getClientMessages(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId', ParseIntPipe) employeeId: number,
  ) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.getClientMessages(user.sub, employeeId);
  }

  @Post('thread/messages')
  @ApiOperation({ summary: 'Send client chat message to a specific employee' })
  @ApiQuery({ name: 'employeeId', required: true, type: Number })
  async sendClientMessage(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Body() dto: ChatMessageDto,
  ) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.sendClientMessage(user.sub, employeeId, dto.message);
  }

  @Patch('thread/read')
  @ApiOperation({ summary: 'Mark thread as read by client' })
  @ApiQuery({ name: 'employeeId', required: true, type: Number })
  async markReadByClient(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId', ParseIntPipe) employeeId: number,
  ) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.markReadByClient(user.sub, employeeId);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get management team members who can chat' })
  async getTeamMembers() {
    return this.chatService.getTeamMembers();
  }

  // ─── Direct admin ↔ client chat ────────────────────────────

  @Get('direct/thread')
  @ApiOperation({ summary: 'Client: get or create direct admin chat thread' })
  async getDirectThread(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.getOrCreateDirectThread(user.sub);
  }

  @Get('direct/messages')
  @ApiOperation({ summary: 'Client: get direct admin chat messages' })
  async getDirectMessages(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.getDirectClientMessages(user.sub);
  }

  @Post('direct/messages')
  @ApiOperation({ summary: 'Client: send message to admin' })
  async sendDirectMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChatMessageDto,
  ) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.sendDirectClientMessage(user.sub, dto.message);
  }

  @Patch('direct/read')
  @ApiOperation({ summary: 'Client: mark direct thread as read' })
  async markDirectRead(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'client') {
      throw new ForbiddenException('Unauthorized: Not a client');
    }
    return this.chatService.markDirectReadByClient(user.sub);
  }

  // ─── Admin endpoints: direct chat with clients ─────────────

  @Get('clients')
  @ApiOperation({ summary: 'Admin: list all clients for chat' })
  async listClients(@CurrentUser() user: JwtPayload) {
    await this.chatService.assertChatAccess(user);
    return this.chatService.listAllClients();
  }

  @Get('direct-threads')
  @ApiOperation({ summary: 'Admin: list direct admin↔client threads' })
  async listDirectThreads(@CurrentUser() user: JwtPayload) {
    await this.chatService.assertChatAccess(user);
    return this.chatService.listDirectThreads();
  }

  @Get('direct/:clientId/messages')
  @ApiOperation({ summary: 'Admin: get messages for a direct client thread' })
  @ApiParam({ name: 'clientId', type: Number })
  async getDirectClientMessages(
    @CurrentUser() user: JwtPayload,
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    await this.chatService.assertChatAccess(user);
    return this.chatService.getDirectClientMessages(clientId);
  }

  @Post('direct/:clientId/messages')
  @ApiOperation({ summary: 'Admin: send message to client' })
  @ApiParam({ name: 'clientId', type: Number })
  async sendDirectAdminMessage(
    @CurrentUser() user: JwtPayload,
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() dto: ChatMessageDto,
  ) {
    const access = await this.chatService.assertChatAccess(user);
    return this.chatService.sendDirectAdminMessage(access.numericId, clientId, dto.message);
  }

  @Patch('direct/:clientId/read')
  @ApiOperation({ summary: 'Admin: mark direct client thread as read' })
  @ApiParam({ name: 'clientId', type: Number })
  async markDirectAdminRead(
    @CurrentUser() user: JwtPayload,
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    await this.chatService.assertChatAccess(user);
    const thread = await this.chatService.getOrCreateDirectThread(clientId);
    return this.chatService.markReadByAdmin(thread.id);
  }

  // ─── Admin / management endpoints (legacy per-employee) ────

  @Get('threads')
  @ApiOperation({ summary: 'List chat threads (admin or employee with chat perm)' })
  async listThreads(@CurrentUser() user: JwtPayload) {
    const access = await this.chatService.assertChatAccess(user);
    if (access.type === 'employee') {
      return this.chatService.listThreadsForEmployee(access.numericId);
    }
    return this.chatService.listThreads();
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Get chat messages for a thread' })
  async getThreadMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const access = await this.chatService.assertChatAccess(user);
    if (access.type === 'employee') {
      await this.chatService.ensureEmployeeThreadAccess(access.numericId, id);
    }
    return this.chatService.getThreadMessages(id);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send message in a thread' })
  async sendThreadMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChatMessageDto,
  ) {
    const access = await this.chatService.assertChatAccess(user);
    if (access.type === 'employee') {
      await this.chatService.ensureEmployeeThreadAccess(access.numericId, id);
    }
    return this.chatService.sendAdminMessage(access.numericId, id, dto.message, access.type);
  }

  @Patch('threads/:id/read')
  @ApiOperation({ summary: 'Mark thread as read' })
  async markReadByAdmin(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const access = await this.chatService.assertChatAccess(user);
    if (access.type === 'employee') {
      await this.chatService.ensureEmployeeThreadAccess(access.numericId, id);
    }
    return this.chatService.markReadByAdmin(id);
  }
}
