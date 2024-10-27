import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  fetchError: false,
  errorMessages: [],
  fullClassUsers: [],
  failedEmails: [],
  errorFileUrl: null,
  generalError: null,
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
      state.errorFileUrl = null;
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
    setErrorFileUrl(state, action) {
      state.errorFileUrl = action.payload;
    },
    clearErrorFileUrl(state) {
      if (state.errorFileUrl) {
        URL.revokeObjectURL(state.errorFileUrl);
      }
      state.errorFileUrl = null;
    },
    setGeneralError: (state, action) => {
      state.generalError = action.payload;
    },
    clearGeneralError: (state) => {
      state.generalError = null;
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
  setErrorFileUrl,
  clearErrorFileUrl,
  setGeneralError,
  clearGeneralError,
} = actions;
export default reducer;
