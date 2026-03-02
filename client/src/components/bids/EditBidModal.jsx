import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { updateBid } from '../../features/bids/bidsSlice';
import { showSuccess, showError } from '../../utils/toast';

const EditBidModal = ({ bid, onClose, jobId }) => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    amount: bid.amount || '',
    estimatedDays: bid.estimatedDays || '',
    message: bid.message || ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      amount: bid.amount || '',
      estimatedDays: bid.estimatedDays || '',
      message: bid.message || ''
    });
  }, [bid]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.estimatedDays || formData.estimatedDays <= 0) {
      newErrors.estimatedDays = 'Estimated days must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const bidData = {
        amount: parseFloat(formData.amount),
        estimatedDays: parseInt(formData.estimatedDays),
        message: formData.message.trim()
      };
      
      await dispatch(updateBid({ bidId: bid._id, bidData })).unwrap();
      showSuccess('Bid updated successfully!');
      onClose();
    } catch (error) {
      showError(error || 'Failed to update bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Bid</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="label mb-1.5 block">Bid Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
          </div>

          {/* Estimated Days */}
          <div>
            <label className="label mb-1.5 block">Estimated Days</label>
            <input
              type="number"
              name="estimatedDays"
              value={formData.estimatedDays}
              onChange={handleChange}
              className="input"
              placeholder="1"
              min="1"
              step="1"
              disabled={isSubmitting}
            />
            {errors.estimatedDays && <p className="text-sm text-red-600 mt-1">{errors.estimatedDays}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="label mb-1.5 block">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Update your message..."
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBidModal;