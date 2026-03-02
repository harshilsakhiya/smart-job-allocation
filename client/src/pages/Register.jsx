import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../features/auth/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    zipCode: '',
    trades: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      trades: formData.trades.split(',').map(t => t.trim()).filter(Boolean)
    };
    dispatch(register(data));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Contractor Registration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
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
            minLength={6}
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">ZIP Code</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            className="input"
            required
            pattern="\d{5}(-\d{4})?"
            placeholder="12345"
          />
        </div>

        <div>
          <label className="label">Trades (comma-separated)</label>
          <input
            type="text"
            name="trades"
            value={formData.trades}
            onChange={handleChange}
            className="input"
            placeholder="plumbing, electrical, carpentry"
          />
        </div>

        <button
          type="submit"
          className="w-full btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-500">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
