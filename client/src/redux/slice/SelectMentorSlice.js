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
  selectedMentorsBySpecialty: {},
  availableMentorsBySpecialty: {},
  mentorsBySpecialty: {},
  updatedCount: 0,
  notUpdatedCount: 0,
  professionCount: 0,
  specialtyCount: 0,
  stepCheck: 0,
};

const selectMentorSlice = createSlice({
  name: "selectMentor",
  initialState: initialValue,
  reducers: {
    setProfessions: (state, action) => {
      state.professions.data = action.payload.map((profession) => ({
        title: profession.name,
        professionId: profession._id,
        professionName: profession.name,
        key: profession._id,
        children: profession.specialty.map((specialty) => ({
          title: specialty.name,
          specialtyId: specialty._id,
          professionId: profession._id,
          key: `${profession._id}-${specialty._id}`,
          isUpdated: specialty.isUpdated,
          isLeaf: true,
        })),
      }));
      state.professions.total = action.payload.length;
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
      // Sắp xếp mentors theo priority từ nhỏ đến lớn
      const sortedMentors = mentors
        .map((mentor, index) => ({
          ...mentor,
          priority: index + 1, // Đảm bảo priority đúng theo index
        }))
        .sort((a, b) => a.priority - b.priority); // Sắp xếp theo priority
      state.selectedMentorsBySpecialty[specialtyId] = sortedMentors;
    },
    setAvailableMentors: (state, action) => {
      const { specialtyId, mentors } = action.payload;
      state.availableMentorsBySpecialty[specialtyId] = mentors;
    },
    setCountsUpdate(state, action) {
      state.updatedCount = action.payload.updatedCount;
      state.notUpdatedCount = action.payload.notUpdatedCount;
      state.specialtyCount = action.payload.specialtyCount;
      state.professionCount = action.payload.professionCount;
    },

    setStepCheck: (state, action) => {
      state.stepCheck = action.payload;
    },
    setMentorsBySpecialty: (state, action) => {
      const { specialtyId, mentors } = action.payload;
      // Sắp xếp mentors theo priority từ nhỏ đến lớn
      const sortedMentors = mentors
        .map((mentor, index) => ({
          ...mentor,
          priority: index + 1, // Đảm bảo priority đúng theo index
        }))
        .sort((a, b) => a.priority - b.priority); // Sắp xếp theo priority
      state.mentorsBySpecialty[specialtyId] = sortedMentors;
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
  setCountsUpdate,
  setMentorsBySpecialty,
  setStepCheck,
} = actions;
export default reducer;
