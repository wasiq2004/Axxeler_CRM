import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  index?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, index = 0 }) => {
  return (
    <div
      className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 animate-slideUp group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-bold text-text-main truncate group-hover:text-primary transition-colors">
          {value}
        </p>
      </div>
      <div className="bg-primary/5 p-2 rounded-lg flex-shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
};

export default StatsCard;
