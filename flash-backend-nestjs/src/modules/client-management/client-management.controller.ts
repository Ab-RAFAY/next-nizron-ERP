import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientManagementService } from './client-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UPLOAD_PATHS,
  getFileInterceptorOptions,
} from '../../common/utils/upload.config';

@ApiTags('Client Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client-management')
export class ClientManagementController {
  constructor(private readonly service: ClientManagementService) {}

  // Clients
  @Get('clients')
  @ApiOperation({ summary: 'List clients' })
  async listClients() {
    return this.service.listClients();
  }

  @Post('clients')
  @ApiOperation({ summary: 'Create client' })
  async createClient(@Body() dto: any) {
    return this.service.createClient(dto);
  }

  @Get('clients/:client_id')
  @ApiOperation({ summary: 'Get client' })
  async getClient(@Param('client_id', ParseIntPipe) id: number) {
    return this.service.getClient(id);
  }

  @Put('clients/:client_id')
  @ApiOperation({ summary: 'Update client' })
  async updateClient(
    @Param('client_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateClient(id, dto);
  }

  @Delete('clients/:client_id')
  @ApiOperation({ summary: 'Delete client' })
  async deleteClient(@Param('client_id', ParseIntPipe) id: number) {
    return this.service.deleteClient(id);
  }

  // Contacts
  @Get('clients/:client_id/contacts')
  async listContacts(@Param('client_id', ParseIntPipe) clientId: number) {
    return this.service.listContacts(clientId);
  }

  @Post('clients/:client_id/contacts')
  async createContact(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Body() dto: any,
  ) {
    return this.service.createContact(clientId, dto);
  }

  @Put('clients/:client_id/contacts/:contact_id')
  async updateContact(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('contact_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateContact(clientId, id, dto);
  }

  @Delete('clients/:client_id/contacts/:contact_id')
  async deleteContact(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('contact_id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteContact(clientId, id);
  }

  // Addresses
  @Get('clients/:client_id/addresses')
  async listAddresses(@Param('client_id', ParseIntPipe) clientId: number) {
    return this.service.listAddresses(clientId);
  }

  @Post('clients/:client_id/addresses')
  async createAddress(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Body() dto: any,
  ) {
    return this.service.createAddress(clientId, dto);
  }

  @Put('clients/:client_id/addresses/:address_id')
  async updateAddress(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('address_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateAddress(clientId, id, dto);
  }

  @Delete('clients/:client_id/addresses/:address_id')
  async deleteAddress(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('address_id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteAddress(clientId, id);
  }

  // Sites
  @Get('clients/:client_id/sites')
  async listSites(@Param('client_id', ParseIntPipe) clientId: number) {
    return this.service.listSites(clientId);
  }

  @Post('clients/:client_id/sites')
  async createSite(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Body() dto: any,
  ) {
    return this.service.createSite(clientId, dto);
  }

  @Put('clients/:client_id/sites/:site_id')
  async updateSite(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('site_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateSite(clientId, id, dto);
  }

  @Delete('clients/:client_id/sites/:site_id')
  async deleteSite(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('site_id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteSite(clientId, id);
  }

  // Contracts
  @Get('clients/:client_id/contracts')
  async listContracts(@Param('client_id', ParseIntPipe) clientId: number) {
    return this.service.listContracts(clientId);
  }

  @Post('clients/:client_id/contracts')
  async createContract(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Body() dto: any,
  ) {
    return this.service.createContract(clientId, dto);
  }

  @Put('clients/:client_id/contracts/:contract_id')
  async updateContract(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('contract_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateContract(clientId, id, dto);
  }

  @Delete('clients/:client_id/contracts/:contract_id')
  async deleteContract(
    @Param('client_id', ParseIntPipe) clientId: number,
    @Param('contract_id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteContract(clientId, id);
  }

  // Contract Documents
  @Post('contracts/:contract_id/documents')
  @ApiOperation({ summary: 'Upload contract document' })
  @UseInterceptors(
    FileInterceptor(
      'file',
      getFileInterceptorOptions(UPLOAD_PATHS.CLIENTS.CONTRACTS),
    ),
  )
  async uploadContractDocument(
    @Param('contract_id', ParseIntPipe) contractId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadContractDocument(contractId, file);
  }

  @Get('contracts/:contract_id/documents')
  @ApiOperation({ summary: 'List contract documents' })
  async listContractDocuments(
    @Param('contract_id', ParseIntPipe) contractId: number,
  ) {
    return this.service.listContractDocuments(contractId);
  }

  @Delete('contracts/:contract_id/documents/:document_id')
  @ApiOperation({ summary: 'Delete contract document' })
  async deleteContractDocument(
    @Param('contract_id', ParseIntPipe) contractId: number,
    @Param('document_id', ParseIntPipe) documentId: number,
  ) {
    return this.service.deleteContractDocument(contractId, documentId);
  }

  // Guard Assignments
  @Post('sites/:site_id/guards')
  @ApiOperation({ summary: 'Assign guard to site' })
  async assignGuard(
    @Param('site_id', ParseIntPipe) siteId: number,
    @Body() dto: any,
  ) {
    return this.service.assignGuard(siteId, dto);
  }

  @Get('sites/:site_id/guards')
  @ApiOperation({ summary: 'List site guards' })
  async listSiteGuards(@Param('site_id', ParseIntPipe) siteId: number) {
    return this.service.listSiteGuards(siteId);
  }

  @Put('sites/:site_id/guards/:assignment_id/eject')
  @ApiOperation({ summary: 'Eject guard from site' })
  async ejectGuard(
    @Param('site_id', ParseIntPipe) siteId: number,
    @Param('assignment_id', ParseIntPipe) assignmentId: number,
    @Body() dto: any,
  ) {
    return this.service.ejectGuard(siteId, assignmentId, dto);
  }

  @Get('assignments/active')
  @ApiOperation({ summary: 'List all active guard assignments with client info' })
  async getActiveAssignments() {
    return this.service.listAllActiveAssignments();
  }

  @Get('guards/available')
  @ApiOperation({ summary: 'Get available guards' })
  async getAvailableGuards() {
    return this.service.getAvailableGuards();
  }

  // Industries
  @Get('industries')
  @ApiOperation({ summary: 'List industries' })
  async listIndustries() {
    return this.service.listIndustries();
  }

  @Post('industries')
  @ApiOperation({ summary: 'Create industry' })
  async createIndustry(@Body() dto: any) {
    return this.service.createIndustry(dto);
  }

  @Put('industries/:id')
  @ApiOperation({ summary: 'Update industry' })
  async updateIndustry(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updateIndustry(id, dto);
  }

  @Delete('industries/:id')
  @ApiOperation({ summary: 'Delete industry' })
  async deleteIndustry(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteIndustry(id);
  }

  // Complaints
  @Get('complaints')
  @ApiOperation({ summary: 'List all client complaints' })
  async listAllComplaints() {
    return this.service.listAllComplaints();
  }

  @Put('complaints/:id')
  @ApiOperation({ summary: 'Update complaint status/feedback' })
  async updateComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateComplaint(id, dto);
  }

  @Delete('complaints/:id')
  @ApiOperation({ summary: 'Delete complaint' })
  async deleteComplaint(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteComplaint(id);
  }

  @Get('debug-complaints')
  async debugComplaints() {
    try {
      return await this.service.listAllComplaints();
    } catch (e) {
      console.error('DEBUG COMPLAINTS ERROR:', e);
      return { error: e.message, stack: e.stack };
    }
  }

  // Vendors
  @Get('vendors')
  @ApiOperation({ summary: 'List vendors' })
  async listVendors() {
    return this.service.listVendors();
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Create vendor' })
  async createVendor(@Body() dto: any) {
    return this.service.createVendor(dto);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor' })
  async getVendor(@Param('id', ParseIntPipe) id: number) {
    return this.service.getVendor(id);
  }

  @Put('vendors/:id')
  @ApiOperation({ summary: 'Update vendor' })
  async updateVendor(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  @ApiOperation({ summary: 'Delete vendor' })
  async deleteVendor(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteVendor(id);
  }

  // Vendor Contacts
  @Get('vendors/:id/contacts')
  @ApiOperation({ summary: 'List vendor contacts' })
  async listVendorContacts(@Param('id', ParseIntPipe) vendorId: number) {
    return this.service.listVendorContacts(vendorId);
  }

  @Post('vendors/:id/contacts')
  @ApiOperation({ summary: 'Create vendor contact' })
  async createVendorContact(@Param('id', ParseIntPipe) vendorId: number, @Body() dto: any) {
    return this.service.createVendorContact(vendorId, dto);
  }

  @Put('vendors/:vendorId/contacts/:contactId')
  @ApiOperation({ summary: 'Update vendor contact' })
  async updateVendorContact(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() dto: any,
  ) {
    return this.service.updateVendorContact(vendorId, contactId, dto);
  }

  @Delete('vendors/:vendorId/contacts/:contactId')
  @ApiOperation({ summary: 'Delete vendor contact' })
  async deleteVendorContact(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    return this.service.deleteVendorContact(vendorId, contactId);
  }

  // Vendor Purchases
  @Get('vendors/:id/purchases')
  @ApiOperation({ summary: 'List vendor purchases' })
  async listVendorPurchases(@Param('id', ParseIntPipe) vendorId: number) {
    return this.service.listVendorPurchases(vendorId);
  }

  // Purchases
  @Get('purchases')
  @ApiOperation({ summary: 'List purchases' })
  async listPurchases() {
    return this.service.listPurchases();
  }

  @Post('purchases')
  @ApiOperation({ summary: 'Create purchase' })
  async createPurchase(@Body() dto: any) {
    return this.service.createPurchase(dto);
  }

  @Get('purchases/:id')
  @ApiOperation({ summary: 'Get purchase' })
  async getPurchase(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPurchase(id);
  }

  @Put('purchases/:id')
  @ApiOperation({ summary: 'Update purchase' })
  async updatePurchase(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updatePurchase(id, dto);
  }

  @Delete('purchases/:id')
  @ApiOperation({ summary: 'Delete purchase' })
  async deletePurchase(@Param('id', ParseIntPipe) id: number) {
    return this.service.deletePurchase(id);
  }

  // Purchase Items
  @Get('purchases/:id/items')
  @ApiOperation({ summary: 'List purchase items' })
  async listPurchaseItems(@Param('id', ParseIntPipe) purchaseId: number) {
    return this.service.listPurchaseItems(purchaseId);
  }

  @Post('purchases/:id/items')
  @ApiOperation({ summary: 'Create purchase item' })
  async createPurchaseItem(@Param('id', ParseIntPipe) purchaseId: number, @Body() dto: any) {
    return this.service.createPurchaseItem(purchaseId, dto);
  }

  @Put('purchases/:purchaseId/items/:itemId')
  @ApiOperation({ summary: 'Update purchase item' })
  async updatePurchaseItem(
    @Param('purchaseId', ParseIntPipe) purchaseId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: any,
  ) {
    return this.service.updatePurchaseItem(purchaseId, itemId, dto);
  }

  @Delete('purchases/:purchaseId/items/:itemId')
  @ApiOperation({ summary: 'Delete purchase item' })
  async deletePurchaseItem(
    @Param('purchaseId', ParseIntPipe) purchaseId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.service.deletePurchaseItem(purchaseId, itemId);
  }

  // Purchase Documents
  @Get('purchases/:id/documents')
  @ApiOperation({ summary: 'List purchase documents' })
  async listPurchaseDocuments(@Param('id', ParseIntPipe) purchaseId: number) {
    return this.service.listPurchaseDocuments(purchaseId);
  }

  @Post('purchases/:id/documents')
  @ApiOperation({ summary: 'Create purchase document' })
  async createPurchaseDocument(@Param('id', ParseIntPipe) purchaseId: number, @Body() dto: any) {
    return this.service.createPurchaseDocument(purchaseId, dto);
  }

  @Delete('purchases/:purchaseId/documents/:documentId')
  @ApiOperation({ summary: 'Delete purchase document' })
  async deletePurchaseDocument(
    @Param('purchaseId', ParseIntPipe) purchaseId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.service.deletePurchaseDocument(purchaseId, documentId);
  }

  // Purchase Statistics
  @Get('purchases/statistics')
  @ApiOperation({ summary: 'Get purchase statistics' })
  async getPurchaseStatistics() {
    return this.service.getPurchaseStatistics();
  }
}
