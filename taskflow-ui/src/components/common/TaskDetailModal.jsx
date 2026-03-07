import { useState, useEffect } from 'react';
import { getTask, transitionStatus, updateTask, deleteTask } from '../../api/tasks';
import { getComments, addComment } from '../../api/comments';
import { getTeam } from '../../api/teams';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Loader2,
  Calendar,
  Clock,
  Send,
  MessageSquare,
  User,
  FolderKanban,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  XCircle,
} from 'lucide-react';

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

const NEXT_STATUS = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  BLOCKED: 'IN_PROGRESS',
};

const TaskDetailModal = ({ taskId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, commentsRes] = await Promise.all([
        getTask(taskId),
        getComments(taskId),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);

      // Load team members for assignee dropdown
      if (taskRes.data.projectId) {
        try {
          const teamRes = await getTeam(taskRes.data.projectId);
          setTeamMembers(teamRes.data?.members || []);
        } catch {
          // ignore - team might not be accessible
        }
      }
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await transitionStatus(taskId, { status: newStatus });
      loadData();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid status transition');
    }
  };

  const startEditing = () => {
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setEditError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      setEditError('Title is required');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await updateTask(taskId, {
        ...editForm,
        assigneeId: editForm.assigneeId || null,
      });
      setEditing(false);
      loadData();
      if (onUpdated) onUpdated();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(taskId);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment(taskId, { content: commentText });
      setCommentText('');
      loadData();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSending(false);
    }
  };

  const getMemberId = (m) => m.userId || m.id;

  const isOverdue =
    task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800">
              <div className="flex-1 min-w-0 pr-4">
                {editing ? (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full text-xl font-bold text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Task title"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white mb-2">{task.title}</h2>
                )}
                {!editing && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_STYLES[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    {isOverdue && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        OVERDUE
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!editing && (
                  <>
                    <button
                      onClick={startEditing}
                      className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editing ? (
                /* ===== EDIT MODE ===== */
                <div className="space-y-4">
                  {editError && (
                    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {editError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                      placeholder="Describe the task..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Assignee</label>
                    <select
                      value={editForm.assigneeId}
                      onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={getMemberId(m)} value={getMemberId(m)}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save / Cancel buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={cancelEditing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* ===== VIEW MODE ===== */
                <>
                  {/* Description */}
                  {task.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Description
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{task.description}</p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={FolderKanban} label="Project" value={task.projectName} />
                    <DetailItem icon={User} label="Assignee" value={task.assigneeName || 'Unassigned'} />
                    <DetailItem
                      icon={Calendar}
                      label="Due Date"
                      value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      highlight={isOverdue}
                    />
                    <DetailItem
                      icon={Clock}
                      label="Created"
                      value={new Date(task.createdAt).toLocaleDateString()}
                    />
                  </div>

                  {/* Status Transition */}
                  {NEXT_STATUS[task.status] && (
                    <button
                      onClick={() => handleStatusChange(NEXT_STATUS[task.status])}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all text-sm"
                    >
                      Move to {NEXT_STATUS[task.status].replace('_', ' ')}
                    </button>
                  )}

                  {/* Comments */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Comments ({comments.length})
                    </h3>

                    <div className="space-y-3 mb-4">
                      {comments.length === 0 ? (
                        <p className="text-sm text-slate-600 text-center py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
                                {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="text-sm font-medium text-white">
                                {comment.authorName}
                              </span>
                              <span className="text-xs text-slate-600">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 pl-8">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || sending}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-slate-500">Task not found</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Task</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">"{task?.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value, highlight }) => (
  <div className="p-3 bg-slate-800/30 rounded-lg">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={14} className="text-slate-500" />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
    <p className={`text-sm font-medium ${highlight ? 'text-red-400' : 'text-white'}`}>
      {value}
    </p>
  </div>
);

export default TaskDetailModal;