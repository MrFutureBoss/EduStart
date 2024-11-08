import moment from 'moment';

const calculateStartdateAndEnddateOfOutcomes = (semesterStartDate, semesterEndDate) => {
  const start = moment(semesterStartDate, "YYYY-MM-DD");
  const end = moment(semesterEndDate, "YYYY-MM-DD");
  
  const totalDuration = end.diff(start, 'days') + 1; // Tổng số ngày trong kỳ học
  const partDuration = Math.floor(totalDuration / 10); // Số ngày mỗi phần
  
  // 1. Phần dành cho việc tạo nhóm và chốt đề tài (2 phần)
  const reservedStart = start.clone();
  const reservedEnd = reservedStart.clone().add(partDuration * 2 - 1, 'days');
  
  // 2. Outcome 1 (2 phần)
  const outcome1Start = reservedEnd.clone().add(1, 'days');
  let outcome1End = outcome1Start.clone().add(partDuration * 2 - 1, 'days');
  
  // 3. Outcome 2 (3 phần)
  const outcome2Start = outcome1End.clone().add(1, 'days');
  let outcome2End = outcome2Start.clone().add(partDuration * 3 - 1, 'days');
  
  // 4. Outcome 3 (3 phần)
  const outcome3Start = outcome2End.clone().add(1, 'days');
  let outcome3End = outcome3Start.clone().add(partDuration * 3 - 1, 'days');
  
  // Kiểm tra và điều chỉnh endDate của Outcome 3 không vượt quá semesterEndDate
  if (outcome3End.isAfter(end)) {
    outcome3End = end.clone();
  }
  
  return {
    outcome1: {
      startDate: outcome1Start.format("YYYY-MM-DD"),
      endDate: outcome1End.format("YYYY-MM-DD"),
    },
    outcome2: {
      startDate: outcome2Start.format("YYYY-MM-DD"),
      endDate: outcome2End.format("YYYY-MM-DD"),
    },
    outcome3: {
      startDate: outcome3Start.format("YYYY-MM-DD"),
      endDate: outcome3End.format("YYYY-MM-DD"),
    },
  };
};

export default calculateStartdateAndEnddateOfOutcomes;