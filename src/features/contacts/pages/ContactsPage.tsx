import React, { useState, useMemo } from 'react';
import { Sparkles, PlayCircle, Search, Plus, ChevronsUpDown, ChevronDown, ChevronLeft, ChevronRight, Info, ChevronUp, MoreHorizontal, Edit, Upload, Trash2, X, Loader2, Mail } from 'lucide-react';
import { useContacts } from '@/contexts/ContactsContext';
import { useUI } from '@/contexts/UIContext';
import type { Contact } from '@/types';
import Button from '@/components/ui/Button';
import EditContactModal from '@/features/contacts/components/EditContactModal';
import CsvImportModal from '@/features/contacts/components/CsvImportModal';
import ComposeEmailModal from '@/features/contacts/components/ComposeEmailModal';
import { useApi } from '@/contexts/ApiContext';
import { useNavigate } from 'react-router-dom';

const ContactsTable: React.FC<{
    contacts: Contact[];
    requestSort: (key: keyof Contact) => void;
    sortConfig: { key: keyof Contact; direction: 'ascending' | 'descending' } | null;
    onSelectContact: (contact: Contact) => void;
    onDeleteContact: (contactId: string, name: string) => void;
    onEmailContact: (contact: Contact) => void;
    selectedIds: Set<string>;
    onToggleOne: (id: string) => void;
    onToggleAll: () => void;
    allSelected: boolean;
}> = ({ contacts, requestSort, sortConfig, onSelectContact, onDeleteContact, onEmailContact, selectedIds, onToggleOne, onToggleAll, allSelected }) => {
    const getSortIcon = (key: keyof Contact) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-40 transition-transform duration-200" />;
        }
        return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1 transition-transform duration-200" /> : <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-200" />;
    };

    const [showActions, setShowActions] = useState<string | null>(null);

    const handleEditClick = (contact: Contact) => {
        onSelectContact(contact);
        setShowActions(null);
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={onToggleAll}
                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                            />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button onClick={() => requestSort('name')} className="flex items-center group hover:text-gray-900 transition-colors duration-200">
                                Name <span className="group-hover:scale-110 transition-transform duration-200">{getSortIcon('name')}</span>
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button onClick={() => requestSort('phone')} className="flex items-center group hover:text-gray-900 transition-colors duration-200">
                                Mobile Number <span className="group-hover:scale-110 transition-transform duration-200">{getSortIcon('phone')}</span>
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button onClick={() => requestSort('source')} className="flex items-center group hover:text-gray-900 transition-colors duration-200">
                                Source <span className="group-hover:scale-110 transition-transform duration-200">{getSortIcon('source')}</span>
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact, index) => (
                        <tr
                            key={contact.id}
                            className={`hover:bg-gray-50 transition-colors duration-200 group ${selectedIds.has(contact.id) ? 'bg-primary/5' : ''}`}
                            style={{ transitionDelay: `${index * 30}ms` }}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(contact.id)}
                                    onChange={() => onToggleOne(contact.id)}
                                    onClick={e => e.stopPropagation()}
                                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 transition-colors duration-200 group-hover:text-primary">
                                    {contact.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex flex-wrap gap-1">
                                    {contact.tags.map(tag => (
                                        <span key={tag} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 transition-all duration-300 hover:bg-blue-200 hover:scale-105">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.source}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActions(showActions === contact.id ? null : contact.id)}
                                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-200"
                                    >
                                        <MoreHorizontal className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
                                    </button>
                                    {showActions === contact.id && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fadeIn">
                                            <div className="py-1" role="menu">
                                                <button
                                                    onClick={() => handleEditClick(contact)}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                    role="menuitem"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => { onEmailContact(contact); setShowActions(null); }}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                    role="menuitem"
                                                >
                                                    <Mail className="w-4 h-4 mr-2" /> Send Email
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onDeleteContact(contact.id, contact.name || 'this contact');
                                                        setShowActions(null);
                                                    }}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                    role="menuitem"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ContactsPage: React.FC = () => {
    const { contacts, deleteContact, refresh } = useContacts();
    const { openCreateContactModal, openEditContactModal, isEditContactModalOpen } = useUI();
    const { crmApi } = useApi();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'ascending' | 'descending' } | null>(null);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [emailContact, setEmailContact] = useState<Contact | null>(null);

    const filteredContacts = useMemo(() => {
        if (!searchQuery) return contacts;
        const lowercasedQuery = searchQuery.toLowerCase();
        return contacts.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(lowercasedQuery)) ||
            (contact.phone && contact.phone.toLowerCase().includes(lowercasedQuery))
        );
    }, [contacts, searchQuery]);

    const sortedContacts = useMemo(() => {
        let sortableItems = [...filteredContacts];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'name') {
                    const aName = a.name || '';
                    const bName = b.name || '';
                    return sortConfig.direction === 'ascending' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredContacts, sortConfig]);

    const requestSort = (key: keyof Contact) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        openEditContactModal();
    };

    const handleDeleteContact = (contactId: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteContact(contactId);
            setSelectedIds(prev => { const next = new Set(prev); next.delete(contactId); return next; });
        }
    };

    const allSelected = sortedContacts.length > 0 && sortedContacts.every(c => selectedIds.has(c.id));

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedContacts.map(c => c.id)));
        }
    };

    const toggleOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (!window.confirm(`Delete ${ids.length} contact(s)? This cannot be undone.`)) return;
        setBulkLoading(true);
        try {
            await crmApi.bulkDeleteContacts(ids);
            await refresh();
            setSelectedIds(new Set());
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Contacts <span className="text-primary/50 text-sm font-bold ml-1">{contacts.length}</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) { setImportFile(file); e.target.value = ''; }
                            }}
                        />
                        <Button
                            variant="outline"
                            size="md"
                            icon={Upload}
                            onClick={() => fileInputRef.current?.click()}
                            className="!bg-white !text-gray-600 !border-gray-100 hover:!bg-gray-50 !rounded-xl !font-bold text-[10px] uppercase tracking-widest shadow-sm"
                        >
                            Import
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            icon={Plus}
                            onClick={openCreateContactModal}
                            className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200 transform active:scale-95 transition-all w-full sm:w-auto"
                        >
                            Add Contact
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-primary text-white rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-semibold shadow-md">
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-black">{selectedIds.size}</span>
                    )}
                    <span className="flex-1">{selectedIds.size} contact{selectedIds.size > 1 ? 's' : ''} selected</span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkLoading}
                        className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                    >
                        <Trash2 className="w-3 h-3" /> Delete Selected
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Contacts List */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 transition-all duration-300 hover:shadow-md overflow-hidden">
                <div className="transition-all duration-500 ease-in-out">
                    <ContactsTable
                        contacts={sortedContacts}
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                        onSelectContact={handleSelectContact}
                        onDeleteContact={handleDeleteContact}
                        onEmailContact={setEmailContact}
                        selectedIds={selectedIds}
                        onToggleOne={toggleOne}
                        onToggleAll={toggleAll}
                        allSelected={allSelected}
                    />
                </div>

                <div className="p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end text-[10px] font-black uppercase tracking-widest text-gray-400 space-x-4">
                    <span>{sortedContacts.length} total records</span>
                    <div className="flex items-center space-x-1">
                        <select className="bg-white border-gray-200 rounded-lg shadow-sm text-[10px] font-black p-1.5 focus:border-primary focus:ring-primary transition-all duration-200">
                            <option>25 per page</option>
                            <option>50 per page</option>
                            <option>100 per page</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-300 hover:text-gray-900 disabled:opacity-30" disabled>
                            <ChevronLeft size={14} />
                        </button>
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-300 hover:text-gray-900 disabled:opacity-30" disabled>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
            {isEditContactModalOpen && selectedContact && <EditContactModal contact={selectedContact} />}
            {importFile && <CsvImportModal file={importFile} onClose={() => setImportFile(null)} />}
            {emailContact && <ComposeEmailModal contact={emailContact} onClose={() => setEmailContact(null)} />}
        </div>
    );
};

export default ContactsPage;
