import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CreateLeadModal from '../../features/leads/components/CreateLeadModal';
import CreateContactModal from '../../features/contacts/components/CreateContactModal';
import CreateTaskModal from '../../features/tasks/components/CreateTaskModal';


interface ShellProps {
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <CreateLeadModal />
      <CreateContactModal />
      <CreateTaskModal />

    </div>
  );
};

export default Shell;
