import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLeads } from '../../../contexts/LeadsContext';

interface LeadSourceChartProps {
    quarter?: number;
    year?: number;
}

const LeadSourceChart: React.FC<LeadSourceChartProps> = ({ quarter, year = 2025 }) => {
    const { leads } = useLeads();

    const chartData = useMemo(() => {
        let filteredLeads = leads;

        if (quarter) {
            const startMonth = (quarter - 1) * 3;
            const endMonth = startMonth + 2;
            filteredLeads = leads.filter(lead => {
                const date = new Date(lead.createdAt);
                return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
            });
        }

        const sourceMap: Record<string, number> = {};

        filteredLeads.forEach(lead => {
            const source = lead.source || 'Unknown';
            sourceMap[source] = (sourceMap[source] || 0) + 1;
        });

        return Object.entries(sourceMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [leads, quarter, year]);

    const colors = ['#0079C1', '#3399d6', '#66b3e1', '#99cceb', '#cce5f5'];

    if (chartData.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <p className="text-sm font-medium">No lead source data</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`${value} Leads`, 'Leads']}
                    />
                    <Bar
                        dataKey="value"
                        fill="#0079C1"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LeadSourceChart;
