import { createSlice } from "@reduxjs/toolkit";
function getInitialMaxStudentsPerClass() {
  const savedMaxStudents = localStorage.getItem("maxStudentsPerClass");
  return savedMaxStudents ? JSON.parse(savedMaxStudents) : 32;
}
export const removeAlert = (message) => (dispatch, getState) => {
  const { alerts } = getState().adminDashboard;
  const filteredAlerts = alerts.filter((alert) => alert.message !== message);
  dispatch({
    type: "REMOVE_ALERT",
    payload: filteredAlerts,
  });
};

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
  pendingUsers: [],
  classesList: [],
  fullClassesList: [],
  maxStudentsPerClass: getInitialMaxStudentsPerClass(),
  studentsWithClass: 0,
  studentsWithoutClass: 0,
  teachersWithClassCount: 0,
  teachersWithoutClassCount: 0,
  classesWithStudentsCount: 0,
  classesWithoutStudentsCount: 0,
  classesWithStudentsList: [],
  classesWithoutStudentsList: [],
  teachersWithClasses: [],
  teachersWithoutClasses: [],
  mentorsWithMatch: [],
  mentorsWithoutMatch: [],
  isChangeSemester: false,
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
      state.studentsWithClass = action.payload.studentsWithClass;
      state.studentsWithoutClass = action.payload.studentsWithoutClass;
      state.teachersWithClassCount = action.payload.teachersWithClassCount;
      state.teachersWithoutClassCount =
        action.payload.teachersWithoutClassCount;
      state.classesWithStudentsCount = action.payload.classesWithStudentsCount;
      state.classesWithoutStudentsCount =
        action.payload.classesWithoutStudentsCount;
    },
    setCurrentSemester: (state, action) => {
      state.currentSemester = action.payload;
    },
    setDetailSemester(state, action) {
      state.classesWithStudentsList = action.payload.classesWithStudentsList;
      state.classesWithoutStudentsList =
        action.payload.classesWithoutStudentsList;
      state.teachersWithClasses = action.payload.teachersWithClasses;
      state.teachersWithoutClasses = action.payload.teachersWithoutClasses;
      state.mentorsWithMatch = action.payload.mentorsWithMatch;
      state.mentorsWithoutMatch = action.payload.mentorsWithoutMatch;
    },
    setPendingUsers: (state, action) => {
      state.pendingUsers = action.payload;
    },
    setClassesList: (state, action) => {
      state.classesList = action.payload;
    },
    setFullClassesList: (state, action) => {
      state.fullClassesList = action.payload;
    },
    setIsChangeSemester: (state, action) => {
      state.isChangeSemester = action.payload;
    },
    setMaxStudentsPerClass(state, action) {
      state.maxStudentsPerClass = action.payload;
      localStorage.setItem(
        "maxStudentsPerClass",
        JSON.stringify(action.payload)
      );
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
  setPendingUsers,
  setClassesList,
  setFullClassesList,
  setMaxStudentsPerClass,
  setDetailSemester,
  setIsChangeSemester,
} = actions;
export default reducer;
