import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bidService from '../../services/bidService';

const initialState = {
  bids: [],
  myBids: [],
  currentBid: null,
  rankingStats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  overrideModalOpen: false,
  selectedBidForOverride: null
};

// Get bids for a job
export const getBidsForJob = createAsyncThunk(
  'bids/getForJob',
  async (jobId, thunkAPI) => {
    try {
      return await bidService.getBidsForJob(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get my bids (contractor)
export const getMyBids = createAsyncThunk(
  'bids/getMyBids',
  async (_, thunkAPI) => {
    try {
      return await bidService.getMyBids();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Submit bid
export const submitBid = createAsyncThunk(
  'bids/submit',
  async (bidData, thunkAPI) => {
    try {
      return await bidService.submitBid(bidData);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update bid
export const updateBid = createAsyncThunk(
  'bids/update',
  async ({ bidId, bidData }, thunkAPI) => {
    try {
      return await bidService.updateBid(bidId, bidData);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete bid
export const deleteBid = createAsyncThunk(
  'bids/delete',
  async (bidId, thunkAPI) => {
    try {
      return await bidService.deleteBid(bidId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Accept bid (admin)
export const acceptBid = createAsyncThunk(
  'bids/accept',
  async (bidId, thunkAPI) => {
    try {
      return await bidService.acceptBid(bidId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reject bid (admin)
export const rejectBid = createAsyncThunk(
  'bids/reject',
  async (bidId, thunkAPI) => {
    try {
      return await bidService.rejectBid(bidId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Override ranking (admin)
export const overrideRanking = createAsyncThunk(
  'bids/overrideRanking',
  async ({ bidId, overrideData }, thunkAPI) => {
    try {
      return await bidService.overrideRanking(bidId, overrideData);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Remove override (admin)
export const removeOverride = createAsyncThunk(
  'bids/removeOverride',
  async (bidId, thunkAPI) => {
    try {
      return await bidService.removeOverride(bidId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Withdraw bid (contractor)
export const withdrawBid = createAsyncThunk(
  'bids/withdraw',
  async (bidId, thunkAPI) => {
    try {
      await bidService.withdrawBid(bidId);
      return bidId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get ranking stats
export const getRankingStats = createAsyncThunk(
  'bids/getRankingStats',
  async (jobId, thunkAPI) => {
    try {
      return await bidService.getRankingStats(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const bidsSlice = createSlice({
  name: 'bids',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.error = null;
    },
    clearBids: (state) => {
      state.bids = [];
    },
    openOverrideModal: (state, action) => {
      state.overrideModalOpen = true;
      state.selectedBidForOverride = action.payload;
    },
    closeOverrideModal: (state) => {
      state.overrideModalOpen = false;
      state.selectedBidForOverride = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Bids for Job
      .addCase(getBidsForJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBidsForJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bids = action.payload.data;
      })
      .addCase(getBidsForJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get My Bids
      .addCase(getMyBids.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyBids.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBids = action.payload.data;
      })
      .addCase(getMyBids.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Submit Bid
      .addCase(submitBid.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitBid.fulfilled, (state, action) => {
        state.isSubmitting = false;
        // Optimistically add to bids list
        state.bids.push(action.payload.data);
        // Sort by rank
        state.bids.sort((a, b) => (a.ranking?.rank || 0) - (b.ranking?.rank || 0));
      })
      .addCase(submitBid.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // Update Bid
      .addCase(updateBid.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateBid.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.bids.findIndex(bid => bid._id === action.payload.data._id);
        if (index !== -1) {
          state.bids[index] = action.payload.data;
          // Re-sort by rank
          state.bids.sort((a, b) => (a.ranking?.rank || 0) - (b.ranking?.rank || 0));
        }
      })
      .addCase(updateBid.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // Delete Bid
      .addCase(deleteBid.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteBid.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.bids = state.bids.filter(bid => bid._id !== action.meta.arg);
      })
      .addCase(deleteBid.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // Accept Bid
      .addCase(acceptBid.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(acceptBid.fulfilled, (state, action) => {
        state.isLoading = false;
        const bidId = action.payload.data._id;
        const bidIndex = state.bids.findIndex(b => b._id === bidId);
        if (bidIndex !== -1) {
          state.bids[bidIndex] = action.payload.data;
        }
        // Update other bids to rejected
        state.bids = state.bids.map(b => 
          b._id !== bidId && b.status === 'pending' 
            ? { ...b, status: 'rejected' } 
            : b
        );
      })
      .addCase(acceptBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reject Bid
      .addCase(rejectBid.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(rejectBid.fulfilled, (state, action) => {
        state.isLoading = false;
        const bidId = action.payload.data._id;
        const bidIndex = state.bids.findIndex(b => b._id === bidId);
        if (bidIndex !== -1) {
          state.bids[bidIndex] = action.payload.data;
        }
      })
      .addCase(rejectBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Override Ranking
      .addCase(overrideRanking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(overrideRanking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overrideModalOpen = false;
        state.selectedBidForOverride = null;
        // Refresh bids to get updated rankings
        const bidId = action.payload.data._id;
        const bidIndex = state.bids.findIndex(b => b._id === bidId);
        if (bidIndex !== -1) {
          state.bids[bidIndex] = action.payload.data;
        }
        // Re-sort by rank
        state.bids.sort((a, b) => (a.ranking?.rank || 0) - (b.ranking?.rank || 0));
      })
      .addCase(overrideRanking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove Override
      .addCase(removeOverride.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeOverride.fulfilled, (state, action) => {
        state.isLoading = false;
        const bidId = action.payload.data._id;
        const bidIndex = state.bids.findIndex(b => b._id === bidId);
        if (bidIndex !== -1) {
          state.bids[bidIndex] = action.payload.data;
        }
        // Re-sort by rank
        state.bids.sort((a, b) => (a.ranking?.rank || 0) - (b.ranking?.rank || 0));
      })
      .addCase(removeOverride.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Withdraw Bid
      .addCase(withdrawBid.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(withdrawBid.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bids = state.bids.filter(b => b._id !== action.payload);
        state.myBids = state.myBids.filter(b => b._id !== action.payload);
      })
      .addCase(withdrawBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Ranking Stats
      .addCase(getRankingStats.fulfilled, (state, action) => {
        state.rankingStats = action.payload.data;
      });
  }
});

export const { reset, clearBids, openOverrideModal, closeOverrideModal } = bidsSlice.actions;
export default bidsSlice.reducer;
