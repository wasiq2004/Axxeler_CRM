import React from 'react';
import { ArrowRight, X, Database, User, Mail, Phone, Building } from 'lucide-react';
import Button from '@/components/ui/Button';

interface MappingModalProps {
    onClose: () => void;
    onConfirmImport: () => void;
    selectedCount: number;
}

const MappingRow = ({ adField, crmField, icon }: { adField: string, crmField: string, icon: React.ReactNode }) => (
    <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 rounded-lg">
        <div className="col-span-5 flex items-center">
            <div className="flex items-center text-sm text-gray-700">
                {icon}
                <span className="ml-2">{adField}</span>
            </div>
        </div>
        <div className="col-span-2 text-center">
            <ArrowRight className="w-5 h-5 text-gray-400 inline-block" />
        </div>
        <div className="col-span-5">
            <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700">
                {crmField}
            </div>
        </div>
    </div>
)

const MappingModal: React.FC<MappingModalProps> = ({ onClose, onConfirmImport, selectedCount }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-text-main">Field Mapping for Lead Import</h2>
                    <button 
                      onClick={onClose} 
                      className="p-1 hover:bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        The following field mappings will be used when importing leads into your CRM. 
                        Leads will be automatically mapped based on these field associations.
                    </p>
                    
                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-4 mb-2">
                            <div className="col-span-5">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Meta Ad Form Field</h3>
                            </div>
                             <div className="col-span-2"></div>
                            <div className="col-span-5">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">CRM Lead Field</h3>
                            </div>
                        </div>
                        
                        <MappingRow 
                            adField="Full Name" 
                            crmField="First Name + Last Name" 
                            icon={<User className="w-4 h-4 text-gray-500" />} 
                        />
                        <MappingRow 
                            adField="Email Address" 
                            crmField="Email" 
                            icon={<Mail className="w-4 h-4 text-gray-500" />} 
                        />
                        <MappingRow 
                            adField="Phone Number" 
                            crmField="Phone" 
                            icon={<Phone className="w-4 h-4 text-gray-500" />} 
                        />
                        <MappingRow 
                            adField="Company Name" 
                            crmField="Company" 
                            icon={<Building className="w-4 h-4 text-gray-500" />} 
                        />
                        <MappingRow 
                            adField="Form Data" 
                            crmField="Lead Source" 
                            icon={<Database className="w-4 h-4 text-gray-500" />} 
                        />
                    </div>
                    
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-2">Import Summary</h4>
                        <p className="text-blue-700 text-sm">
                            You are about to import <strong>{selectedCount}</strong> lead{selectedCount !== 1 ? 's' : ''} into your CRM. 
                            All imported leads will be tagged with "Meta Ad" and assigned to your default user.
                        </p>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end items-center space-x-3 rounded-b-lg">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={onConfirmImport}
                    >
                      Confirm Import
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MappingModal;
