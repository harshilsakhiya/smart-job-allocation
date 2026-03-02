import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jobService from '../../services/jobService';

const initialState = {
  jobs: [],
  currentJob: null,
  trades: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  filters: {
    status: '',
    trade: '',
    zipCode: '',
    isUrgent: ''
  }
};

// Get all jobs
export const getJobs = createAsyncThunk(
  'jobs/getAll',
  async (params, thunkAPI) => {
    try {
      return await jobService.getJobs(params);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get jobs with stats (dashboard)
export const getJobsWithStats = createAsyncThunk(
  'jobs/getWithStats',
  async (params, thunkAPI) => {
    try {
      return await jobService.getJobsWithStats(params);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single job
export const getJob = createAsyncThunk(
  'jobs/getOne',
  async (id, thunkAPI) => {
    try {
      return await jobService.getJob(id);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create job
export const createJob = createAsyncThunk(
  'jobs/create',
  async (jobData, thunkAPI) => {
    try {
      return await jobService.createJob(jobData);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update job
export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ id, jobData }, thunkAPI) => {
    try {
      return await jobService.updateJob(id, jobData);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete job
export const deleteJob = createAsyncThunk(
  'jobs/delete',
  async (id, thunkAPI) => {
    try {
      await jobService.deleteJob(id);
      return id;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get trades
export const getTrades = createAsyncThunk(
  'jobs/getTrades',
  async (_, thunkAPI) => {
    try {
      return await jobService.getTrades();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {
        status: '',
        trade: '',
        zipCode: '',
        isUrgent: ''
      };
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Jobs
      .addCase(getJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Jobs With Stats
      .addCase(getJobsWithStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getJobsWithStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getJobsWithStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Single Job
      .addCase(getJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(getJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload.data);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job._id === action.payload.data._id);
        if (index !== -1) {
          state.jobs[index] = action.payload.data;
        }
        // Update currentJob if it's the same job
        if (state.currentJob?.data?.job?._id === action.payload.data._id) {
          state.currentJob.data.job = action.payload.data;
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = state.jobs.filter(job => job._id !== action.meta.arg);
        // Clear currentJob if it's the deleted job
        if (state.currentJob?.data?.job?._id === action.meta.arg) {
          state.currentJob = null;
        }
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })


      // Get Trades
      .addCase(getTrades.fulfilled, (state, action) => {
        state.trades = action.payload.data;
      });
  }
});

export const { reset, clearCurrentJob, setFilters, clearFilters, setPage } = jobsSlice.actions;
export default jobsSlice.reducer;
