import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Task, TaskPriority, TaskStatus } from '../types';

export interface NewTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  relatedTo?: {
    type: 'Lead' | 'Contact' | 'Deal';
    id: string;
    name: string;
  };
}

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (taskData: NewTaskData & { assignedToId?: string }) => Promise<void>;
  editTask: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated, user } = useAuth();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getTasks();
      setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchTasks();
    else setTasks([]);
  }, [isAuthenticated, fetchTasks]);

  const addTask = async (taskData: NewTaskData & { assignedToId?: string }) => {
    const res = await crmApi.createTask({
      title: taskData.title,
      description: taskData.description,
      status: 'Pending',
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      assignedToId: taskData.assignedToId || user?.id,
      relatedTo: taskData.relatedTo,
    });
    setTasks(prev => [res.data, ...prev]);
  };

  const editTask = async (taskId: string, taskData: Partial<Task>) => {
    const res = await crmApi.updateTask(taskId, taskData);
    setTasks(prev => prev.map(t => (t.id === taskId ? res.data : t)));
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const res = await crmApi.updateTaskStatus(taskId, status);
    setTasks(prev => prev.map(t => (t.id === taskId ? res.data : t)));
  };

  const deleteTask = async (taskId: string) => {
    await crmApi.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <TasksContext.Provider value={{ tasks, isLoading, addTask, editTask, updateTaskStatus, deleteTask, refresh: fetchTasks }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) throw new Error('useTasks must be used within a TasksProvider');
  return context;
};
