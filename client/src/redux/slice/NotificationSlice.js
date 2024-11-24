import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  highlevel: true,
  warminglevel: true,
  teacherDashboardNotification: false,
  notificationData: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState: initialValue,
  reducers: {
    setHighPriorityTrigger: (state, action) => {
      state.highlevel = action.payload;
    },
    setNotificationData: (state, action) => {
      state.notificationData = action.payload;
    },
    setWarmingPriorityTrigger: (state, action) => {
      state.warminglevel = action.payload;
    },
    triggerTeacherDashboardNotification: (state) => {
      state.teacherDashboardNotification = true;
    },
    resetTeacherDashboardNotification: (state) => {
      state.teacherDashboardNotification = false;
    },
  },
});

export const {
  setHighPriorityTrigger,
  setWarmingPriorityTrigger,
  triggerTeacherDashboardNotification,
  resetTeacherDashboardNotification,
  setNotificationData,
} = notificationSlice.actions;
export default notificationSlice.reducer;
