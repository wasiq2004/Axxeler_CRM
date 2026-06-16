import React from 'react';
import { X } from 'lucide-react';
import Button from '../../ui/Button';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  maxWidth = 'lg'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} transform transition-all max-h-[90vh] flex flex-col`}>
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-text-main">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
          
          {(onSubmit || submitButtonText || cancelButtonText) && (
            <div className="p-6 bg-gray-50 border-t flex justify-end items-center space-x-3 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
              >
                {cancelButtonText}
              </Button>
              {onSubmit && (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  {submitButtonText}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BaseModal;
