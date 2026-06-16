import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import Card from './Card';
import { useApi } from '../../../contexts/ApiContext';

interface RevenuePoint {
  name: string;
  revenue: number;
}

const buildChartData = (invoices: any[], period: string): RevenuePoint[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const paidInvoices = (invoices || []).filter((inv: any) => inv.status === 'Paid');

  const getRevenue = (year: number, month: number) => {
    return paidInvoices.reduce((sum: number, inv: any) => {
      const d = new Date(inv.issueDate || inv.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const subtotal = (inv.items || []).reduce((s: number, item: any) => s + Number(item.price) * item.quantity, 0);
        return sum + subtotal + subtotal * (Number(inv.taxRate) / 100);
      }
      return sum;
    }, 0);
  };

  switch (period) {
    case '6months': {
      const points: RevenuePoint[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(currentYear, currentMonth + i, 1);
        points.push({ name: months[d.getMonth()], revenue: getRevenue(d.getFullYear(), d.getMonth()) });
      }
      return points;
    }
    case 'past6months': {
      const points: RevenuePoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        points.push({ name: months[d.getMonth()], revenue: getRevenue(d.getFullYear(), d.getMonth()) });
      }
      return points;
    }
    case 'year': {
      return months.map((name, idx) => ({ name, revenue: getRevenue(currentYear, idx) }));
    }
    case 'month':
    default: {
      const weeks: RevenuePoint[] = [
        { name: 'Week 1', revenue: 0 },
        { name: 'Week 2', revenue: 0 },
        { name: 'Week 3', revenue: 0 },
        { name: 'Week 4', revenue: 0 },
      ];
      paidInvoices.forEach((inv: any) => {
        const d = new Date(inv.issueDate || inv.createdAt);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const weekIdx = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
          const subtotal = (inv.items || []).reduce((s: number, item: any) => s + Number(item.price) * item.quantity, 0);
          weeks[weekIdx].revenue += subtotal + subtotal * (Number(inv.taxRate) / 100);
        }
      });
      return weeks;
    }
  }
};

const SalesOverview: React.FC = () => {
  const [filter, setFilter] = useState('month');
  const [invoices, setInvoices] = useState<any[]>([]);
  const { crmApi } = useApi();

  useEffect(() => {
    crmApi.getDashboardReport()
      .then((res: any) => setInvoices(res.data?.invoices || []))
      .catch(() => setInvoices([]));
  }, [crmApi]);

  const data = buildChartData(invoices, filter);

  const filterOptions = [
    { value: 'year', label: 'All Time' },
    { value: 'past6months', label: 'Past 6 Months' },
    { value: 'month', label: 'Current Month' },
    { value: '6months', label: 'Next 6 Months' }
  ];

  const selectedIndex = filterOptions.findIndex(o => o.value === filter);
  const selectedOption = filterOptions[selectedIndex];

  return (
    <Card title="Sales Overview" icon={TrendingUp}>
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
          onChange={(e) => setFilter(filterOptions[parseInt(e.target.value)].value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="text-center text-sm font-medium text-primary mt-1">
          {selectedOption?.label}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0079C1"
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SalesOverview;
