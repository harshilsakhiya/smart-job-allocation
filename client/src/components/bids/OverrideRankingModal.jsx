import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { overrideRanking, closeOverrideModal } from '../../features/bids/bidsSlice';
import { addToast } from '../../features/ui/uiSlice';

const OverrideRankingModal = () => {
  const dispatch = useDispatch();
  const { overrideModalOpen, selectedBidForOverride, isLoading } = useSelector((state) => state.bids);
  const [newRank, setNewRank] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  if (!overrideModalOpen || !selectedBidForOverride) return null;

  const validate = () => {
    const newErrors = {};
    if (!newRank || parseInt(newRank) < 1) {
      newErrors.rank = 'Please enter a valid rank (minimum 1)';
    }
    if (!reason || reason.length < 5) {
      newErrors.reason = 'Please provide a reason (minimum 5 characters)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        await dispatch(overrideRanking({
          bidId: selectedBidForOverride._id,
          overrideData: {
            newRank: parseInt(newRank),
            reason
          }
        })).unwrap();
        dispatch(addToast({ type: 'success', message: 'Ranking overridden successfully!' }));
        setNewRank('');
        setReason('');
      } catch (error) {
        dispatch(addToast({ type: 'error', message: error || 'Failed to override ranking' }));
      }
    }
  };

  const handleClose = () => {
    dispatch(closeOverrideModal());
    setNewRank('');
    setReason('');
    setErrors({});
  };

  const contractor = selectedBidForOverride.contractor || {};
  const currentRank = selectedBidForOverride.ranking?.rank;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Override Ranking</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Contractor:</span> {contractor.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Current Rank:</span> #{currentRank}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Current Score:</span> {Math.round(selectedBidForOverride.ranking?.score || 0)}
            </p>
          </div>

          <div>
            <label className="label">New Rank</label>
            <input
              type="number"
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
              className="input"
              placeholder="Enter new rank position"
              min="1"
            />
            {errors.rank && <p className="text-sm text-danger-600 mt-1">{errors.rank}</p>}
          </div>

          <div>
            <label className="label">Reason for Override</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              rows="3"
              placeholder="Explain why you're overriding the ranking..."
            />
            {errors.reason && <p className="text-sm text-danger-600 mt-1">{errors.reason}</p>}
          </div>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <p className="text-sm text-warning-800">
              <strong>Note:</strong> This will manually adjust the contractor's position in the ranking. 
              Other bids will be re-ranked accordingly. Please provide a clear reason for audit purposes.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Override Ranking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OverrideRankingModal;
