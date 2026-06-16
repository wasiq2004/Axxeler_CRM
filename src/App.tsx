import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Shell from '@/components/layout/Shell';

// Features
import DashboardPage from '@/features/dashboard/DashboardPage';
import LeadsPage from '@/features/leads/pages/LeadsPage';
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage';
import ContactsPage from '@/features/contacts/pages/ContactsPage';
import TeamMembersPage from '@/features/team/TeamMembersPage';
import DealsPage from '@/features/deals/DealsPage';
import DealDetailPage from '@/features/deals/DealDetailPage';
import CampaignsPage from '@/features/campaigns/CampaignsPage';
import CampaignsAccountsPage from '@/features/campaigns/AccountsPage';
import CampaignsImportPage from '@/features/campaigns/ImportContactsPage';
import CampaignsCreatePage from '@/features/campaigns/CreateCampaignPage';
import CreateTemplatePage from '@/features/campaigns/CreateTemplatePage';
import WhatsAppTemplateBuilder from '@/features/templates/WhatsAppTemplateBuilder';
import CampaignDetailPage from '@/features/campaigns/CampaignDetailPage';
import ReportsPage from '@/features/reports/ReportsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import AdsSyncPage from '@/features/adsSync/AdsSyncPage';
import InvoicesPage from '@/features/invoices/pages/InvoicesPage';
import InvoiceDetailPage from '@/features/invoices/pages/InvoiceDetailPage';
import CreateInvoicePage from '@/features/invoices/pages/CreateInvoicePage';
import EditInvoicePage from '@/features/invoices/pages/EditInvoicePage';
import TasksPage from '@/features/tasks/TasksPage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import LoginPage from '@/features/auth/LoginPage';
import SignupPage from '@/features/auth/SignupPage';

import { LeadsProvider } from '@/contexts/LeadsContext';
import { UIProvider } from '@/contexts/UIContext';
import { InvoicesProvider } from '@/contexts/InvoicesContext';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { DealsProvider } from '@/contexts/DealsContext';
import { CampaignsProvider } from '@/contexts/CampaignsContext';
import { UsersProvider } from '@/contexts/UsersContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { MetaAccountProvider } from '@/contexts/MetaAccountContext';
import { CampaignModuleProvider } from '@/contexts/CampaignModuleContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ApiProvider } from '@/contexts/ApiContext';
import { AuthProvider } from '@/contexts/AuthContext';

const App: React.FC = () => {
  return (
    <div className="bg-background text-text-main font-sans antialiased">
      <HashRouter>
        <ApiProvider>
          <AuthProvider>
            <UIProvider>
              <CurrencyProvider>
                <LeadsProvider>
                  <InvoicesProvider>
                    <TimelineProvider>
                      <ContactsProvider>
                        <TasksProvider>
                          <DealsProvider>
                            <TeamProvider>
                              <CampaignsProvider>
                                <UsersProvider>
                                  <CompanyProvider>
                                    <MetaAccountProvider>
                                      <CampaignModuleProvider>
                                        <NotificationsProvider>
                                            <Routes>
                                              <Route path="/login" element={<LoginPage />} />
                                              <Route path="/signup" element={<SignupPage />} />
                                              <Route path="" element={<ProtectedRoute><Shell><Outlet /></Shell></ProtectedRoute>}>
                                                <Route index element={<DashboardPage />} />
                                                
                                                {/* Leads - All roles */}
                                                <Route path="leads" element={<LeadsPage />} />
                                                <Route path="leads/:id" element={<LeadDetailPage />} />
                                                
                                                {/* Contacts - All roles */}
                                                <Route path="contacts" element={<ContactsPage />} />
                                                
                                                {/* Tasks - All roles */}
                                                <Route path="tasks" element={<TasksPage />} />
                                                
                                                {/* Settings - All roles (content filtered internally) */}
                                                <Route path="settings" element={<SettingsPage />} />

                                                {/* Campaigns - Temporarily disabled */}
                                                {/* <Route path="campaigns" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'team_member']}><CampaignsPage /></ProtectedRoute>} /> */}
                                                {/* <Route path="campaigns/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'team_member']}><CampaignDetailPage /></ProtectedRoute>} /> */}
                                                {/* <Route path="campaigns/accounts" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CampaignsAccountsPage /></ProtectedRoute>} /> */}
                                                {/* <Route path="campaigns/import" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CampaignsImportPage /></ProtectedRoute>} /> */}
                                                {/* <Route path="campaigns/create" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CampaignsCreatePage /></ProtectedRoute>} /> */}
                                                {/* <Route path="campaigns/templates/new" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CreateTemplatePage /></ProtectedRoute>} /> */}
                                                {/* <Route path="templates/whatsapp/new" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><WhatsAppTemplateBuilder /></ProtectedRoute>} /> */}

                                                {/* Deals - Admin and Manager */}
                                                <Route path="deals" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DealsPage /></ProtectedRoute>} />
                                                <Route path="deals/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DealDetailPage /></ProtectedRoute>} />
                                                
                                                {/* Ads Sync - Admin and Manager */}
                                                <Route path="ads-sync" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AdsSyncPage /></ProtectedRoute>} />
                                                
                                                {/* Reports - Admin and Manager */}
                                                <Route path="reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ReportsPage /></ProtectedRoute>} />
                                                
                                                {/* Team - Admin and Manager */}
                                                <Route path="team" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><TeamMembersPage /></ProtectedRoute>} />
                                                
                                                {/* Notifications - Admin and Manager */}
                                                <Route path="notifications" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><NotificationsPage /></ProtectedRoute>} />

                                                {/* Invoices - Admin Only */}
                                                <Route path="invoices" element={<ProtectedRoute allowedRoles={['admin']}><InvoicesPage /></ProtectedRoute>} />
                                                <Route path="invoices/new" element={<ProtectedRoute allowedRoles={['admin']}><CreateInvoicePage /></ProtectedRoute>} />
                                                <Route path="invoices/:id" element={<ProtectedRoute allowedRoles={['admin']}><InvoiceDetailPage /></ProtectedRoute>} />
                                                <Route path="invoices/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><EditInvoicePage /></ProtectedRoute>} />
                                                
                                                <Route path="*" element={<DashboardPage />} />
                                              </Route>
                                            </Routes>
                                        </NotificationsProvider>
                                      </CampaignModuleProvider>
                                    </MetaAccountProvider>
                                  </CompanyProvider>
                                </UsersProvider>
                              </CampaignsProvider>
                            </TeamProvider>
                          </DealsProvider>
                        </TasksProvider>
                      </ContactsProvider>
                    </TimelineProvider>
                  </InvoicesProvider>
                </LeadsProvider>
              </CurrencyProvider>
            </UIProvider>
          </AuthProvider>
        </ApiProvider>
      </HashRouter>
    </div>
  );
};

export default App;