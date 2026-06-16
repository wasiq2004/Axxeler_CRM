import React, { useState, useMemo } from 'react';
import { BarChart2, PieChart, Users, DollarSign, Download, Calendar, TrendingUp, Target, FileText } from 'lucide-react';
import SalesFunnelChart from './components/SalesFunnelChart';
import LeadSourceChart from './components/LeadSourceChart';
import RevenueChart from './components/RevenueChart';
import DealStageChart from './components/DealStageChart';
import { useLeads } from '../../contexts/LeadsContext';
import { useDeals } from '../../contexts/DealsContext';
import { useInvoices } from '../../contexts/InvoicesContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportKPI = ({ title, value, trend, icon: Icon, color }: { title: string; value: string; trend?: string; icon: React.ElementType; color: string }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all duration-300">
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{value}</h3>
            {trend && (
                <div className="flex items-center mt-2 text-xs font-medium text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {trend} vs last quarter
                </div>
            )}
        </div>
        <div className={`${color} p-2.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
    </div>
);

const ReportCard = ({ title, description, icon: Icon, children }: { title: string; description?: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-slideUp">
        <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/5 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {description && <p className="text-sm text-gray-500 mb-6 ml-10">{description}</p>}
        <div className="flex-1 min-h-[300px]">{children}</div>
    </div>
);

const ReportsPage: React.FC = () => {
    const [quarter, setQuarter] = useState<number>(1);
    const [year] = useState<number>(2025);

    const { leads } = useLeads();
    const { deals } = useDeals();
    const { invoices } = useInvoices();
    const { currency } = useCurrency();

    // Statistics for the selected quarter
    const stats = useMemo(() => {
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;

        const filteredLeads = leads.filter(l => {
            const date = new Date(l.createdAt);
            return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
        });

        const filteredDeals = deals.filter(d => {
            const date = new Date(d.closeDate);
            return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
        });

        const filteredInvoices = invoices.filter(i => {
            const date = new Date(i.issueDate);
            return date.getFullYear() === year && date.getMonth() >= startMonth && date.getMonth() <= endMonth;
        });

        const revenue = filteredInvoices
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => {
                const subtotal = (i.items || []).reduce((s, item) => s + Number(item.price) * item.quantity, 0);
                return sum + subtotal + subtotal * ((i.taxRate || 0) / 100);
            }, 0);

        const wonDealsCount = filteredDeals.filter(d => d.stage === 'Closed - Won').length;

        return {
            newLeads: filteredLeads.length.toString(),
            dealsClosed: wonDealsCount.toString(),
            revenue: `${currency.symbol}${(revenue / 1000).toFixed(1)}k`,
            avgDealValue: filteredDeals.length > 0 ? `${currency.symbol}${(filteredDeals.reduce((sum, d) => sum + Number(d.value), 0) / filteredDeals.length / 1000).toFixed(1)}k` : `${currency.symbol}0k`
        };
    }, [leads, deals, invoices, quarter, year]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        const quarterLabel = `Q${quarter} ${year}`;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 121, 193); // Primary color
        doc.text('Axxeler CRM - Quarterly Sales Report', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Report Period: ${quarterLabel}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 37);

        // Summary Table
        autoTable(doc, {
            startY: 45,
            head: [['Metric', 'Value']],
            body: [
                ['Total New Leads', stats.newLeads],
                ['Deals Won', stats.dealsClosed],
                ['Total Revenue', stats.revenue],
                ['Avg. Deal Value', stats.avgDealValue],
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 121, 193] },
        });

        // Add a note
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Performance Summary', 14, finalY);
        doc.setFontSize(10);
        doc.text(`In ${quarterLabel}, the team generated ${stats.newLeads} leads and secured ${stats.revenue} in paid revenue.`, 14, finalY + 7);

        doc.save(`Axxeler_CRM_Report_${quarterLabel.replace(' ', '_')}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <BarChart2 className="w-8 h-8 text-primary" />
                        Executive Reports
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Detailed performance analytics and business insights.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                        {[1, 2, 3, 4].map((q) => (
                            <button
                                key={q}
                                onClick={() => setQuarter(q)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${quarter === q
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Q{q}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPI title="New Leads" value={stats.newLeads} trend="+12%" icon={Users} color="bg-blue-500" />
                <ReportKPI title="Deals Won" value={stats.dealsClosed} trend="+5%" icon={Target} color="bg-emerald-500" />
                <ReportKPI title="Total Revenue" value={stats.revenue} trend="+8%" icon={DollarSign} color="bg-violet-500" />
                <ReportKPI title="Avg Deal Value" value={stats.avgDealValue} trend="+2%" icon={TrendingUp} color="bg-orange-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ReportCard
                    title="Revenue Performance"
                    description="Monthly revenue breakdown for the selected quarter."
                    icon={DollarSign}
                >
                    <RevenueChart quarter={quarter} year={year} />
                </ReportCard>

                <ReportCard
                    title="Sales Funnel"
                    description="Lead conversion stages and drop-off rates."
                    icon={PieChart}
                >
                    <SalesFunnelChart quarter={quarter} year={year} />
                </ReportCard>

                <ReportCard
                    title="Lead Sources"
                    description="Where your most qualified leads are originating."
                    icon={Users}
                >
                    <LeadSourceChart quarter={quarter} year={year} />
                </ReportCard>

                <ReportCard
                    title="Deal Stages"
                    description="Current distribution of deals in the pipeline."
                    icon={Calendar}
                >
                    <DealStageChart quarter={quarter} year={year} />
                </ReportCard>
            </div>

            {/* Footer space */}
            <div className="h-10"></div>
        </div>
    );
};

export default ReportsPage;
