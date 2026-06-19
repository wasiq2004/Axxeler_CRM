import BaseApi from './baseApi';

class CrmApi {
  private api: BaseApi;

  constructor() {
    this.api = new BaseApi();
  }

  // Authentication & User Management
  async login(credentials: { email: string; password: string }) {
    return this.api.post('/auth/login', credentials);
  }

  async signup(data: { email: string; password: string; name: string }) {
    return this.api.post('/auth/signup', data);
  }

  async logout() {
    return this.api.post('/auth/logout', {});
  }

  async refresh() {
    return this.api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') });
  }

  async forgotPassword(email: string) {
    return this.api.post('/auth/forgot-password', { email });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.api.post('/auth/reset-password', data);
  }

  async getProfile() {
    return this.api.get('/users/profile');
  }

  async updateProfile(data: any) {
    return this.api.put('/users/profile', data);
  }

  // Upload an image (avatar, company logo) and get back its public URL
  async uploadImage(file: File): Promise<{ success: boolean; data: { url: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postForm('/uploads', formData);
  }

  async getUsers() {
    return this.api.get('/users');
  }

  async getUser(id: string) {
    return this.api.get(`/users/${id}`);
  }

  // Leads Management
  async getLeads(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/leads${query}`);
  }

  async createLead(data: any) {
    return this.api.post('/leads', data);
  }

  async getLead(id: string) {
    return this.api.get(`/leads/${id}`);
  }

  async updateLead(id: string, data: any) {
    return this.api.put(`/leads/${id}`, data);
  }

  async deleteLead(id: string) {
    return this.api.delete(`/leads/${id}`);
  }

  async updateLeadStatus(id: string, status: string) {
    return this.api.post(`/leads/${id}/status`, { status });
  }

  async convertLead(id: string, data: { dealName: string; dealValue: number; dealStage: string; closeDate: string; createContact: boolean }) {
    return this.api.post(`/leads/${id}/convert`, data);
  }

  async bulkDeleteLeads(ids: string[]) {
    return this.api.post('/leads/bulk-delete', { ids });
  }

  async bulkUpdateLeadStatus(ids: string[], status: string) {
    return this.api.post('/leads/bulk-status', { ids, status });
  }

  async bulkDeleteContacts(ids: string[]) {
    return this.api.post('/contacts/bulk-delete', { ids });
  }

  async sendEmailToContact(id: string, data: { subject: string; message: string }) {
    return this.api.post(`/contacts/${id}/email`, data);
  }

  async addLeadNote(id: string, note: any) {
    return this.api.post(`/leads/${id}/notes`, note);
  }

  async importLeads(data: any) {
    return this.api.post('/leads/import', data);
  }

  // Contacts Management
  async getContacts(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/contacts${query}`);
  }

  async createContact(data: any) {
    return this.api.post('/contacts', data);
  }

  async getContact(id: string) {
    return this.api.get(`/contacts/${id}`);
  }

  async updateContact(id: string, data: any) {
    return this.api.put(`/contacts/${id}`, data);
  }

  async deleteContact(id: string) {
    return this.api.delete(`/contacts/${id}`);
  }

  async importContacts(data: any) {
    return this.api.post('/contacts/import', data);
  }

  async importContactsCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postForm('/import/contacts', formData);
  }

  // Accounts Management
  async getAccounts(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/accounts${query}`);
  }

  async createAccount(data: any) {
    return this.api.post('/accounts', data);
  }

  async getAccount(id: string) {
    return this.api.get(`/accounts/${id}`);
  }

  async updateAccount(id: string, data: any) {
    return this.api.put(`/accounts/${id}`, data);
  }

  async deleteAccount(id: string) {
    return this.api.delete(`/accounts/${id}`);
  }

  // Deals Management
  async getDeals(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/deals${query}`);
  }

  async createDeal(data: any) {
    return this.api.post('/deals', data);
  }

  async getDeal(id: string) {
    return this.api.get(`/deals/${id}`);
  }

  async updateDeal(id: string, data: any) {
    return this.api.put(`/deals/${id}`, data);
  }

  async deleteDeal(id: string) {
    return this.api.delete(`/deals/${id}`);
  }

  async updateDealStage(id: string, stage: string) {
    return this.api.post(`/deals/${id}/stage`, { stage });
  }

  // Tasks Management
  async getTasks(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/tasks${query}`);
  }

  async createTask(data: any) {
    return this.api.post('/tasks', data);
  }

  async getTask(id: string) {
    return this.api.get(`/tasks/${id}`);
  }

  async updateTask(id: string, data: any) {
    return this.api.put(`/tasks/${id}`, data);
  }

  async deleteTask(id: string) {
    return this.api.delete(`/tasks/${id}`);
  }

  async updateTaskStatus(id: string, status: string) {
    return this.api.post(`/tasks/${id}/status`, { status });
  }

  // Campaigns Management
  async getCampaigns(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/campaigns${query}`);
  }

  async createCampaign(data: any) {
    return this.api.post('/campaigns', data);
  }

  async getCampaign(id: string) {
    return this.api.get(`/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: any) {
    return this.api.put(`/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string) {
    return this.api.delete(`/campaigns/${id}`);
  }

  async getCampaignAnalytics(id: string) {
    return this.api.get(`/campaigns/${id}/analytics`);
  }

  // Invoices Management
  async getInvoices(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/invoices${query}`);
  }

  async createInvoice(data: any) {
    return this.api.post('/invoices', data);
  }

  async getInvoice(id: string) {
    return this.api.get(`/invoices/${id}`);
  }

  async updateInvoice(id: string, data: any) {
    return this.api.put(`/invoices/${id}`, data);
  }

  async deleteInvoice(id: string) {
    return this.api.delete(`/invoices/${id}`);
  }

  async updateInvoiceStatus(id: string, status: string) {
    return this.api.post(`/invoices/${id}/status`, { status });
  }

  async sendInvoice(id: string) {
    return this.api.post(`/invoices/${id}/send`, {});
  }

  getInvoicePdfUrl(id: string) {
    return `/api/invoices/${id}/pdf`;
  }

  async downloadInvoicePdf(id: string): Promise<void> {
    const { blob, filename } = await this.api.getBlob(`/invoices/${id}/pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async createRazorpayOrder(id: string, currency = 'INR') {
    return this.api.post(`/invoices/${id}/payments/razorpay/order`, { currency });
  }

  async verifyRazorpayPayment(id: string, data: any) {
    return this.api.post(`/invoices/${id}/payments/razorpay/verify`, data);
  }

  // Notifications
  async getNotifications(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/notifications${query}`);
  }

  async createNotification(data: any) {
    return this.api.post('/notifications', data);
  }

  async getNotification(id: string) {
    return this.api.get(`/notifications/${id}`);
  }

  async markNotificationAsRead(id: string) {
    return this.api.put(`/notifications/${id}/read`, {});
  }

  async markAllNotificationsAsRead() {
    return this.api.put('/notifications/read-all', {});
  }

  async deleteNotification(id: string) {
    return this.api.delete(`/notifications/${id}`);
  }

  // Meta Ads Integration
  async getMetaConnection() {
    return this.api.get('/meta/connection');
  }

  async getMetaOAuthUrl() {
    return this.api.get('/meta/oauth-url');
  }

  async connectMetaWithToken(accessToken: string) {
    return this.api.post('/meta/connect', { accessToken });
  }

  async disconnectMeta() {
    return this.api.post('/meta/disconnect', {});
  }

  async getMetaAdAccounts() {
    return this.api.get('/meta/accounts');
  }

  async getMetaCampaigns(accountId: string) {
    return this.api.get(`/meta/accounts/${accountId}/campaigns`);
  }

  async getMetaPages() {
    return this.api.get('/meta/pages');
  }

  async getMetaLeadForms(pageId: string, pageToken?: string) {
    const q = pageToken ? `?page_token=${encodeURIComponent(pageToken)}` : '';
    return this.api.get(`/meta/pages/${pageId}/leadforms${q}`);
  }

  async getMetaFormLeads(formId: string) {
    return this.api.get(`/meta/forms/${formId}/leads`);
  }

  async importMetaLeads(leads: any[]) {
    return this.api.post('/meta/leads/import', { leads });
  }

  // Keep legacy aliases for backward compat
  async connectMetaAccount(data: any) {
    return this.api.post('/meta/connect', data);
  }

  async disconnectMetaAccount() {
    return this.api.post('/meta/disconnect', {});
  }

  async getMetaAccounts() {
    return this.api.get('/meta/accounts');
  }

  // Reports & Analytics
  async getDashboardReport() {
    return this.api.get('/reports/dashboard');
  }

  async getSalesReport() {
    return this.api.get('/reports/sales');
  }

  async getLeadsReport() {
    return this.api.get('/reports/leads');
  }

  async getDealsReport() {
    return this.api.get('/reports/deals');
  }

  async getPerformanceReport() {
    return this.api.get('/reports/performance');
  }

  // Templates (WhatsApp)
  async getTemplates(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.api.get(`/templates${query}`);
  }

  async createTemplate(data: any) {
    return this.api.post('/templates', data);
  }

  async getTemplate(id: string) {
    return this.api.get(`/templates/${id}`);
  }

  async updateTemplate(id: string, data: any) {
    return this.api.put(`/templates/${id}`, data);
  }

  async deleteTemplate(id: string) {
    return this.api.delete(`/templates/${id}`);
  }

  async globalSearch(q: string) {
    return this.api.get(`/search?q=${encodeURIComponent(q)}`);
  }

  // Google Sheets Integration
  async getGoogleConnection() {
    return this.api.get('/google/connection');
  }

  async getGoogleOAuthUrl() {
    return this.api.get('/google/oauth-url');
  }

  async disconnectGoogle() {
    return this.api.delete('/google/disconnect');
  }

  async getGoogleSpreadsheets() {
    return this.api.get('/google/spreadsheets');
  }

  async getGoogleSheetNames(spreadsheetId: string) {
    return this.api.get(`/google/spreadsheets/${spreadsheetId}/sheets`);
  }

  async getGoogleSyncConfigs() {
    return this.api.get('/google/sync-configs');
  }

  async saveGoogleSyncConfig(entityType: string, data: any) {
    return this.api.put(`/google/sync-configs/${entityType}`, data);
  }

  async deleteGoogleSyncConfig(entityType: string) {
    return this.api.delete(`/google/sync-configs/${entityType}`);
  }

  async googleSyncNow(entityType: string) {
    return this.api.post(`/google/sync-now/${entityType}`, {});
  }

  async getGoogleOAuthAppConfig() {
    return this.api.get('/google/oauth-app-config');
  }

  async saveGoogleOAuthAppConfig(config: { clientId: string; clientSecret: string }) {
    return this.api.put('/google/oauth-app-config', { config });
  }

  // Settings
  async getSettings() {
    return this.api.get('/settings');
  }

  async updateSettings(data: any) {
    return this.api.put('/settings', data);
  }

  async getCompanySettings() {
    return this.api.get('/settings/company');
  }

  async updateCompanySettings(data: any) {
    return this.api.put('/settings/company', data);
  }

  async getIntegrationConfig(provider: string) {
    return this.api.get(`/settings/integrations/${provider}`);
  }

  async updateIntegrationConfig(provider: string, config: Record<string, string>) {
    return this.api.put(`/settings/integrations/${provider}`, { config });
  }

  async getLeadNotes(leadId: string) {
    return this.api.get(`/leads/${leadId}/notes`);
  }

  // WhatsApp Accounts & Templates
  async getWhatsAppAccounts() {
    return this.api.get('/campaigns/accounts/whatsapp/list');
  }

  async connectWhatsAppAccount(data: any) {
    return this.api.post('/campaigns/accounts/whatsapp', data);
  }

  async getWhatsAppTemplates() {
    return this.api.get('/campaigns/templates/list');
  }

  async createWhatsAppTemplate(data: any) {
    return this.api.post('/campaigns/templates', data);
  }

  async sendCampaign(id: string) {
    return this.api.post(`/campaigns/${id}/send`, {});
  }

  // Import Jobs
  async getImportJobs() {
    return this.api.get('/import/jobs');
  }

  async createUser(data: { name: string; email: string; password: string; role: string; phone?: string; avatar?: string; permissions?: any }) {
    return this.api.post('/users', data);
  }

  async updateUser(id: string, data: any) {
    return this.api.put(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.api.delete(`/users/${id}`);
  }

  setToken(token: string | null) {
    this.api.setToken(token);
  }
}

export default CrmApi;
