import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };
  
  const colClasses = [
    cols.xs ? `grid-cols-${cols.xs}` : 'grid-cols-1',
    cols.sm ? `sm:grid-cols-${cols.sm}` : 'sm:grid-cols-1',
    cols.md ? `md:grid-cols-${cols.md}` : 'md:grid-cols-2',
    cols.lg ? `lg:grid-cols-${cols.lg}` : 'lg:grid-cols-3',
    cols.xl ? `xl:grid-cols-${cols.xl}` : 'xl:grid-cols-4'
  ].join(' ');
  
  return (
    <div className={`grid ${colClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
