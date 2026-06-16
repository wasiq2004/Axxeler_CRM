
import { Home, Users, Briefcase, DollarSign, Megaphone, BarChart2, Settings, User, Layers, FileText, Sparkles, CheckSquare, Bell } from 'lucide-react';
import type { LeadStatus, DealStage } from '../types';

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Contacts', href: '/contacts', icon: User },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  // { name: 'Campaigns', href: '/campaigns', icon: Megaphone }, // Temporarily disabled
  { name: 'Ads Sync', href: '/ads-sync', icon: Layers },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const PIPELINE_STAGES: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Closed - Won'];
export const DEAL_STAGES: DealStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed - Won', 'Closed - Lost'];
