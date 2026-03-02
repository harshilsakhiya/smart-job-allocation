import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Toast notifications
  toasts: [],
  // Loading states for specific operations
  loadingStates: {},
  // Modal states
  modals: {
    createJob: false,
    submitBid: false,
    bidDetails: false
  },
  // Sidebar state
  sidebarOpen: true,
  // Theme
  theme: localStorage.getItem('theme') || 'light'
};

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Toast notifications
    addToast: (state, action) => {
      const { type = 'info', message, duration = 5000 } = action.payload;
      state.toasts.push({
        id: ++toastId,
        type,
        message,
        duration
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },

    // Loading states
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loadingStates[key] = value;
    },
    clearLoading: (state, action) => {
      delete state.loadingStates[action.payload];
    },

    // Modal states
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    toggleModal: (state, action) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    }
  }
});

export const {
  addToast,
  removeToast,
  clearAllToasts,
  setLoading,
  clearLoading,
  openModal,
  closeModal,
  toggleModal,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme
} = uiSlice.actions;

// Selectors
export const selectToasts = (state) => state.ui.toasts;
export const selectIsLoading = (key) => (state) => state.ui.loadingStates[key] || false;
export const selectModalState = (modalName) => (state) => state.ui.modals[modalName] || false;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectTheme = (state) => state.ui.theme;

export default uiSlice.reducer;
