// redux/selectors.js
import { createSelector } from "reselect";

// Input selector
const selectSelectMentor = (state) => state.selectMentor;

// Selector để lấy mentors đã chọn theo chuyên môn
export const selectSelectedMentorsBySpecialty = (specialtyId) =>
  createSelector(
    [selectSelectMentor],
    (selectMentor) => selectMentor.selectedMentorsBySpecialty[specialtyId] || []
  );

// Selector để lấy mentors khả dụng theo chuyên môn
export const selectAvailableMentorsBySpecialty = (specialtyId) =>
  createSelector(
    [selectSelectMentor],
    (selectMentor) =>
      selectMentor.availableMentorsBySpecialty[specialtyId] || []
  );

// Selector để lấy tên nghề nghiệp
export const selectProfessionName = createSelector(
  [selectSelectMentor],
  (selectMentor) => selectMentor.professionName
);

// Selector để lấy tên chuyên môn
export const selectSpecialtyName = createSelector(
  [selectSelectMentor],
  (selectMentor) => selectMentor.specialtyName
);
