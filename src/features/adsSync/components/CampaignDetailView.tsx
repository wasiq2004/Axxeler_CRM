import React from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CampaignDetailViewProps {
  campaignId: string;
  campaignName: string;
  onBack: () => void;
}

const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({ campaignName, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} icon={ArrowLeft} iconPosition="left">
          Back to Campaigns
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Campaign: {campaignName}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-2">Ad Set &amp; Ad Details</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          Per-campaign ad set and ad breakdown will be available in a future update. Use the Meta Ads Manager for detailed creative analytics.
        </p>
      </div>
    </div>
  );
};

export default CampaignDetailView;
