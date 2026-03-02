import api from './api';

const getJobs = async (params = {}) => {
  const response = await api.get('/jobs', { params });
  return response.data;
};

const getJobsWithStats = async (params = {}) => {
  const response = await api.get('/jobs/dashboard', { params });
  return response.data;
};

const getJob = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

const createJob = async (jobData) => {
  const response = await api.post('/jobs', jobData);
  return response.data;
};

const updateJob = async (id, jobData) => {
  const response = await api.put(`/jobs/${id}`, jobData);
  return response.data;
};

const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};

const getTrades = async () => {
  const response = await api.get('/jobs/trades');
  return response.data;
};

const getJobStats = async (id) => {
  const response = await api.get(`/jobs/${id}/stats`);
  return response.data;
};

const jobService = {
  getJobs,
  getJobsWithStats,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getTrades,
  getJobStats
};

export default jobService;
