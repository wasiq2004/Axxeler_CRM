import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: React.ElementType;
  addon?: React.ReactNode;
  addonPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  label,
  required = false,
  error,
  icon: Icon,
  addon,
  addonPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  const classes = `${baseClasses} ${errorClasses} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        {addon ? (
          <div className="flex">
            {addonPosition === 'left' && addon}
            <input
              className={`${classes} ${Icon ? 'pl-10' : ''} ${addon ? (addonPosition === 'left' ? 'rounded-l-none' : 'rounded-r-none') : ''}`}
              required={required}
              {...props}
            />
            {addonPosition === 'right' && addon}
          </div>
        ) : (
          <input
            className={`${classes} ${Icon ? 'pl-10' : ''}`}
            required={required}
            {...props}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
