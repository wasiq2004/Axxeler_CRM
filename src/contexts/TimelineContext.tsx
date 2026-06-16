import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Note, Activity } from '../types';

interface TimelineContextType {
  notes: Note[];
  activities: Activity[];
  isLoading: boolean;
  loadLeadTimeline: (leadId: string) => Promise<void>;
  addNote: (leadId: string, content: string) => Promise<void>;
  logTaskCreation: (leadId: string, taskTitle: string, taskDetails: string) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const TimelineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { user } = useAuth();

  const loadLeadTimeline = useCallback(async (leadId: string) => {
    setIsLoading(true);
    try {
      const [notesRes, leadRes] = await Promise.all([
        crmApi.getLeadNotes(leadId),
        crmApi.getLead(leadId),
      ]);
      setNotes(notesRes.data || []);
      setActivities(leadRes.data?.activities || []);
    } catch {
      setNotes([]);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  const addNote = async (leadId: string, content: string) => {
    const res = await crmApi.addLeadNote(leadId, { content });
    const newNote: Note = res.data;
    setNotes(prev => [newNote, ...prev]);
  };

  const logTaskCreation = (leadId: string, taskTitle: string, taskDetails: string) => {
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      leadId,
      type: 'Task',
      title: `Task Created: ${taskTitle}`,
      content: taskDetails,
      authorName: user?.name || 'User',
      createdAt: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  return (
    <TimelineContext.Provider value={{ notes, activities, isLoading, loadLeadTimeline, addNote, logTaskCreation }}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) throw new Error('useTimeline must be used within a TimelineProvider');
  return context;
};
