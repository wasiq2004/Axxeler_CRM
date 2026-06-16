import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCampaignModule } from '../../contexts/CampaignModuleContext';
import Button from '@/components/ui/Button';

interface ParsedContact {
  phone: string;
  name: string;
  group?: string;
  tags: string[];
  customField1?: string;
  customField2?: string;
}

const ImportContactsPage: React.FC = () => {
  const { importContacts } = useCampaignModule();
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [createGroup, setCreateGroup] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        alert('CSV file is empty or invalid');
        return;
      }
      
      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Parse rows
      const contacts: ParsedContact[] = [];
      for (let i = 1; i < lines.length; i++) { // Parse all rows, not just first 5
        const values = lines[i].split(',').map(v => v.trim());
        const contact: Partial<ParsedContact> = {
          tags: []
        };
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          switch (header) {
            case 'phone':
              contact.phone = value;
              break;
            case 'name':
              contact.name = value;
              break;
            case 'group':
              contact.group = value;
              break;
            case 'tags':
              contact.tags = value ? value.split(',').map(tag => tag.trim()) : [];
              break;
            case 'custom_field_1':
              contact.customField1 = value;
              break;
            case 'custom_field_2':
              contact.customField2 = value;
              break;
          }
        });
        
        // Only add if phone and name are present
        if (contact.phone && contact.name) {
          contacts.push(contact as ParsedContact);
        }
      }
      
      setParsedContacts(contacts);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }
    
    if (createGroup && !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    setIsImporting(true);
    
    // Convert parsed contacts to the format expected by importContacts
    const contactsToImport = parsedContacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      normalizedPhone: contact.phone, // In a real app, you'd normalize this
      groupName: contact.group,
      tags: contact.tags,
      customFields: {
        custom_field_1: contact.customField1,
        custom_field_2: contact.customField2
      },
      source: 'import'
    }));
    
    // Import the contacts
    importContacts(contactsToImport);
    
    // Simulate import process
    setTimeout(() => {
      // In a real implementation, we would actually import the contacts
      const total = contactsToImport.length;
      const imported = total; // All contacts are imported in this mock
      const skipped = 0;
      const errors = 0;
      
      setImportSummary({ total, imported, skipped, errors });
      setIsImporting(false);
      
      // Show success message
      alert(`Successfully imported ${imported} contacts!`);
      
      // Reset form
      setFile(null);
      setParsedContacts([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const downloadSample = () => {
    const csvContent = `phone,name,group,tags,custom_field_1,custom_field_2
+1234567890,John Doe,Customers,"vip,premium",Manager,Technology
+1234567891,Jane Smith,Leads,"new,interested",Designer,Creative
+1234567892,Bob Johnson,Customers,"loyal",Developer,IT
+1234567893,Alice Williams,Prospects,"follow-up",Director,Marketing`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/campaigns" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-text-main">Import Contacts</h1>
        <p className="text-text-light mt-1">Upload a CSV file to import contacts into your CRM.</p>
      </div>

      {!importSummary ? (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supported format: CSV only</p>
              
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <Button 
                variant="outline" 
                size="md" 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              
              {file && (
                <div className="mt-4 text-sm text-gray-600">
                  Selected file: {file.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">CSV Format</h2>
              <Button 
                variant="outline" 
                size="sm" 
                icon={Download}
                onClick={downloadSample}
              >
                Download Sample CSV
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {`phone,name,group,tags,custom_field_1,custom_field_2
+1234567890,John Doe,Customers,"vip,premium",Manager,Technology
+1234567891,Jane Smith,Leads,"new,interested",Designer,Creative`}
              </pre>
            </div>
          </div>
          
          {parsedContacts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedContacts.map((contact, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.group || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.tags.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Import Options</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="createGroup"
                    checked={createGroup}
                    onChange={(e) => setCreateGroup(e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="createGroup" className="ml-2 block text-sm text-gray-700">
                    Create contact group
                  </label>
                </div>
                
                {createGroup && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import Contacts'}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Summary</h2>
          <p className="text-gray-600 mb-6">Import completed successfully!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{importSummary.total}</p>
              <p className="text-sm text-gray-500">Total Processed</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{importSummary.imported}</p>
              <p className="text-sm text-green-600">Successfully Imported</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">{importSummary.skipped}</p>
              <p className="text-sm text-yellow-600">Skipped (Duplicates)</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{importSummary.errors}</p>
              <p className="text-sm text-red-600">Errors</p>
            </div>
          </div>
          
          {createGroup && groupName && (
            <div className="mb-6">
              <p className="text-gray-700">
                Created group: <span className="font-semibold">{groupName}</span>
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
            <Button variant="outline" size="md">
              View Contacts
            </Button>
            <Button variant="primary" size="md">
              Create Campaign
            </Button>
            <Button 
              variant="outline" 
              size="md"
              onClick={() => {
                setImportSummary(null);
                setCreateGroup(false);
                setGroupName('');
              }}
            >
              Import More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportContactsPage;
