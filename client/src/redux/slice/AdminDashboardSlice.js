// adminDashboardSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  transferRequestsCount: 0,
  tasksStatus: {
    createSemester: false,
    addTeachers: false,
    addMentors: false,
    addStudents: false,
    studentsPending: false,
  },
  taskDetails: {
    semesterName: "Chưa có",
    teacherCount: 0,
    mentorCount: 0,
    studentCount: 0,
    pendingStudentCount: 0,
    studentsWithoutClass: 0,
    status: "",
  },
  alerts: [],
  isLoading: false,
};

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    setTransferRequestsCount(state, action) {
      state.transferRequestsCount = action.payload;
    },
    setTasksStatus(state, action) {
      state.tasksStatus = action.payload;
    },
    updateTasksStatus(state, action) {
      Object.assign(state.tasksStatus, action.payload);
    },
    setTaskDetails(state, action) {
      state.taskDetails = action.payload;
    },
    updateTaskDetails(state, action) {
      Object.assign(state.taskDetails, action.payload);
    },
    setAlerts(state, action) {
      state.alerts = action.payload;
    },
    addAlert(state, action) {
      const alertExists = state.alerts.some(
        (alert) =>
          alert.message === action.payload.message &&
          alert.description === action.payload.description
      );
      if (!alertExists) {
        state.alerts.push(action.payload);
      }
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setTransferRequestsCount,
  setTasksStatus,
  updateTasksStatus,
  setTaskDetails,
  updateTaskDetails,
  setAlerts,
  addAlert,
  setIsLoading,
} = adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;
