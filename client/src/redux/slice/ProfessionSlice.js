import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  professions: {
    data: [],
    total: 0,
  },
  specialtiesData: {
    data: [],
    total: 0,
  },
  searchResults: {
    professions: [],
    specialties: [], 
  },
};

const professionSlice = createSlice({
  name: "profession",
  initialState: initialValue,
  reducers: {
    setProfessions: (state, action) => {
      state.professions = action.payload;
      state.professions.total = action.payload.data.length; // Update total based on data array length
    },
    setSpecialtiesData: (state, action) => {
      state.specialtiesData = action.payload;
      state.specialtiesData.total = action.payload.data.length || 0;
    },
    setSearchResults: (state, action) => {
      state.searchResults.professions = action.payload.professions || [];
      state.searchResults.specialties = action.payload.specialties || [];
    },
  },
});

const { reducer, actions } = professionSlice;
export const { setProfessions, setSpecialtiesData, setSearchResults } = actions;
export default reducer;
