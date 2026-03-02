import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../features/auth/authSlice';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginAdmin(formData));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Login</h2>
      <p className="text-center text-gray-500 mb-6">Smart Job Allocation Dashboard</p>
      
      {error && (
        <div className="mb-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Admin Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Admin Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-primary-600 hover:text-primary-500">
          Back to Contractor Login
        </Link>
      </p>
    </div>
  );
};

export default AdminLogin;
