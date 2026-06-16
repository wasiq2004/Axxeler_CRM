import React from 'react';

interface CardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm h-full flex flex-col">
    <div className="flex items-center text-text-light mb-4">
      <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
      <h2 className="text-lg font-semibold text-text-main truncate">{title}</h2>
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export default Card;
