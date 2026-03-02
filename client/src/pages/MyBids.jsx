import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getMyBids, withdrawBid } from '../features/bids/bidsSlice';
import { addToast } from '../features/ui/uiSlice';
import { MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const MyBids = () => {
  const dispatch = useDispatch();
  const { myBids, isLoading } = useSelector((state) => state.bids);

  useEffect(() => {
    dispatch(getMyBids());
  }, [dispatch]);

  const handleWithdraw = async (bidId) => {
    if (window.confirm('Are you sure you want to withdraw this bid?')) {
      try {
        await dispatch(withdrawBid(bidId)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Bid withdrawn successfully' }));
      } catch (error) {
        dispatch(addToast({ type: 'error', message: error || 'Failed to withdraw bid' }));
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger'
    };
    return styles[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner w-8 h-8 mx-auto"></div>
        </div>
      ) : myBids.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't submitted any bids yet</p>
          <Link to="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {myBids.map((bid) => {
            const job = bid.jobId || {};
            return (
              <div key={bid._id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title || 'Unknown Job'}</h3>
                      <span className={getStatusBadge(bid.status)}>
                        {bid.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.zipCode}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(bid.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${bid.amount}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {job.trade}
                      </span>
                    </div>

                    {bid.ranking && (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            Rank: <span className="font-semibold">#{bid.ranking.rank}</span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${bid.ranking.score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            Score: {Math.round(bid.ranking.score)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="btn-primary text-sm"
                    >
                      View Job
                    </Link>
                    {bid.status === 'pending' && (
                      <button
                        onClick={() => handleWithdraw(bid._id)}
                        className="btn-danger text-sm"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBids;
