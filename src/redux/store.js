import { applyMiddleware } from "redux";
import professionSlice from "./slice/ProfessionSlice.js";
import * as thunk from "redux-thunk";
import { configureStore } from "@reduxjs/toolkit";

const rootReducer = {
  profession: professionSlice,
};

const store = configureStore(
  {
    reducer: rootReducer,
  },
  applyMiddleware(thunk)
);

export default store;
