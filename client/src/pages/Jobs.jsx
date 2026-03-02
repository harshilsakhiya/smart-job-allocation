import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getJobsWithStats, getTrades } from '../features/jobs/jobsSlice';
import { MapPin, Calendar, DollarSign, AlertCircle, Plus } from 'lucide-react';
import CreateJobModal from '../components/jobs/CreateJobModal';

const Jobs = () => {
  const dispatch = useDispatch();
  const { jobs, isLoading, error, trades } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Client-side filters
  const [filters, setLocalFilters] = useState({
    status: '',
    trade: '',
    zipCode: '',
    isUrgent: ''
  });
  
  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch all jobs without pagination
    dispatch(getJobsWithStats({ limit: 1000 }));
    dispatch(getTrades());
  }, [dispatch]);

  // Filter jobs client-side
  const filteredJobs = jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.trade && job.trade !== filters.trade) return false;
    if (filters.zipCode && !job.zipCode.includes(filters.zipCode)) return false;
    if (filters.isUrgent !== '' && job.isUrgent !== (filters.isUrgent === 'true')) return false;
    return true;
  });

  // Paginate filtered jobs
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
        {user?.role === 'admin' && (
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            name="trade"
            value={filters.trade}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="">All Trades</option>
            {trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>

          <input
            type="text"
            name="zipCode"
            value={filters.zipCode}
            onChange={handleFilterChange}
            placeholder="Filter by ZIP code"
            className="input"
          />

          <select
            name="isUrgent"
            value={filters.isUrgent}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="">All Priorities</option>
            <option value="true">Urgent Only</option>
            <option value="false">Non-Urgent Only</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading jobs</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No jobs found</p>
            <p className="text-gray-400 text-sm mt-1">
              {user?.role === 'admin' ? 'Create a new job to get started' : 'Check back later for new opportunities'}
            </p>
          </div>
        ) : (
          paginatedJobs.map((job) => (
            <div key={job._id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    {job.isUrgent && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 mt-2 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.zipCode}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {job.budget && (
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${job.budget.min} - ${job.budget.max}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {job.trade}
                    </span>
                  </div>
                </div>

                <div className="ml-6 text-right">
                  <div className="text-sm text-gray-500 mb-2">
                    {job.bidCount || 0} bid{job.bidCount !== 1 ? 's' : ''}
                  </div>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="btn-primary text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 text-center">
        Showing {paginatedJobs.length} of {filteredJobs.length} jobs
        {filters.status || filters.trade || filters.zipCode || filters.isUrgent ? ' (filtered)' : ''}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default Jobs;
