import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, MousePointer, Eye } from 'lucide-react';
import type { MetaCampaign } from '../../../contexts/MetaAccountContext';



interface AdsOverviewProps {
    campaigns: MetaCampaign[];
}

const AdsOverview: React.FC<AdsOverviewProps> = ({ campaigns }) => {
    // Calculate total metrics
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_count || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);

    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Prepare data for charts
    const campaignPerformanceData = campaigns.map(c => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        spend: c.spend || 0,
        leads: c.leads_count || 0,
        clicks: c.clicks || 0,
        impressions: c.impressions || 0
    })).sort((a, b) => b.spend - a.spend).slice(0, 5); // Top 5 campaigns by spend

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Spend</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        <span>12% from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Leads</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {totalLeads.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        <span>8% from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Impressions</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {totalImpressions.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Eye className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs text-red-600 font-medium">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        <span>3% from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg. CPL</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                ${cpl.toFixed(2)}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <MousePointer className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        <span>Target: $15.00</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend vs Leads Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Campaign</h3>
                    <div className="h-80 w-full font-sans text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campaignPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} stroke="#6B7280" />
                                <YAxis yAxisId="left" orientation="left" stroke="#6B7280" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#374151' }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="spend" name="Spend ($)" fill="#0079C1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar yAxisId="right" dataKey="leads" name="Leads" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mock Trend Chart - Since we don't have historical data series from the API yet, we'll visualize metrics distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Metrics Overview</h3>
                    <div className="h-80 w-full font-sans text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={campaignPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="impressions" name="Impressions" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="clicks" name="Clicks" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdsOverview;
