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
  selectedProfessionId: null,
  selectedSpecialtyId: null,
  professionName: "",
  specialtyName: "",
  selectedMentorsBySpecialty: {}, // Lưu danh sách mentor theo specialty
  availableMentorsBySpecialty: {}, // Lưu danh sách mentor khả dụng theo specialty
};

const selectMentorSlice = createSlice({
  name: "selectMentor",
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
    setProfession: (state, action) => {
      const { professionId, professionName } = action.payload;
      state.selectedProfessionId = professionId;
      state.professionName = professionName;
    },
    setSpecialty: (state, action) => {
      const { specialtyId, specialtyName } = action.payload;
      state.selectedSpecialtyId = specialtyId;
      state.specialtyName = specialtyName;
    },
    setSelectedMentors: (state, action) => {
      const { specialtyId, mentors } = action.payload;
      state.selectedMentorsBySpecialty[specialtyId] = mentors.map(
        (mentor, index) => ({
          ...mentor,
          priority: index + 1, // Ensure priority matches the index
        })
      );
    },
    setAvailableMentors: (state, action) => {
      const { specialtyId, mentors } = action.payload;
      state.availableMentorsBySpecialty[specialtyId] = mentors;
    },
  },
});

const { reducer, actions } = selectMentorSlice;
export const {
  setProfessions,
  setSpecialtiesData,
  setSearchResults,
  setProfession,
  setSpecialty,
  setSelectedMentors,
  setAvailableMentors,
} = actions;
export default reducer;
