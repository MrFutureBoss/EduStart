import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  specialties: {
    data: [],
    total: 0,
  },
};

const specialtySlice = createSlice({
  name: "specialty",
  initialState: initialValue,
  reducers: {
    setSpecialties: (state, action) => {
      state.specialties = action.payload;
      state.specialties.total = action.payload.length;
    },
  },
});

export const { setSpecialties } = specialtySlice.actions;
export default specialtySlice.reducer;
