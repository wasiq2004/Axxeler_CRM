
import React from 'react';
import type { Lead, LeadStatus } from '../../../types';
import { Mail, Phone, Tag, Star, User } from 'lucide-react';

interface LeadInfoCardProps {
  lead: Lead;
}

// FIX: Replaced 'Converted' with 'Closed - Won' to match LeadStatus type and added missing statuses to prevent runtime errors.
const statusColors: Record<LeadStatus, string> = {
    'New': 'border-blue-500 text-blue-500',
    'Contacted': 'border-yellow-500 text-yellow-500',
    'Proposal': 'border-orange-500 text-orange-500',
    'Negotiation': 'border-indigo-500 text-indigo-500',
    'Closed - Won': 'border-purple-500 text-purple-500',
    'Lost': 'border-red-500 text-red-500',
    'Qualified': 'border-green-500 text-green-500',
};

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-red-500';
  if (score > 75) {
    colorClass = 'text-green-500';
  } else if (score > 50) {
    colorClass = 'text-yellow-500';
  }

  return (
    <div className="relative w-16 h-16 flex items-center justify-center mt-2">
      <svg className="w-full h-full" viewBox="0 0 60 60">
        <circle
          className="text-gray-200"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="30"
          cy="30"
        />
        <circle
          className={`${colorClass} transform -rotate-90 origin-center transition-all duration-500`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="30"
          cy="30"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${colorClass}`}>
        {score}
      </span>
    </div>
  );
};


const InfoRow = ({ icon: Icon, label, value, center = false }: { icon: React.ElementType, label: string, value: string | React.ReactNode, center?: boolean }) => (
    <div className={`flex py-3 ${center ? 'items-center' : 'items-start'}`}>
        <Icon className={`w-5 h-5 text-gray-400 mr-4 flex-shrink-0 ${center ? '' : 'mt-1'}`} />
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <div className="text-sm text-text-main font-medium">{value}</div>
        </div>
    </div>
);

const LeadInfoCard: React.FC<LeadInfoCardProps> = ({ lead }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 border-b pb-3">Lead Information</h2>
      <div className="divide-y divide-gray-200">
        <InfoRow icon={Mail} label="Email" value={<a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>} />
        <InfoRow icon={Phone} label="Phone" value={lead.phone} />
        <InfoRow icon={User} label="Owner" value={
            <div className="flex items-center">
                <img src={lead.ownerAvatar} alt={lead.ownerName} className="w-6 h-6 rounded-full mr-2" />
                <span>{lead.ownerName}</span>
            </div>
        }/>
        <InfoRow icon={Star} label="Lead Score" value={<ScoreRing score={lead.score} />} center />
        <InfoRow icon={Tag} label="Status" value={
             <span className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
        } />
      </div>
    </div>
  );
};

export default LeadInfoCard;
