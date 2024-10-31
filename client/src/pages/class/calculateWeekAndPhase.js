const calculateWeekAndPhase = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  
  // Tính thời gian đã đi được bao nhiêu lâu (ms)
  const diffInMs = now - start;
  
  // Quy đổi ra tuần học
  const diffInWeeks = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000));
  
  // Xác định tuần học (min 0 và max 10)
  let week = Math.max(0, Math.min(diffInWeeks, 10));
  
  week = 2;
  // Tính số ngày còn lại trước khi đến phase tiếp theo
  const nextWeekStart = new Date(start.getTime() + (week + 1) * 7 * 24 * 60 * 60 * 1000);
  const diffToNextWeek = Math.max(1, Math.ceil((nextWeekStart - now) / (24 * 60 * 60 * 1000)));
  
  // Xác định các giai đoạn dựa trên tuần học
  let phases = [];
  if (week === 0) {
    phases = ["Chưa bắt đầu"];
  } else if (week === 1) {
    phases = ["Đang tạo nhóm"];
  } else if (week === 2) {
    phases = ["Chốt xong nhóm", "Chốt đề tài nhóm"];
  } else if (week >= 3 && week <= 4) {
    phases = ["Đang ghép nhóm với mentor", "Outcome 1"];
  } else if (week >= 5 && week <= 7) {
    phases = ["Outcome 2"];
  } else if (week >= 8 && week <= 10) {
    phases = ["Outcome 3"];
  } else {
    phases = ["Môn học đã kết thúc"];
  }
  
  return { week, phases, daysRemain: diffToNextWeek };
};

export default calculateWeekAndPhase;
