import React, { useState } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { useTeam, TeamMemberRole, TeamMemberStatus } from '../../../contexts/TeamContext';
import { useApi } from '../../../contexts/ApiContext';

interface AddTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_PERMISSIONS = {
    viewLeads: false,
    editLeads: false,
    deleteLeads: false,
    viewDeals: false,
    editDeals: false,
    manageTeam: false,
    viewReports: false,
    exportData: false,
};

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ isOpen, onClose }) => {
    const { addTeamMember } = useTeam();
    const { crmApi } = useApi();
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Team Member' as TeamMemberRole,
        status: 'Active' as TeamMemberStatus,
        avatar: '',
        joinedDate: new Date().toISOString().split('T')[0],
        permissions: DEFAULT_PERMISSIONS,
    });

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await crmApi.uploadImage(file);
            setFormData((prev) => ({ ...prev, avatar: res.data.url }));
        } catch (err: any) {
            alert(err?.message || 'Failed to upload image. Please try a smaller image (max 5 MB).');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Generate avatar URL based on name if no photo uploaded
        const avatarUrl = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366F1&color=fff`;

        addTeamMember({
            ...formData,
            avatar: avatarUrl,
        });

        // Reset form
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'Team Member',
            status: 'Active',
            avatar: '',
            joinedDate: new Date().toISOString().split('T')[0],
            permissions: DEFAULT_PERMISSIONS,
        });

        onClose();
    };

    const handleRoleChange = (role: TeamMemberRole) => {
        let newPermissions = { ...DEFAULT_PERMISSIONS };

        if (role === 'Admin') {
            newPermissions = {
                viewLeads: true,
                editLeads: true,
                deleteLeads: true,
                viewDeals: true,
                editDeals: true,
                manageTeam: true,
                viewReports: true,
                exportData: true,
            };
        } else if (role === 'Manager') {
            newPermissions = {
                viewLeads: true,
                editLeads: true,
                deleteLeads: false,
                viewDeals: true,
                editDeals: true,
                manageTeam: true,
                viewReports: true,
                exportData: true,
            };
        } else if (role === 'Team Member') {
            newPermissions = {
                viewLeads: true,
                editLeads: true,
                deleteLeads: false,
                viewDeals: false,
                editDeals: false,
                manageTeam: false,
                viewReports: false,
                exportData: false,
            };
        }

        setFormData({ ...formData, role, permissions: newPermissions });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                                {formData.avatar ? (
                                    <img
                                        src={formData.avatar}
                                        alt="ProfilePreview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-dark transition-all duration-200 transform hover:scale-110 group-hover:rotate-12">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">
                            Click camera to upload profile photo
                        </p>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Basic Information
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="+1-555-000-0000"
                            />
                        </div>
                    </div>

                    {/* Role & Status */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Role & Status
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => handleRoleChange(e.target.value as TeamMemberRole)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Team Member">Team Member</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Role determines default permissions
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value as TeamMemberStatus })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Permissions
                        </h3>
                        <p className="text-xs text-gray-500">
                            Customize permissions or use role defaults
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {Object.entries(formData.permissions).map(([key, value]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded-lg transition-all duration-200 group/checkbox">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        permissions: {
                                                            ...formData.permissions,
                                                            [key]: e.target.checked,
                                                        },
                                                    })
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="w-4 h-4 border-2 border-gray-300 rounded bg-white peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 ease-out shadow-sm group-hover/checkbox:border-primary/60"></div>
                                            <svg className="w-2.5 h-2.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-700 select-none">
                                            {key
                                                .replace(/([A-Z])/g, ' $1')
                                                .replace(/^./, (str) => str.toUpperCase())
                                                .trim()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                        >
                            Add Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeamMemberModal;
