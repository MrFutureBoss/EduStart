import { createSlice } from "@reduxjs/toolkit";

const tempGroupSlice = createSlice({
  name: "tempGroup",
  initialState: {
    data: [],
    total: 0,
    waituserlist: [],
    waittotal: 0,
    searchResults: null,
    error: null,
  },
  reducers: {
    setTempGroups: (state, action) => {
      state.data = action.payload;
    },
    setTotalTempGroups: (state, action) => {
      state.total = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setWaitUserList: (state, action) => {
      state.waituserlist = action.payload;
    },
    setTotalWaitUsers: (state, action) => {
      state.waittotal = action.payload;
    },
    setSearchUserList: (state, action) => {
      state.searchResults = action.payload;
    },
    resetSearch: (state) => {
      state.searchResults = null;
    },
  },
});

export const {
  setTempGroups,
  setTotalTempGroups,
  setError,
  setWaitUserList,
  setTotalWaitUsers,
  setSearchUserList,
  resetSearch,
} = tempGroupSlice.actions;

export default tempGroupSlice.reducer;
