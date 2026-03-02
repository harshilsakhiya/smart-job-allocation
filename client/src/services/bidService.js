import api from './api';

const getBidsForJob = async (jobId) => {
  const response = await api.get(`/bids/job/${jobId}`);
  return response.data;
};

const getMyBids = async (params = {}) => {
  const response = await api.get('/bids/my-bids', { params });
  return response.data;
};

const submitBid = async (bidData) => {
  const response = await api.post('/bids', bidData);
  return response.data;
};

const acceptBid = async (bidId) => {
  const response = await api.post(`/bids/${bidId}/accept`);
  return response.data;
};

const rejectBid = async (bidId) => {
  const response = await api.post(`/bids/${bidId}/reject`);
  return response.data;
};

const overrideRanking = async (bidId, overrideData) => {
  const response = await api.patch(`/bids/${bidId}/override`, overrideData);
  return response.data;
};

const removeOverride = async (bidId) => {
  const response = await api.delete(`/bids/${bidId}/override`);
  return response.data;
};

const withdrawBid = async (bidId) => {
  const response = await api.delete(`/bids/${bidId}`);
  return response.data;
};

const getRankingStats = async (jobId) => {
  const response = await api.get(`/bids/job/${jobId}/ranking-stats`);
  return response.data;
};

const updateBid = async (bidId, bidData) => {
  const response = await api.put(`/bids/${bidId}`, bidData);
  return response.data;
};

const deleteBid = async (bidId) => {
  const response = await api.delete(`/bids/${bidId}`);
  return response.data;
};

const bidService = {
  getBidsForJob,
  getMyBids,
  submitBid,
  updateBid,
  deleteBid,
  acceptBid,
  rejectBid,
  overrideRanking,
  removeOverride,
  withdrawBid,
  getRankingStats
};

export default bidService;
