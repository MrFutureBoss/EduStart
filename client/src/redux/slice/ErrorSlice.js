import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  fetchError: false,
  errorMessages: [],
  fullClassUsers: [],
  failedEmails: [],
};
const errorSlice = createSlice({
  name: "error",
  initialState: initialValue,
  reducers: {
    setFetchError: (state, action) => {
      state.fetchError = action.payload;
    },
    setErrorMessages: (state, action) => {
      state.errorMessages = action.payload;
    },
    clearErrorMessages(state) {
      state.errorMessages = [];
    },
    setFullClassUsers: (state, action) => {
      state.fullClassUsers = action.payload;
    },
    clearFullClassUsers(state) {
      state.fullClassUsers = [];
    },
    setFailedEmails: (state, action) => {
      state.failedEmails = action.payload;
    },
    clearFailedEmails(state) {
      state.failedEmails = [];
    },
  },
});

const { reducer, actions } = errorSlice;
export const {
  setFetchError,
  setErrorMessages,
  setFullClassUsers,
  setFailedEmails,
  clearFailedEmails,
  clearFullClassUsers,
  clearErrorMessages,
} = actions;
export default reducer;
