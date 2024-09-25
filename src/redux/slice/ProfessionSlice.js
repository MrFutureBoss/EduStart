import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  professions: {
    data: [],
    total: 0,
  },
};

const professionSlice = createSlice({
  name: "profession",
  initialState: initialValue,
  reducers: {
    setProfessions: (state, action) => {
      state.professions = action.payload;
    },
  },
});

const { reducer, actions } = professionSlice;
export const { setProfessions } = actions;
export default reducer;
