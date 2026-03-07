import api from './axios';

export const getMyProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const archiveProject = (id) => api.patch(`/projects/${id}/archive`);
export const searchProjects = (params) => api.get('/projects/search', { params });