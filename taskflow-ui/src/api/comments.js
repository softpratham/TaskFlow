import api from './axios';

export const getComments = (taskId) => api.get(`/tasks/${taskId}/comments`);
export const addComment = (taskId, data) =>
    api.post(`/tasks/${taskId}/comments`, data);