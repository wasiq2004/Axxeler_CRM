export type LeadStatus = 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Closed - Won' | 'Lost' | 'Qualified';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
}

export interface Note {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Activity {
  id:string;
  leadId: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Task';
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  campaignId: string;
  status: LeadStatus;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  score: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: string[]; // array of note IDs
  activities: string[]; // array of activity IDs
  attachments: Attachment[];
}
