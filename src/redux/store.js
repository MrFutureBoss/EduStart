import { applyMiddleware } from "redux";
import professionSlice from "./slice/ProfessionSlice.js";
import * as thunk from "redux-thunk";
import { configureStore } from "@reduxjs/toolkit";
import semesterSlide from "./slice/semesterSlide.js";

const rootReducer = {
  profession: professionSlice,
  semester: semesterSlide,
};

const store = configureStore(
  {
    reducer: rootReducer,
  },
  applyMiddleware(thunk)
);

export default store;
