import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertCircle, Trash2, Eye, Calendar, Plus, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import ScheduleNotificationModal from './ScheduleNotificationModal';
import Button from '@/components/ui/Button';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, removeNotification, unreadCount, checkNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Check for new notifications when the page loads
  useEffect(() => {
    checkNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'invoice_due_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return 'border-l-4 border-l-red-500';
      case 'invoice_due_soon':
        return 'border-l-4 border-l-yellow-500';
      case 'payment_received':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-main flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-text-light mt-1">Manage your system notifications and alerts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              {unreadCount} unread
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="md" 
              onClick={() => setScheduleModalOpen(true)}
              icon={Plus}
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">Schedule Notification</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              size="md" 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">Mark All as Read</span>
              <span className="sm:hidden">Mark All</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-1">Filter:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'read'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 break-words">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 break-words">
                      {notification.message}
                    </p>
                    {notification.relatedEntityId && (
                      <div className="mt-2 text-xs text-gray-500">
                        Related to: {notification.relatedEntityType} #{notification.relatedEntityId}
                      </div>
                    )}
                    {notification.scheduledFor && (
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled for: {formatDate(notification.scheduledFor)}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex space-x-1 sm:space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-500 p-1"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(notification.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ScheduleNotificationModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setScheduleModalOpen(false)} 
      />
    </div>
  );
};

export default NotificationsPage;
