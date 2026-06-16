import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvoices } from '../../../contexts/InvoicesContext';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface RevenueChartProps {
    quarter?: number;
    year?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ quarter, year = 2025 }) => {
    const { invoices } = useInvoices();
    const { currency } = useCurrency();

    const chartData = useMemo(() => {
        let filteredInvoices = invoices;

        if (quarter) {
            const startMonth = (quarter - 1) * 3;
            const endMonth = startMonth + 2;
            filteredInvoices = invoices.filter(invoice => {
                const date = new Date(invoice.issueDate);
                return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
            });
        }

        const monthlyRevenue: Record<string, { count: number; revenue: number }> = {};

        filteredInvoices.forEach(invoice => {
            if (invoice.status === 'Paid') {
                const date = new Date(invoice.issueDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyRevenue[monthKey]) {
                    monthlyRevenue[monthKey] = { count: 0, revenue: 0 };
                }

                const subtotal = (invoice.items || []).reduce((s, item) => s + Number(item.price) * item.quantity, 0);
                const total = subtotal + subtotal * ((invoice.taxRate || 0) / 100);
                monthlyRevenue[monthKey].count += 1;
                monthlyRevenue[monthKey].revenue += total;
            }
        });

        const dataArr = Object.entries(monthlyRevenue)
            .map(([key, data]) => ({
                name: key,
                label: key.split('-')[1] + '/' + key.split('-')[0].slice(2),
                revenue: parseFloat(data.revenue.toFixed(2)),
                count: data.count
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return dataArr;
    }, [invoices, quarter, year]);

    if (chartData.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className="text-sm font-medium">No revenue data for this period</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0079C1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0079C1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                        tickFormatter={(value) => `${currency.symbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                        }}
                        formatter={(value: number) => [`${currency.symbol}${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0079C1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
