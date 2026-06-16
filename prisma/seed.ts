import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  { id: 'user_1', name: 'Axxeler Admin', email: 'axxeler@gmail.com',   password: 'axxeler1234', role: 'admin'       as const, avatar: 'https://i.pravatar.cc/150?u=user_1' },
  { id: 'user_2', name: 'General Manager',email: 'manager@axxeler.com', password: 'manager123',  role: 'manager'     as const, avatar: 'https://i.pravatar.cc/150?u=user_2' },
  { id: 'user_3', name: 'Senior Executive',email: 'team@axxeler.com',   password: 'team123',     role: 'team_member' as const, avatar: 'https://i.pravatar.cc/150?u=user_3' },
];

async function main() {
  console.log('[seed] Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where:  { email: user.email },
      update: { name: user.name, role: user.role, avatar: user.avatar },
      create: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        avatar:       user.avatar,
        passwordHash: await bcrypt.hash(user.password, 12),
      },
    });
  }
  console.log('[seed] Users seeded.');

  await prisma.companySetting.upsert({
    where:  { id: 'company' },
    update: {},
    create: {
      id:       'company',
      name:     'Axxeler CRM Inc.',
      address:  '123 Business Avenue, Suite 100\nBusiness City, BC 12345',
      phone:    '+1 (555) 123-4567',
      email:    'info@axxeler.com',
      website:  'www.axxeler.com',
      logo:     '/axxeler-logo-white.png',
      currency: 'USD',
    },
  });

  const contacts = [
    { id: 'contact_1', name: 'Salman', phone: '918148035472', normalizedPhone: '+918148035472', tags: ['VIP'],                    source: 'Referral' },
    { id: 'contact_2', name: 'Wasiq',  phone: '919876543210', normalizedPhone: '+919876543210', tags: ['New Customer', 'Follow-up'], source: 'Web Form'  },
  ];
  for (const contact of contacts) {
    await prisma.contact.upsert({ where: { normalizedPhone: contact.normalizedPhone }, update: contact, create: { ...contact, customFields: {} } });
  }

  const lead = await prisma.lead.upsert({
    where:  { id: 'lead_1' },
    update: {},
    create: {
      id:         'lead_1',
      firstName:  'John',
      lastName:   'Doe',
      company:    'Acme Inc.',
      email:      'john.doe@acme.com',
      phone:      '+1-555-123-4567',
      source:     'Facebook Lead Ad',
      campaignId: 'camp_1',
      status:     'Contacted',
      ownerId:    'user_1',
      score:      85,
      tags:       ['Enterprise', 'High-Priority'],
    },
  });
  await prisma.leadNote.upsert({
    where:  { id: 'note_1' },
    update: {},
    create: { id: 'note_1', leadId: lead.id, authorId: 'user_1', content: 'Initial call made, left a voicemail.' },
  });

  await prisma.account.upsert({
    where:  { id: 'acc_1' },
    update: {},
    create: { id: 'acc_1', name: 'Acme Inc.', industry: 'Technology', phone: '+1-555-123-4567', website: 'acme.com', ownerId: 'user_1' },
  });
  await prisma.deal.upsert({
    where:  { id: 'deal_1' },
    update: {},
    create: { id: 'deal_1', name: 'Acme Inc. - Enterprise License', accountId: 'acc_1', accountName: 'Acme Inc.', stage: 'Proposal', value: 15000, closeDate: new Date('2025-11-30'), ownerId: 'user_1' },
  });
  await prisma.task.upsert({
    where:  { id: 'task_1' },
    update: {},
    create: { id: 'task_1', title: 'Follow up with John Doe', status: 'Pending', priority: 'High', dueDate: new Date('2025-11-15'), assignedToId: 'user_1', relatedTo: { type: 'Lead', id: 'lead_1', name: 'John Doe' } },
  });

  await prisma.invoice.upsert({
    where:  { invoiceNumber: 'INV-001' },
    update: {},
    create: {
      id:            'inv_1',
      invoiceNumber: 'INV-001',
      clientName:    'John Doe',
      clientCompany: 'Acme Inc.',
      clientEmail:   'john.doe@acme.com',
      issueDate:     new Date('2025-11-05'),
      dueDate:       new Date('2025-11-20'),
      status:        'Paid',
      taxRate:       8,
      items: {
        create: [
          { description: 'Enterprise Plan Subscription - November', quantity: 1, price: 500 },
          { description: 'Onboarding & Training Service',           quantity: 1, price: 250 },
        ],
      },
    },
  });

  await prisma.notification.upsert({
    where:  { id: 'notif_1' },
    update: {},
    create: { id: 'notif_1', type: 'general', title: 'Welcome to Axxeler CRM', message: 'Your CRM is ready to use.', isRead: false },
  });

  console.log('[seed] Done.');
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
