import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, MoreVertical, Star } from 'lucide-react';
import type { Lead } from '../../../types';
import Button from '@/components/ui/Button';
import { useUI } from '../../../contexts/UIContext';

interface LeadDetailHeaderProps {
  lead: Lead;
}

const LeadDetailHeader: React.FC<LeadDetailHeaderProps> = ({ lead }) => {
  const { openEditLeadModal } = useUI();
  
  const handleEditClick = () => {
    openEditLeadModal();
  };

  return (
    <div>
       <Link to="/leads" className="text-sm text-primary hover:underline flex items-center mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Leads
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
                    {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-main">{lead.firstName} {lead.lastName}</h1>
                    <p className="text-text-light">{lead.company}</p>
                </div>
                <button 
                  className="ml-4 text-gray-400 hover:text-yellow-500 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Favorite lead"
                >
                    <Star className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center space-x-2 self-stretch sm:self-auto">
                <Button
                  variant="outline"
                  size="md"
                  icon={Edit}
                  iconPosition="left"
                  responsive
                  onClick={handleEditClick}
                >
                  Edit
                </Button>
                 <button 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="More options"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default LeadDetailHeader;
