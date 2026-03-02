import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { getJob } from '../features/jobs/jobsSlice';
import { getBidsForJob, submitBid, openOverrideModal } from '../features/bids/bidsSlice';
import { addToast } from '../features/ui/uiSlice';
import BidRankingTable from '../components/bids/BidRankingTable';
import SubmitBidModal from '../components/bids/SubmitBidModal';
import OverrideRankingModal from '../components/bids/OverrideRankingModal';
import { MapPin, Calendar, DollarSign, AlertCircle, Briefcase, ArrowLeft, Clock, User } from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentJob, isLoading: jobLoading, error: jobError } = useSelector((state) => state.jobs);
  const { bids, isLoading: bidsLoading, isSubmitting } = useSelector((state) => state.bids);
  const { user } = useSelector((state) => state.auth);
  const [showBidModal, setShowBidModal] = useState(false);

  const isAdmin = user?.role === 'admin';
  const job = currentJob?.data?.job || currentJob?.job;
  const jobBids = currentJob?.data?.bids || bids;

  useEffect(() => {
    if (id) {
      dispatch(getJob(id));
      dispatch(getBidsForJob(id));
    }
  }, [dispatch, id]);

  // Debug logging
  useEffect(() => {
    console.log('Job ID:', id);
    console.log('Current Job:', currentJob);
    console.log('Extracted Job:', job);
  }, [id, currentJob, job]);

  const handleSubmitBid = async (bidData) => {
    try {
      await dispatch(submitBid({ ...bidData, jobId: id })).unwrap();
      setShowBidModal(false);
      dispatch(addToast({ type: 'success', message: 'Bid submitted successfully!' }));
    } catch (error) {
      dispatch(addToast({ type: 'error', message: error || 'Failed to submit bid' }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
        <p className="ml-3 text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
          <p className="font-medium">Error loading job</p>
          <p className="text-sm">{jobError}</p>
        </div>
        <Link to="/jobs" className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Job not found</p>
          <p className="text-gray-400 text-sm mt-1">The job you're looking for doesn't exist or has been removed.</p>
          <Link to="/jobs" className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/jobs" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </Link>

      {/* Job Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Section with Status */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <div className="flex items-center gap-2">
                  {job.isUrgent && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      Urgent
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{job.description}</p>
            </div>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                <p className="text-sm font-semibold text-gray-900">{job.zipCode}</p>
              </div>
            </div>

            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Trade</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{job.trade}</p>
              </div>
            </div>

            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(job.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {job.budget ? (
              <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                  <p className="text-sm font-semibold text-gray-500">Not specified</p>
                </div>
              </div>
            )}
          </div>

          {/* Deadline if exists */}
          {job.deadline && (
            <div className="mt-4 flex items-center bg-white p-4 rounded-lg shadow-sm">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(job.deadline).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ZIP Intelligence Section */}
        {job.zipIntelligence && (
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">ZIP Intelligence Score</h3>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              {/* Composite Score Bar */}
              <div className="flex items-center mb-6">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Composite Score</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {Math.round(job.zipIntelligence.compositeScore)}/100
                    </span>
                  </div>
                  <div className="bg-white rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-4 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${job.zipIntelligence.compositeScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Mobility */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Mobility</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {job.zipIntelligence.scores.mobility}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${job.zipIntelligence.scores.mobility}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {/* Business */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Business</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {job.zipIntelligence.scores.businessActivity}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${job.zipIntelligence.scores.businessActivity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {/* Demographics */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Demographics</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {job.zipIntelligence.scores.demographicFit}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{ width: `${job.zipIntelligence.scores.demographicFit}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {/* Seasonal */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Seasonal</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {job.zipIntelligence.scores.seasonalDemand}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${job.zipIntelligence.scores.seasonalDemand}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bids Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contractor Bids</h2>
              <p className="text-sm text-gray-500">
                {bids.length} bid{bids.length !== 1 ? 's' : ''} submitted
                {job.status === 'open' && ' • Accepting new bids'}
              </p>
            </div>
          </div>
          {!isAdmin && job.status === 'open' && (
            <button
              onClick={() => setShowBidModal(true)}
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Submit Bid
                </>
              )}
            </button>
          )}
          {isAdmin && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Admin View
            </span>
          )}
        </div>

        <BidRankingTable
          bids={jobBids}
          isLoading={bidsLoading}
          isAdmin={isAdmin}
          jobStatus={job.status}
        />
      </div>

      {/* Modals */}
      {showBidModal && (
        <SubmitBidModal
          job={job}
          onClose={() => setShowBidModal(false)}
          onSubmit={handleSubmitBid}
          isSubmitting={isSubmitting}
        />
      )}

      <OverrideRankingModal />
    </div>
  );
};

export default JobDetail;
