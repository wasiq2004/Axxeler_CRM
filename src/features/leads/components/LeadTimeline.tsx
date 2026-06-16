import React, { useState } from 'react';
import type { Note, Activity, Lead, TaskPriority } from '../../../types';
import { MessageSquare, Phone, Mail, Calendar, CheckSquare } from 'lucide-react';
import { useTimeline } from '../../../contexts/TimelineContext';
import { useTasks } from '../../../contexts/TasksContext';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '@/components/ui/Button';

interface LeadTimelineProps {
  lead: Lead;
  notes: Note[];
  activities: Activity[];
}

const iconMap: Record<Activity['type'], React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Task: CheckSquare,
};

const LeadTimeline: React.FC<LeadTimelineProps> = ({ lead, notes, activities }) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');


  const { addNote, logTaskCreation } = useTimeline();
  const { addTask: createNewTask } = useTasks();
  const { user } = useAuth();


  const timelineItems = [
    ...notes.map(note => ({ ...note, type: 'Note' as const, date: new Date(note.createdAt) })),
    ...activities.map(activity => ({ ...activity, date: new Date(activity.createdAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleAddNote = () => {
    if (noteContent.trim() === '') return;
    addNote(lead.id, noteContent);
    setNoteContent('');
  };
  
  const handleAddTask = () => {
    if (taskTitle.trim() === '' || !taskDueDate) {
        alert('Please provide a task title and a due date.');
        return;
    }
    // Create a full task in the central task management system
    createNewTask({
        title: taskTitle,
        description: taskContent,
        dueDate: taskDueDate,
        priority: taskPriority,
        relatedTo: {
            type: 'Lead',
            id: lead.id,
            name: `${lead.firstName} ${lead.lastName}`
        }
    });

    // Log a detailed activity to the timeline
    const taskDetails = [
      taskContent,
      `Priority: ${taskPriority}`,
      `Due: ${taskDueDate}`
    ].filter(Boolean).join(' | ');

    logTaskCreation(lead.id, taskTitle, taskDetails);
    
    // Reset form
    setTaskTitle('');
    setTaskContent('');
    setTaskDueDate('');
    setTaskPriority('Medium');
    setShowTaskForm(false);
  }

  const handleToggleTaskForm = () => {
      setShowTaskForm(!showTaskForm);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-3">Timeline</h2>
        <div className="space-y-6">
            {/* Add Note/Task Section */}
            <div className="pt-2 flex items-start space-x-3">
              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366F1&color=fff`} alt="current user" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <textarea 
                    rows={3} 
                    placeholder="Add a note..." 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
                <div className="mt-2 flex items-center space-x-2">
                    <button 
                        onClick={handleAddNote}
                        disabled={!noteContent.trim()}
                        className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Add Note
                    </button>
                    <Button
                      onClick={handleToggleTaskForm}
                      variant="outline"
                      size="sm"
                      icon={CheckSquare}
                      iconPosition="left"
                    >
                      {showTaskForm ? 'Cancel Task' : 'Create Task'}
                    </Button>
                </div>
              </div>
            </div>
            
            {/* Add Task Form (conditional) */}
            {showTaskForm && (
                <div className="pl-13 space-y-3 bg-gray-50 p-4 rounded-md border">
                    <h3 className="text-md font-semibold text-gray-800">New Task</h3>
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                     <textarea 
                        rows={2} 
                        placeholder="Add task details (optional)..." 
                        value={taskContent}
                        onChange={(e) => setTaskContent(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    ></textarea>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs text-gray-500 block mb-1">Due Date</label>
                             <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                             <label className="text-xs text-gray-500 block mb-1">Priority</label>
                             <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                                 <option>High</option>
                                 <option>Medium</option>
                                 <option>Low</option>
                             </select>
                         </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handleAddTask}
                        variant="primary"
                        size="sm"
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
            )}
            
            {/* Timeline Items */}
            <div className="flow-root">
                <ul className="-mb-8">
                    {timelineItems.map((item, itemIdx) => (
                    <li key={item.id}>
                        <div className="relative pb-8">
                            {itemIdx !== timelineItems.length - 1 ? (
                                <span className="absolute top-4 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                                {item.type === 'Note' ? (
                                    <>
                                        <div className="relative">
                                            <img className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white" src={item.authorAvatar} alt="" />
                                            <span className="absolute -bottom-0.5 -right-1 bg-white rounded-tl px-0.5 py-px">
                                                <MessageSquare className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div>
                                                <div className="text-sm">
                                                    <a href="#" className="font-medium text-gray-900">{item.authorName}</a>
                                                </div>
                                                <p className="mt-0.5 text-sm text-gray-500">{item.date.toLocaleString()}</p>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                                <p>{item.content}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                    <div>
                                        <div className="relative px-1">
                                            <div className="h-8 w-8 bg-gray-100 rounded-full ring-8 ring-white flex items-center justify-center">
                                                {React.createElement(iconMap[item.type], { className: 'h-5 w-5 text-gray-500', 'aria-hidden': true })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 py-1.5">
                                        <div className="text-sm text-gray-500">
                                            <p><span className="font-medium text-gray-900">{item.title}</span> by {item.authorName}</p>
                                            <p className="text-xs">{item.date.toLocaleString()}</p>
                                        </div>
                                        {item.content && (
                                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                                                <p className="whitespace-pre-wrap">{item.content.replace(/ \| /g, '\n')}</p>
                                            </div>
                                        )}
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  );
};

export default LeadTimeline;
