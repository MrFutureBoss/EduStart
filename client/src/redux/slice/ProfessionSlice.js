import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  professions: {
    data: [],
    total: 0,
  },
  specialtiesData: {
    data: [],
    total: 0,
  }
};

const professionSlice = createSlice({
  name: "profession",
  initialState: initialValue,
  reducers: {
    setProfessions: (state, action) => {
      state.professions = action.payload;
      state.professions.total = action.payload.length;
    },
    setSpecialtiesData: (state, action) => {
      state.specialtiesData= action.payload;
      state.specialtiesData.total = action.payload.length;
    }
  },
});

const { reducer, actions } = professionSlice;
export const { setProfessions, setSpecialtiesData } = actions;
export default reducer;
