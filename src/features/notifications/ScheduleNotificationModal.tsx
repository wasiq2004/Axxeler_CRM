import React, { useState } from 'react';
import { X, Calendar, Clock, Send } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import Button from '@/components/ui/Button';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleNotificationModal: React.FC<ScheduleNotificationModalProps> = ({ isOpen, onClose }) => {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [relatedEntityType, setRelatedEntityType] = useState<'invoice' | 'lead' | 'deal' | ''>('');
  const [relatedEntityId, setRelatedEntityId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Combine date and time
    const scheduledFor = scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : undefined;
    
    addNotification({
      type: 'general',
      title,
      message,
      relatedEntityType: relatedEntityType || undefined,
      relatedEntityId: relatedEntityId || undefined,
      scheduledFor,
    });
    
    // Reset form
    setTitle('');
    setMessage('');
    setScheduleDate('');
    setScheduleTime('');
    setRelatedEntityType('');
    setRelatedEntityId('');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Notification</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Entity (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
              >
                <option value="">Select type</option>
                <option value="invoice">Invoice</option>
                <option value="lead">Lead</option>
                <option value="deal">Deal</option>
              </select>
              <input
                type="text"
                value={relatedEntityId}
                onChange={(e) => setRelatedEntityId(e.target.value)}
                placeholder="Entity ID"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule For (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={Send}
              className="w-full sm:w-auto"
            >
              Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleNotificationModal;
