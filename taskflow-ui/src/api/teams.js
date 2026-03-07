import api from './axios';

export const getTeam = (projectId) => api.get(`/projects/${projectId}/team`);
export const addMember = (projectId, email) =>
  api.post(`/projects/${projectId}/team/members`, { email });
export const removeMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/team/members/${userId}`);