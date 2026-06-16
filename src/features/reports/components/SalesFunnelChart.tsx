import React, { useMemo } from 'react';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { useLeads } from '../../../contexts/LeadsContext';
import type { LeadStatus } from '../../../types';

const funnelStages: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Closed - Won'];

// This defines which statuses are counted for each stage of the funnel, assuming a linear progression.
const includedStatusesForCount: Record<LeadStatus, LeadStatus[]> = {
    'New': ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed - Won'],
    'Contacted': ['Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed - Won'],
    'Proposal': ['Qualified', 'Proposal', 'Negotiation', 'Closed - Won'],
    'Closed - Won': ['Closed - Won'],
    // These are not part of the main funnel stages but are needed for the type definition.
    'Negotiation': [],
    'Lost': [],
    'Qualified': [],
};


interface SalesFunnelChartProps {
    quarter?: number;
    year?: number;
}

const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ quarter, year = 2025 }) => {
    const { leads } = useLeads();

    const funnelData = useMemo(() => {
        let filteredLeads = leads;

        if (quarter) {
            const startMonth = (quarter - 1) * 3;
            const endMonth = startMonth + 2;
            filteredLeads = leads.filter(lead => {
                const date = new Date(lead.createdAt);
                return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
            });
        }

        const data = funnelStages.map(stage => {
            const count = filteredLeads.filter(lead => includedStatusesForCount[stage].includes(lead.status)).length;
            return {
                name: stage,
                value: count,
            };
        });

        // This ensures funnel values are always descending, which is a requirement for a funnel chart.
        // It's a safeguard, as the logic above should already produce descending values.
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i].value < data[i + 1].value) {
                data[i + 1].value = data[i].value;
            }
        }
        return data;

    }, [leads]);

    const colors = ['#0079C1', '#3399d6', '#66b3e1', '#99cceb'];

    if (funnelData.every(d => d.value === 0)) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </div>
                <p className="text-sm font-medium">No sales funnel data</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number, name: string) => [`${value} Leads`, name]}
                    />
                    <Funnel
                        dataKey="value"
                        data={funnelData}
                        isAnimationActive
                    >
                        {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                        ))}
                        <LabelList
                            position="right"
                            fill="#475569"
                            stroke="none"
                            dataKey="name"
                            style={{ fontSize: '11px', fontWeight: 600 }}
                        />
                        <LabelList
                            position="center"
                            fill="#ffffff"
                            stroke="none"
                            dataKey="value"
                            style={{ fontSize: '14px', fontWeight: 800 }}
                        />
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesFunnelChart;
