import api from './axios';

export const getTasksByProject = (projectId, params) =>
  api.get(`/projects/${projectId}/tasks`, { params });
export const getTask = (taskId) => api.get(`/tasks/${taskId}`);
export const createTask = (projectId, data) =>
  api.post(`/projects/${projectId}/tasks`, data);
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const transitionStatus = (taskId, data) =>
  api.patch(`/tasks/${taskId}/status`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const getMyTasks = () => api.get('/tasks/my');
export const searchTasks = (projectId, params) =>
  api.get(`/projects/${projectId}/tasks/search`, { params });