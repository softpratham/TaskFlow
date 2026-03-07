import { useState, useEffect } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../api/notifications';
import {
  Bell,
  CheckCheck,
  Loader2,
  CheckSquare,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Clock,
  BellOff,
} from 'lucide-react';

const TYPE_CONFIG = {
  TASK_ASSIGNED: {
    icon: CheckSquare,
    color: 'text-blue-400 bg-blue-500/10',
  },
  STATUS_CHANGED: {
    icon: Clock,
    color: 'text-yellow-400 bg-yellow-500/10',
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: 'text-green-400 bg-green-500/10',
  },
  DEADLINE_REMINDER: {
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-500/10',
  },
  MEMBER_ADDED: {
    icon: UserPlus,
    color: 'text-indigo-400 bg-indigo-500/10',
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  color: 'text-slate-400 bg-slate-500/10',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'all'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'unread'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-slate-500">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'Notifications will appear when tasks are assigned, updated, or commented on'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-900/50 border-slate-800/50'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${config.color}`}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      notif.read ? 'text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{getTimeAgo(notif.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;