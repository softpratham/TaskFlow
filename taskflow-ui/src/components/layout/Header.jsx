import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount, getUnread, markAsRead, markAllAsRead } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Search,
  CheckCheck,
  CheckSquare,
  Clock,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  X,
} from 'lucide-react';

const TYPE_ICONS = {
  TASK_ASSIGNED: CheckSquare,
  STATUS_CHANGED: Clock,
  COMMENT_ADDED: MessageSquare,
  DEADLINE_REMINDER: AlertTriangle,
  MEMBER_ADDED: UserPlus,
};

const TYPE_COLORS = {
  TASK_ASSIGNED: 'text-blue-400 bg-blue-500/10',
  STATUS_CHANGED: 'text-yellow-400 bg-yellow-500/10',
  COMMENT_ADDED: 'text-green-400 bg-green-500/10',
  DEADLINE_REMINDER: 'text-red-400 bg-red-500/10',
  MEMBER_ADDED: 'text-indigo-400 bg-indigo-500/10',
};

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count || res.data || 0);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const loadUnread = async () => {
    try {
      const res = await getUnread();
      setNotifications(res.data.slice(0, 5)); // show latest 5
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleBellClick = () => {
    if (!showDropdown) {
      loadUnread();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      loadUnreadCount();
      loadUnread();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications([]);
      setShowDropdown(false);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left — Page context */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={24} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = TYPE_ICONS[notif.type] || Bell;
                    const color = TYPE_COLORS[notif.type] || 'text-slate-400 bg-slate-500/10';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-800/50 last:border-0"
                      >
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {getTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="w-full px-4 py-3 text-sm text-blue-400 hover:bg-slate-800/50 border-t border-slate-800 text-center font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;