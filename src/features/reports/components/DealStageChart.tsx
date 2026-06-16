import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDeals } from '../../../contexts/DealsContext';

interface DealStageChartProps {
    quarter?: number;
    year?: number;
}

const DealStageChart: React.FC<DealStageChartProps> = ({ quarter, year = 2025 }) => {
    const { deals } = useDeals();

    const chartData = useMemo(() => {
        let filteredDeals = deals;

        if (quarter) {
            const startMonth = (quarter - 1) * 3;
            const endMonth = startMonth + 2;
            filteredDeals = deals.filter(deal => {
                const date = new Date(deal.closeDate);
                return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
            });
        }

        const stageData: Record<string, { count: number; value: number }> = {};

        filteredDeals.forEach(deal => {
            const stage = deal.stage;

            if (!stageData[stage]) {
                stageData[stage] = { count: 0, value: 0 };
            }

            stageData[stage].count += 1;
            stageData[stage].value += Number(deal.value);
        });

        // Convert to array
        return Object.entries(stageData)
            .map(([name, data]) => ({
                name,
                count: data.count,
                value: parseFloat(data.value.toFixed(2))
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [deals, quarter, year]);

    const colors = ['#0079C1', '#3399d6', '#66b3e1', '#99cceb', '#cce5f5'];

    if (chartData.length === 0) {
        return (
            <div className="h-64 w-full flex items-center justify-center text-gray-500">
                No deal data available.
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="count" orientation="left" />
                    <YAxis yAxisId="value" orientation="right" />
                    <Tooltip
                        formatter={(value: number, name: string) => {
                            if (name === 'count') {
                                return [value, 'Deals'];
                            }
                            return [`$${value.toLocaleString()}`, 'Value'];
                        }}
                    />
                    <Bar yAxisId="count" dataKey="count" name="Deals" fill={colors[0]} />
                    <Bar yAxisId="value" dataKey="value" name="Value" fill={colors[2]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DealStageChart;
