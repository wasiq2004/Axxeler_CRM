import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';
import Card from './Card';
import { useLeads } from '../../../contexts/LeadsContext';

// Filter leads based on time period
const filterLeadsByPeriod = (leads: any[], period: string) => {
  if (period === 'all') return leads;

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
      return leads;
  }

  return leads.filter(lead => {
    const leadDate = new Date(lead.createdAt || now);
    const isAfterStart = leadDate >= startDate;
    const isBeforeEnd = endDate ? leadDate < endDate : true;
    return isAfterStart && isBeforeEnd;
  });
};

// Calculate conversion rates
const calculateConversionData = (leads: any[]) => {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return [
      { name: 'Active', value: 100 },
      { name: 'Lost', value: 0 },
      { name: 'Won', value: 0 },
    ];
  }

  const wonLeads = leads.filter(lead => lead.status === 'Closed - Won').length;
  const lostLeads = leads.filter(lead => lead.status === 'Lost').length;
  const activeLeads = totalLeads - wonLeads - lostLeads;

  const wonPercentage = Math.round((wonLeads / totalLeads) * 100);
  const lostPercentage = Math.round((lostLeads / totalLeads) * 100);

  return [
    { name: 'Active', value: activeLeads },
    { name: 'Lost', value: lostLeads },
    { name: 'Won', value: wonLeads },
  ];
};

const COLORS = ['#0079C1', '#f0483e', '#10b981'];

const LeadConversion: React.FC = () => {
  const { leads } = useLeads();
  const [filter, setFilter] = useState('all');

  const filteredLeads = filterLeadsByPeriod(leads, filter);
  const data = calculateConversionData(filteredLeads);

  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter(lead => lead.status === 'Closed - Won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const activeRate = totalLeads > 0 ? Math.round(((totalLeads - wonLeads - filteredLeads.filter(lead => lead.status === 'Lost').length) / totalLeads) * 100) : 0;

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
    <Card title="Lead Conversion" icon={Clock}>
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

      <div className="h-72 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value: string) => {
                const item = data.find(d => d.name === value);
                return item ? `${item.name}: ${item.value}` : value;
              }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
              <tspan x="50%" dy="-0.6em" fill="white" className="font-semibold text-xl">{activeRate}%</tspan>
              <tspan x="50%" dy="1.4em" fill="white" className="font-semibold text-xl">{conversionRate}%</tspan>
            </text>
            <line x1="38%" y1="50%" x2="62%" y2="50%" stroke="white" strokeWidth={1.5} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default LeadConversion;
