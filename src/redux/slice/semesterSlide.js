import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  semesters: [],
  semester: {},
  semesterName: "",
  sid: "",
  usersInSmt: [],
  smtDet: "",
  loading: false,
  error: null,
};

const semesterSlice = createSlice({
  name: "semester",
  initialState: initialValue,
  reducers: {
    setSemesters: (state, action) => {
      state.semesters = action.payload;
    },
    setSid: (state, action) => {
      state.sid = action.payload;
    },
    setSemester: (state, action) => {
      state.semester = action.payload;
    },
    setUsersInSmt: (state, action) => {
      state.usersInSmt = action.payload;
    },
    setSmtDet: (state, action) => {
      state.smtDet = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSemesterName: (state, action) => {
      state.semesterName = action.payload;
    },
  },
});

const { reducer, actions } = semesterSlice;
export const {
  setSemesters,
  setSid,
  setSemester,
  setUsersInSmt,
  setSmtDet,
  setLoading,
  setError,
  setSemesterName,
} = actions;
export default reducer;
