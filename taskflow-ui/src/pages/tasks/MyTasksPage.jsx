import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTasks, transitionStatus } from '../../api/tasks';
import {
  CheckSquare,
  Loader2,
  Calendar,
  Clock,
  CircleDot,
  Circle,
  CheckCircle2,
  Filter,
  FolderKanban,
} from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_STYLES = {
  TODO: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  DONE: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  BLOCKED: CircleDot,
  DONE: CheckCircle2,
};

const NEXT_STATUS = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  BLOCKED: 'IN_PROGRESS',
};

const MyTasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getMyTasks();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await transitionStatus(taskId, { status: newStatus });
      loadTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid status transition');
    }
  };

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const groupedByProject = filtered.reduce((acc, task) => {
    const key = task.projectName || 'Unknown Project';
    if (!acc[key]) acc[key] = { projectId: task.projectId, tasks: [] };
    acc[key].tasks.push(task);
    return acc;
  }, {});

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
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-500 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <span className="text-sm text-slate-500">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Status' : s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p === 'ALL' ? 'All Priority' : p}
            </option>
          ))}
        </select>

        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
            }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
          <p className="text-slate-500">
            {tasks.length === 0
              ? 'No tasks assigned to you yet'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProject).map(([projectName, { projectId, tasks: projectTasks }]) => (
            <div key={projectName} className="space-y-3">
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors"
              >
                <FolderKanban size={16} />
                {projectName}
                <span className="text-xs text-slate-600">({projectTasks.length})</span>
              </button>

              <div className="space-y-2">
                {projectTasks.map((task) => {
                  const StatusIcon = STATUS_ICONS[task.status] || Circle;
                  const isOverdue =
                    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      {/* Status icon */}
                      <StatusIcon
                        size={18}
                        className={`flex-shrink-0 ${
                          task.status === 'DONE'
                          ? 'text-green-400'
                          : task.status === 'IN_PROGRESS'
                          ? 'text-blue-400'
                          : task.status === 'BLOCKED'
                          ? 'text-red-400'
                          : 'text-slate-500'
                        }`}
  
                      />

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                            PRIORITY_STYLES[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                            STATUS_STYLES[task.status]
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>

                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                              isOverdue
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Calendar size={10} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Quick action */}
                      {NEXT_STATUS[task.status] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, NEXT_STATUS[task.status]);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          Move →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(taskId, status) => {
            handleStatusChange(taskId, status);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

// Quick Task Detail Modal (expanded in Step 2)
const TaskDetailModal = ({ task, onClose, onStatusChange }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
            <span className="text-xl">✕</span>
          </button>
        </div>

        {task.description && (
          <p className="text-slate-400 text-sm mb-4">{task.description}</p>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Priority</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Project</span>
            <span className="text-white">{task.projectName}</span>
          </div>
          {task.assigneeName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Assignee</span>
              <span className="text-white">{task.assigneeName}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Due Date</span>
              <span className="text-white">{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {NEXT_STATUS[task.status] && (
          <button
            onClick={() => onStatusChange(task.id, NEXT_STATUS[task.status])}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all"
          >
            Move to {NEXT_STATUS[task.status].replace('_', ' ')}
          </button>
        )}
      </div>
    </div>
  );
};

export default MyTasksPage;