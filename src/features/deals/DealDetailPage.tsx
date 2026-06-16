import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, User, Building } from 'lucide-react';
import { useDeals } from '../../contexts/DealsContext';
import { useUsers } from '../../contexts/UsersContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { deals } = useDeals();
  const { users } = useUsers();
  const { currency } = useCurrency();
  
  const deal = deals.find(d => d.id === id);
  
  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Deal Not Found</h2>
        <p className="text-gray-500 mb-4">The deal you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/deals" 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Deals
        </Link>
      </div>
    );
  }
  
  const owner = users[deal.ownerId];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/deals" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
            <p className="text-gray-500">{deal.accountName}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Value</p>
                <p className="font-semibold">{currency.symbol}{Number(deal.value).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Account</p>
                <p className="font-semibold">{deal.accountName}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Close Date</p>
                <p className="font-semibold">{deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner</h2>
          {owner && (
            <div className="flex items-center">
              <img 
                src={owner.avatar} 
                alt={owner.name} 
                className="w-12 h-12 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold">{owner.name}</p>
                <p className="text-sm text-gray-500">Deal Owner</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;
