import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProjects } from '../../api/projects';
import { getDashboard } from '../../api/dashboard';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  BLOCKED: '#ef4444',
  DONE: '#22c55e',
};

const PRIORITY_COLORS = {
  LOW: '#64748b',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadDashboard(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await getMyProjects();
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProject(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (projectId) => {
    setDashLoading(true);
    try {
      const res = await getDashboard(projectId);
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setDashLoading(false);
    }
  };

  const getStatusData = () => {
    if (!dashboard) return [];
    const map = dashboard.tasksByStatus || {};
    return Object.entries(map).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      color: STATUS_COLORS[name] || '#64748b',
    }));
  };

  const getPriorityData = () => {
    if (!dashboard) return [];
    const map = dashboard.tasksByPriority || {};
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name] || '#64748b',
    }));
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
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening across your projects</p>
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go to Projects
          </button>
        </div>
      ) : dashLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : dashboard ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BarChart3}
              label="Total Tasks"
              value={dashboard.totalTasks}
              color="blue"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={dashboard.tasksByStatus?.DONE || 0}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={dashboard.tasksByStatus?.IN_PROGRESS || 0}
              color="yellow"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={dashboard.overdueTasks || 0}
              color="red"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Tasks by Status
              </h3>
              {getStatusData().length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={getStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {getStatusData().map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {getStatusData().map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-slate-400">{entry.name}</span>
                        <span className="text-sm font-semibold text-white ml-auto">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No tasks yet</p>
              )}
            </div>

            {/* Priority Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Tasks by Priority
              </h3>
              {getPriorityData().length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={getPriorityData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {getPriorityData().map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Completion Rate
              </h3>
              <span className="text-2xl font-bold text-white">
                {dashboard.completionPercentage?.toFixed(0) || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${dashboard.completionPercentage || 0}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="text-blue-400" size={20} />
                <span className="text-white font-medium">View All Projects</span>
              </div>
              <ArrowRight
                size={18}
                className="text-slate-600 group-hover:text-blue-400 transition-colors"
              />
            </button>
            <button
              onClick={() => navigate('/my-tasks')}
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" size={20} />
                <span className="text-white font-medium">View My Tasks</span>
              </div>
              <ArrowRight
                size={18}
                className="text-slate-600 group-hover:text-green-400 transition-colors"
              />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon size={24} className="opacity-80" />
      </div>
    </div>
  );
};

export default DashboardPage;