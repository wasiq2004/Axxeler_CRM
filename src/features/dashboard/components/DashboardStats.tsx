import React from 'react';
import StatsCard from './StatsCard';
import { TrendingUp, Flame, CheckSquare, DollarSign } from 'lucide-react';
import { useDeals } from '../../../contexts/DealsContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useTasks } from '../../../contexts/TasksContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { Target } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';

const DashboardStats: React.FC = () => {
  const { deals } = useDeals();
  const { leads } = useLeads();
  const { tasks } = useTasks();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const isTeamMember = user?.role === 'team_member';

  const dealsInPipeline = deals.filter(d => d.stage !== 'Closed - Won' && d.stage !== 'Closed - Lost').length;
  const hotLeads = leads.filter(l => l.score > 80).length;
  const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
  const totalRevenue = deals.filter(d => d.stage === 'Closed - Won').reduce((sum, d) => sum + Number(d.value), 0);

  const wonDeals = deals.filter(d => d.stage === 'Closed - Won').length;
  const closedDeals = deals.filter(d => d.stage === 'Closed - Won' || d.stage === 'Closed - Lost').length;
  const winRate = closedDeals > 0 ? ((wonDeals / closedDeals) * 100).toFixed(0) : '0';

  const allStats = [
    { id: 'deals', title: 'Deals in Pipeline', value: dealsInPipeline.toString(), icon: TrendingUp },
    { id: 'leads', title: 'Hot Leads', value: hotLeads.toString(), icon: Flame },
    { id: 'tasks', title: 'Active Tasks', value: activeTasks.toString(), icon: CheckSquare },
    { id: 'revenue', title: 'Total Revenue', value: `${currency.symbol}${(totalRevenue / 1000).toFixed(1)}k`, icon: currency.icon },
    { id: 'winrate', title: 'Win Rate', value: `${winRate}%`, icon: Target },
  ];

  const stats = allStats.filter(stat => {
    if (isTeamMember) {
      return stat.id === 'leads' || stat.id === 'tasks';
    }
    return true;
  });

  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 ${isTeamMember ? 'lg:grid-cols-2 max-w-2xl' : 'lg:grid-cols-5'} gap-3 sm:gap-4`}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          index={index}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
