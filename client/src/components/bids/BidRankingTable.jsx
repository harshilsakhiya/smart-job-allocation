import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  X,
  Crown,
  AlertTriangle,
  MapPin,
  Star,
  Clock,
  Briefcase,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import {
  acceptBid,
  rejectBid,
  deleteBid,
  openOverrideModal,
} from "../../features/bids/bidsSlice";
import { addToast } from "../../features/ui/uiSlice";
import { showSuccess, showError } from "../../utils/toast";
import EditBidModal from "./EditBidModal";

const BidRankingTable = ({ bids, isLoading, isAdmin, jobStatus }) => {
  const dispatch = useDispatch();
  const { isLoading: actionLoading } = useSelector((state) => state.bids);
  const { user } = useSelector((state) => state.auth);
  const [editingBid, setEditingBid] = useState(null);
  const [deletingBidId, setDeletingBidId] = useState(null);

  const isCurrentUserBid = (bid) => {
    return user?.role === "contractor" && bid.contractor?._id === user?.id;
  };

  const handleAccept = async (bidId) => {
    try {
      await dispatch(acceptBid(bidId)).unwrap();
      dispatch(
        addToast({ type: "success", message: "Bid accepted successfully!" }),
      );
    } catch (error) {
      dispatch(
        addToast({ type: "error", message: error || "Failed to accept bid" }),
      );
    }
  };

  const handleReject = async (bidId) => {
    try {
      await dispatch(rejectBid(bidId)).unwrap();
      dispatch(addToast({ type: "info", message: "Bid rejected" }));
    } catch (error) {
      dispatch(
        addToast({ type: "error", message: error || "Failed to reject bid" }),
      );
    }
  };

  const handleOverride = (bid) => {
    dispatch(openOverrideModal(bid));
  };

  const handleDelete = async (bidId) => {
    if (!window.confirm("Are you sure you want to delete this bid?")) return;
    
    setDeletingBidId(bidId);
    try {
      await dispatch(deleteBid(bidId)).unwrap();
      showSuccess("Bid deleted successfully!");
    } catch (error) {
      showError(error || "Failed to delete bid");
    } finally {
      setDeletingBidId(null);
    }
  };

  const getRankBadge = (rank, isOverridden) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Crown className="w-3 h-3 mr-1" />#{rank}
          {isOverridden && <span className="ml-1">*</span>}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isOverridden
            ? "bg-purple-100 text-purple-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        #{rank}
        {isOverridden && <span className="ml-1">*</span>}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const renderFactorBar = (label, score, IconComponent, maxScore = 100) => {
    // Handle undefined/null/NaN scores
    const safeScore = isNaN(score) || score == null ? 0 : score;
    return (
      <div className="flex items-center text-xs text-gray-600 mb-1.5">
        <IconComponent className="w-3 h-3 mr-1.5 text-gray-400" />
        <span className="w-16 truncate">{label}:</span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5 mx-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min((safeScore / maxScore) * 100, 100)}%` }}
          ></div>
        </div>
        <span className="w-8 text-right font-medium">{Math.round(safeScore)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading bids...</p>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No bids submitted yet</p>
        {!isAdmin && jobStatus === "open" && (
          <p className="text-sm text-gray-400 mt-1">
            Be the first to bid on this job!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Contractor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Bid Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Score
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Factors
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            {isAdmin && jobStatus === "open" && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bids.map((bid) => {
            const ranking = bid.ranking || {};
            const factors = ranking.factors || {};
            const contractor = bid.contractor || {};
            const isOverridden = bid.adminOverride?.isOverridden;

            return (
              <tr
                key={bid._id}
                className={`hover:bg-gray-50 ${isOverridden ? "bg-purple-50" : ""}`}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  {ranking.rank ? getRankBadge(ranking.rank, isOverridden) : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {contractor.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contractor.trades?.join(", ")}
                    </p>
                    {isOverridden && (
                      <p className="text-xs text-purple-600 mt-1">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Admin Override
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">${bid.amount}</p>
                    <p className="text-gray-500">{bid.estimatedDays} days</p>
                    {bid.message && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                        {bid.message}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-3">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          (ranking.score || 0) >= 80 
                            ? "bg-green-500" 
                            : (ranking.score || 0) >= 60 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(ranking.score || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {ranking.score ? Math.round(ranking.score) : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="w-48">
                    {renderFactorBar(
                      "Distance",
                      factors.distance?.score,
                      MapPin,
                    )}
                    {renderFactorBar("Rating", factors.rating?.score, Star)}
                    {renderFactorBar(
                      "Completion",
                      factors.completionRate?.score,
                      TrendingUp,
                    )}
                    {renderFactorBar(
                      "Response",
                      factors.responseTime?.score,
                      Clock,
                    )}
                    {factors.workloadPenalty?.applied && (
                      <p className="text-xs text-red-600 mt-2 flex items-center bg-red-50 p-2 rounded">
                        <AlertTriangle className="w-3 h-3 mr-1.5" />
                        Workload penalty (-{factors.workloadPenalty.penaltyAmount}%)
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(bid.status)}`}>
                    {bid.status}
                  </span>
                </td>
                {isAdmin && jobStatus === "open" && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {bid.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(bid._id)}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Accept Bid"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(bid._id)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Bid"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOverride(bid)}
                        disabled={actionLoading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Override Ranking"
                      >
                        <Crown className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                )}
                
                {/* Contractor Actions */}
                {!isAdmin && isCurrentUserBid(bid) && bid.status === "pending" && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingBid(bid)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit bid"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bid._id)}
                        disabled={deletingBidId === bid._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete bid"
                      >
                        {deletingBidId === bid._id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  {/* Edit Bid Modal */}
  {editingBid && (
    <EditBidModal
      bid={editingBid}
      onClose={() => setEditingBid(null)}
      jobId={editingBid.jobId}
    />
  )}
};

export default BidRankingTable;
