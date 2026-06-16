import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  responsive?: boolean;
  animated?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  responsive = false,
  animated = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed touch-target transition-all duration-300 ease-in-out';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm hover:shadow-md',
    secondary: 'bg-secondary text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-4 py-2 text-sm min-h-[44px] min-w-[44px]',
    lg: 'px-6 py-3 text-base min-h-[44px] min-w-[44px]'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Classes for responsive buttons that hide text on small screens
  const responsiveClasses = responsive ? 'sm:px-4 sm:py-2 sm:text-sm' : '';
  
  // Animation classes
  const animationClasses = animated ? 'transform hover:scale-105 active:scale-95' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${responsiveClasses} ${animationClasses} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-2" />}
      <span className={responsive ? 'hidden sm:inline' : ''}>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 sm:w-5 sm:h-5 ml-0 sm:ml-2" />}
    </button>
  );
};

export default Button;
