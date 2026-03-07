import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../api/notifications';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count || res.data || 0);
    } catch (err) {
      // silent fail
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { to: '/profile', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-[70px]' : 'w-[250px]'
      } h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 border-r border-slate-700/50 flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-700/50">
        <img src="/Logo.png" alt="TaskFlow" className="w-8 h-8 rounded-lg flex-shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">TaskFlow</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}

            {/* Badge */}
            {item.badge > 0 && (
              <span
                className={`${
                  collapsed
                    ? 'absolute -top-1 -right-1'
                    : 'ml-auto'
                } w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center`}
              >
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700/50 p-3">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400">
              {user?.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};

export default Sidebar;