import React, { useState, useMemo } from 'react';
import { Plus, Search, Users as UsersIcon, Shield, User, Mail, Phone, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTeam, TeamMemberRole, TeamMemberStatus } from '../../contexts/TeamContext';
import EditTeamMemberModal from './components/EditTeamMemberModal';
import AddTeamMemberModal from './components/AddTeamMemberModal';

const TeamMembersPage: React.FC = () => {
    const { teamMembers, deleteTeamMember } = useTeam();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<TeamMemberRole | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<TeamMemberStatus | 'All'>('All');
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredMembers = useMemo(() => {
        let result = teamMembers;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (member) =>
                    member.name.toLowerCase().includes(query) ||
                    member.email.toLowerCase().includes(query) ||
                    member.phone.includes(query)
            );
        }

        // Role filter
        if (roleFilter !== 'All') {
            result = result.filter((member) => member.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'All') {
            result = result.filter((member) => member.status === statusFilter);
        }

        return result;
    }, [teamMembers, searchQuery, roleFilter, statusFilter]);

    const getRoleBadgeColor = (role: TeamMemberRole) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Manager':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Team Member':
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleIcon = (role: TeamMemberRole) => {
        switch (role) {
            case 'Admin':
                return <Shield className="w-4 h-4" />;
            case 'Manager':
                return <UsersIcon className="w-4 h-4" />;
            case 'Team Member':
                return <User className="w-4 h-4" />;
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove ${name} from the team?`)) {
            deleteTeamMember(id);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <UsersIcon className="w-8 h-8 text-primary" />
                        Team Members
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your team and their access permissions</p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    icon={Plus}
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white shadow-sm"
                >
                    Add Team Member
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Members</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{teamMembers.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <UsersIcon className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {teamMembers.filter((m) => m.status === 'Active').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Managers</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {teamMembers.filter((m) => m.role === 'Manager').length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Inactive</p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">
                                {teamMembers.filter((m) => m.status === 'Inactive').length}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <XCircle className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as TeamMemberRole | 'All')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="All">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Team Member">Team Member</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TeamMemberStatus | 'All')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Team Members Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Member
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permissions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {member.email}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {member.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                                member.role
                                            )}`}
                                        >
                                            {getRoleIcon(member.role)}
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${member.status === 'Active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {member.status === 'Active' ? (
                                                <CheckCircle className="w-3 h-3" />
                                            ) : (
                                                <XCircle className="w-3 h-3" />
                                            )}
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(member.joinedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {member.permissions.manageTeam && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                                                    Manage Team
                                                </span>
                                            )}
                                            {member.permissions.editLeads && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                    Edit Leads
                                                </span>
                                            )}
                                            {member.permissions.viewReports && (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                                                    View Reports
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingMemberId(member.id)}
                                                className="text-primary hover:text-primary-dark transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id, member.name)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No team members found</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <EditTeamMemberModal
                isOpen={editingMemberId !== null}
                onClose={() => setEditingMemberId(null)}
                memberId={editingMemberId}
            />
            <AddTeamMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
};

export default TeamMembersPage;
