import api from './api';

const register = async (userData) => {
  const response = await api.post('/auth/contractor/register', userData);
  if (response.data.data?.token) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

const login = async (userData) => {
  const response = await api.post('/auth/contractor/login', userData);
  if (response.data.data?.token) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

const loginAdmin = async (userData) => {
  const response = await api.post('/auth/admin/login', userData);
  if (response.data.data?.token) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

const authService = {
  register,
  login,
  loginAdmin,
  logout,
  getMe,
  updateProfile
};

export default authService;
