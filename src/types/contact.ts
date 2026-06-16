export type ContactStatus = 'Active' | 'Inactive';
export type ContactState = 'Handled' | 'Pending';

export interface Contact {
  id: string;
  name?: string;
  phone: string;
  normalizedPhone: string;
  groupName?: string;
  tags: string[];
  customFields: Record<string, string>;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
