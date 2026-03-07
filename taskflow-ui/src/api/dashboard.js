import api from './axios';

export const getDashboard = (projectId) =>
    api.get(`/projects/${projectId}/dashboard`);