import React, { useState } from 'react';
import { X } from 'lucide-react';

const SubmitBidModal = ({ job, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    amount: '',
    estimatedDays: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.estimatedDays || formData.estimatedDays < 1) {
      newErrors.estimatedDays = 'Please enter at least 1 day';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        amount: parseFloat(formData.amount),
        estimatedDays: parseInt(formData.estimatedDays),
        message: formData.message
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Submit Bid</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Bid Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              placeholder="Enter your bid amount"
              min="0"
              step="0.01"
            />
            {errors.amount && <p className="text-sm text-danger-600 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="label">Estimated Days</label>
            <input
              type="number"
              name="estimatedDays"
              value={formData.estimatedDays}
              onChange={handleChange}
              className="input"
              placeholder="How many days to complete?"
              min="1"
            />
            {errors.estimatedDays && <p className="text-sm text-danger-600 mt-1">{errors.estimatedDays}</p>}
          </div>

          <div>
            <label className="label">Message (Optional)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Add any additional details..."
              maxLength="1000"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Job Details:</p>
            <p>{job.title}</p>
            <p className="mt-1">Trade: {job.trade}</p>
            {job.budget && (
              <p className="mt-1">Budget: ${job.budget.min} - ${job.budget.max}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitBidModal;
