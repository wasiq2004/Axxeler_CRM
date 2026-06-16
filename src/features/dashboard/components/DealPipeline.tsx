import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import Card from './Card';
import { useDeals } from '../../../contexts/DealsContext';
import { DEAL_STAGES } from '../../../constants';
import type { DealStage } from '../../../types';

// Filter deals based on time period
const filterDealsByPeriod = (deals: any[], period: string) => {
  if (period === 'all') return deals;

  const now = new Date();
  let startDate: Date;
  let endDate: Date | null = null;

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '6months':
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 6, 1);
      break;
    case 'past6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return deals;
  }

  return deals.filter(deal => {
    const dealDate = new Date(deal.createdAt || deal.closeDate || now);
    const isAfterStart = dealDate >= startDate;
    const isBeforeEnd = endDate ? dealDate < endDate : true;
    return isAfterStart && isBeforeEnd;
  });
};

const DealPipeline: React.FC = () => {
  const { deals } = useDeals();
  const [filter, setFilter] = useState('all');

  const filteredDeals = useMemo(() => filterDealsByPeriod(deals, filter), [deals, filter]);

  const pipelineData = useMemo(() => {
    // Initialize all deal stages with 0 values
    const stageTotals: Record<DealStage, number> = {
      'Prospecting': 0,
      'Qualification': 0,
      'Proposal': 0,
      'Negotiation': 0,
      'Closed - Won': 0,
      'Closed - Lost': 0,
    };

    filteredDeals.forEach(deal => {
      if (stageTotals[deal.stage] !== undefined) {
        stageTotals[deal.stage] += deal.value;
      }
    });

    return DEAL_STAGES.filter(s => s !== 'Closed - Lost')
      .map(stage => ({ name: stage, value: stageTotals[stage] }))
      .reverse();

  }, [filteredDeals]);

  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'past6months', label: 'Past 6 Months' },
    { value: 'month', label: 'Current Month' },
    { value: '6months', label: 'Next 6 Months' },
    { value: 'year', label: 'This Year' }
  ];

  const selectedOption = filterOptions.find(option => option.value === filter);
  const selectedIndex = filterOptions.findIndex(option => option.value === filter);

  const handleSliderChange = (index: number) => {
    setFilter(filterOptions[index].value);
  };

  return (
    <Card title="Deal Pipeline" icon={TrendingUp}>
      {/* Slider Filter */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          {filterOptions.map((option, index) => (
            <span
              key={option.value}
              className={`px-1 ${index === selectedIndex ? 'text-primary font-medium' : ''}`}
            >
              {option.label}
            </span>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={filterOptions.length - 1}
          value={selectedIndex}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="text-center text-sm font-medium text-primary mt-1">
          {selectedOption?.label}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={pipelineData}
            margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => `$${(value / 1000)}k`} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Bar dataKey="value" fill="#0079C1" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DealPipeline;
