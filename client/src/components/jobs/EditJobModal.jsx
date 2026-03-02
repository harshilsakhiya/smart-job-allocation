import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { updateJob } from '../../features/jobs/jobsSlice';
import { showSuccess, showError } from '../../utils/toast';

const EditJobModal = ({ job, onClose }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.jobs);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    zipCode: '',
    trade: '',
    budgetMin: '',
    budgetMax: '',
    isUrgent: false,
    deadline: '',
    useCustomZipIntelligence: false,
    zipIntelligence: {
      compositeScore: '',
      scores: {
        mobility: '',
        businessActivity: '',
        demographicFit: '',
        seasonalDemand: ''
      }
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        zipCode: job.zipCode || '',
        trade: job.trade || '',
        budgetMin: job.budget?.min || '',
        budgetMax: job.budget?.max || '',
        isUrgent: job.isUrgent || false,
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
        useCustomZipIntelligence: false,
        zipIntelligence: {
          compositeScore: '',
          scores: {
            mobility: '',
            businessActivity: '',
            demographicFit: '',
            seasonalDemand: ''
          }
        }
      });
    }
  }, [job]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) newErrors.zipCode = 'Invalid ZIP code format';
    if (!formData.trade) newErrors.trade = 'Trade is required';
    if (formData.budgetMin && formData.budgetMax && parseFloat(formData.budgetMin) > parseFloat(formData.budgetMax)) {
      newErrors.budgetMax = 'Max budget must be greater than min budget';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const jobData = {
      title: formData.title,
      description: formData.description,
      zipCode: formData.zipCode,
      trade: formData.trade,
      isUrgent: formData.isUrgent,
      deadline: formData.deadline || undefined
    };

    if (formData.budgetMin || formData.budgetMax) {
      jobData.budget = {
        min: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        max: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined
      };
    }

    try {
      await dispatch(updateJob({ id: job._id, jobData })).unwrap();
      showSuccess('Job updated successfully!');
      onClose();
    } catch (error) {
      showError(error || 'Failed to update job');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('zipIntelligence.')) {
      const [mainField, subField, subSubField] = name.split('.');
      
      if (subField === 'scores') {
        setFormData(prev => ({
          ...prev,
          [mainField]: {
            ...prev[mainField],
            scores: {
              ...prev[mainField].scores,
              [subSubField]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [mainField]: {
            ...prev[mainField],
            [subField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' && name !== 'useCustomZipIntelligence' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="label mb-1.5 block">Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Plumbing Repair at Downtown Office"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label mb-1.5 block">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="4"
              placeholder="Describe the job requirements, scope, and any special instructions..."
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* ZIP Code and Trade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">ZIP Code *</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="input"
                placeholder="12345"
                pattern="\d{5}(-\d{4})?"
              />
              {errors.zipCode && <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>}
            </div>

            <div>
              <label className="label mb-1.5 block">Trade *</label>
              <select
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a trade</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="hvac">HVAC</option>
                <option value="painting">Painting</option>
                <option value="roofing">Roofing</option>
                <option value="landscaping">Landscaping</option>
                <option value="general">General Contracting</option>
              </select>
              {errors.trade && <p className="text-sm text-red-600 mt-1">{errors.trade}</p>}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Budget Min ($)</label>
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label mb-1.5 block">Budget Max ($)</label>
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.budgetMax && <p className="text-sm text-red-600 mt-1">{errors.budgetMax}</p>}
            </div>
          </div>

          {/* Deadline and Urgent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="label mb-1.5 block">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center h-full pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Mark as Urgent
                  <span className="block text-xs text-gray-500 font-normal">
                    This will prioritize response time in ranking
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;