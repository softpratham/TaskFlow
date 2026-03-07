import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProjects, createProject } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Loader2,
  X,
  Calendar,
} from 'lucide-react';

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await getMyProjects();
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError('');
    try {
      await createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setModalLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isManager && (
          <button
            onClick={() => { setShowModal(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-500">
            {isManager ? 'Create your first project to get started' : 'You haven\'t been added to any projects yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FolderKanban size={20} className="text-blue-400" />
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-1" />
              </div>
              <h3 className="text-white font-semibold mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-slate-500 text-sm line-clamp-2 mb-3">{project.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Calendar size={12} />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Project Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="What's this project about?"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;