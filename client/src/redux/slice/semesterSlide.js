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
  studentCount: 0,
  teacherCount: 0,
  mentorCount: 0,
  classCount: 0,
  currentSemester: null,
  endDate: null,
  startDate: null,
  status: "",
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
    setCounts(state, action) {
      state.studentCount = action.payload.studentCount;
      state.teacherCount = action.payload.teacherCount;
      state.mentorCount = action.payload.mentorCount;
      state.classCount = action.payload.classCount;
      state.semesterName = action.payload.semesterName;
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.status = action.payload.status;
    },
    setCurrentSemester: (state, action) => {
      state.currentSemester = action.payload;
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
  setCounts,
  setCurrentSemester,
} = actions;
export default reducer;
