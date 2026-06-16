import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UIContextType {
  isCreateLeadModalOpen: boolean;
  openCreateLeadModal: () => void;
  closeCreateLeadModal: () => void;
  isEditLeadModalOpen: boolean;
  openEditLeadModal: () => void;
  closeEditLeadModal: () => void;
  isCreateContactModalOpen: boolean;
  openCreateContactModal: () => void;
  closeCreateContactModal: () => void;
  isEditContactModalOpen: boolean;
  openEditContactModal: () => void;
  closeEditContactModal: () => void;
  isCreateTaskModalOpen: boolean;
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;
  isEditTaskModalOpen: boolean;
  openEditTaskModal: () => void;
  closeEditTaskModal: () => void;
  isCreateAccountModalOpen: boolean;
  openCreateAccountModal: () => void;
  closeCreateAccountModal: () => void;
  isEditDealModalOpen: boolean;
  openEditDealModal: () => void;
  closeEditDealModal: () => void;
  isCreateDealModalOpen: boolean;
  openCreateDealModal: () => void;
  closeCreateDealModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCreateLeadModalOpen, setCreateLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setEditLeadModalOpen] = useState(false);
  const [isCreateContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [isEditContactModalOpen, setEditContactModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [isEditDealModalOpen, setEditDealModalOpen] = useState(false);
  const [isCreateDealModalOpen, setCreateDealModalOpen] = useState(false);

  const openCreateLeadModal = () => setCreateLeadModalOpen(true);
  const closeCreateLeadModal = () => setCreateLeadModalOpen(false);

  const openEditLeadModal = () => setEditLeadModalOpen(true);
  const closeEditLeadModal = () => setEditLeadModalOpen(false);

  const openCreateContactModal = () => setCreateContactModalOpen(true);
  const closeCreateContactModal = () => setCreateContactModalOpen(false);

  const openEditContactModal = () => setEditContactModalOpen(true);
  const closeEditContactModal = () => setEditContactModalOpen(false);

  const openCreateTaskModal = () => setCreateTaskModalOpen(true);
  const closeCreateTaskModal = () => setCreateTaskModalOpen(false);
  
  const openEditTaskModal = () => setEditTaskModalOpen(true);
  const closeEditTaskModal = () => setEditTaskModalOpen(false);
  
  const openCreateAccountModal = () => setCreateAccountModalOpen(true);
  const closeCreateAccountModal = () => setCreateAccountModalOpen(false);
  
  const openEditDealModal = () => setEditDealModalOpen(true);
  const closeEditDealModal = () => setEditDealModalOpen(false);
  
  const openCreateDealModal = () => setCreateDealModalOpen(true);
  const closeCreateDealModal = () => setCreateDealModalOpen(false);

  return (
    <UIContext.Provider value={{ 
      isCreateLeadModalOpen, openCreateLeadModal, closeCreateLeadModal,
      isEditLeadModalOpen, openEditLeadModal, closeEditLeadModal,
      isCreateContactModalOpen, openCreateContactModal, closeCreateContactModal,
      isEditContactModalOpen, openEditContactModal, closeEditContactModal,
      isCreateTaskModalOpen, openCreateTaskModal, closeCreateTaskModal,
      isEditTaskModalOpen, openEditTaskModal, closeEditTaskModal,
      isCreateAccountModalOpen, openCreateAccountModal, closeCreateAccountModal,
      isEditDealModalOpen, openEditDealModal, closeEditDealModal,
      isCreateDealModalOpen, openCreateDealModal, closeCreateDealModal
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
