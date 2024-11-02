import { applyMiddleware } from "redux";
import professionSlice from "./slice/ProfessionSlice.js";
import userSlice from "./slice/UserSlice";
import errorSlice from "./slice/ErrorSlice";

import * as thunk from "redux-thunk";
import { configureStore } from "@reduxjs/toolkit";
import semesterSlide from "./slice/semesterSlide.js";
import specialtySlice from "./slice/SpecialtySlice.js";
import activitySlice from "./slice/ActivitySlice.js";
import classSlice from "./slice/ClassSlice.js";
import classManagementSlice from "./slice/ClassManagementSlice.js";
import tempGroupSlice from "./slice/TempGroupSlice.js";
import selectMentorSlice from "./slice/SelectMentorSlice.js";
import notificationSlice from "./slice/NotificationSlice.js";

const rootReducer = {
  profession: professionSlice,
  user: userSlice,
  error: errorSlice,
  semester: semesterSlide,
  specialty: specialtySlice,
  activities: activitySlice,
  class: classSlice,
  classManagement: classManagementSlice,
  tempGroup: tempGroupSlice,
  selectMentor: selectMentorSlice,
  notification: notificationSlice,
};

const store = configureStore(
  {
    reducer: rootReducer,
  },
  applyMiddleware(thunk)
);

export default store;
