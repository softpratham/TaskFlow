import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../../api/projects';
import { getTasksByProject, createTask, transitionStatus } from '../../api/tasks';
import { getTeam, addMember } from '../../api/teams';
import { getDashboard } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Plus,
  Users,
  BarChart3,
  X,
  Loader2,
  UserPlus,
  GripVertical,
  Calendar,
  Flag,
  CheckCircle2,
  Clock,
  CircleDot,
  Circle,
} from 'lucide-react';
import TaskDetailModal from '../../components/common/TaskDetailModal';

const STATUS_COLUMNS = [
  { key: 'TODO', label: 'To Do', icon: Circle, color: 'slate' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'blue' },
  { key: 'BLOCKED', label: 'Blocked', icon: CircleDot, color: 'red' },
  { key: 'DONE', label: 'Done', icon: CheckCircle2, color: 'green' },
];

const PRIORITY_STYLES = {
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const getMemberId = (member) => member.userId || member.id;

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    loadAll();
  }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, teamRes, dashRes] = await Promise.all([
        getProject(projectId),
        getTasksByProject(projectId),
        getTeam(projectId),
        getDashboard(projectId),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setTeam(teamRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await createTask(projectId, {
        ...taskForm,
        assigneeId: taskForm.assigneeId || null,
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      loadAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await addMember(projectId, memberEmail);
      setShowMemberModal(false);
      setMemberEmail('');
      loadAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await transitionStatus(taskId, { status: newStatus });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid status transition');
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isManager && (
            <>
              <button
                onClick={() => {
                  setShowMemberModal(true);
                  setModalError('');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
              >
                <UserPlus size={16} />
                Add Member
              </button>
              <button
                onClick={() => {
                  setShowTaskModal(true);
                  setModalError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                <Plus size={16} />
                New Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_COLUMNS.map((col) => {
          const count = getTasksByStatus(col.key).length;
          const colorMap = {
            slate: 'text-slate-400 bg-slate-500/10',
            blue: 'text-blue-400 bg-blue-500/10',
            red: 'text-red-400 bg-red-500/10',
            green: 'text-green-400 bg-green-500/10',
          };
          return (
            <div
              key={col.key}
              className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg"
            >
              <div className={`p-1.5 rounded-md ${colorMap[col.color]}`}>
                <col.icon size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{col.label}</p>
                <p className="text-lg font-bold text-white">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'board'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} />
            Board
          </div>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'team'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Team ({team?.members?.length || 0})
          </div>
        </button>
      </div>

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <col.icon size={16} className={`text-${col.color}-400`} />
                  <span className="text-sm font-semibold text-slate-300">{col.label}</span>
                </div>
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                  {getTasksByStatus(col.key).length}
                </span>
              </div>

              <div className="space-y-2 min-h-[200px] bg-slate-900/50 border border-slate-800/50 rounded-xl p-2">
                {getTasksByStatus(col.key).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    currentStatus={col.key}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
                {getTasksByStatus(col.key).length === 0 && (
                  <div className="flex items-center justify-center h-24 text-slate-600 text-xs">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team?.members?.map((member) => (
            <div
              key={getMemberId(member)}
              className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {member.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{member.fullName}</p>
                <p className="text-slate-500 text-sm truncate">{member.email}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-400">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  placeholder="Describe the task..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Assignee</label>
                <select
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                  <option value="">Unassigned</option>
                  {team?.members?.map((m) => (
                    <option key={getMemberId(m)} value={getMemberId(m)}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Team Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="member@example.com"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal with Comments */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={loadAll}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onStatusChange, currentStatus, onClick }) => {
  const nextStatus = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  BLOCKED: 'IN_PROGRESS',
};

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-white leading-snug flex-1">{task.title}</h4>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
            PRIORITY_STYLES[task.priority]
          }`}
        >
          {task.priority}
        </span>
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
              isOverdue
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {task.assigneeName ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
              {task.assigneeName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-400">{task.assigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}

        {nextStatus[currentStatus] && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, nextStatus[currentStatus]);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-all"
          >
            Move →
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;