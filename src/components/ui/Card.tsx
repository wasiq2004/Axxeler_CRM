import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  icon: Icon,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm h-full flex flex-col ${className}`}>
      {(title || Icon) && (
        <div className={`flex items-center text-text-light p-4 sm:p-6 border-b ${headerClassName}`}>
          {Icon && <Icon className="w-5 h-5 mr-2" />}
          {title && <h2 className="text-lg font-semibold text-text-main">{title}</h2>}
        </div>
      )}
      <div className={`flex-1 p-4 sm:p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
