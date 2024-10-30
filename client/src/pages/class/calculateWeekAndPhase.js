// Hàm tính tuần học và giai đoạn
const calculateWeekAndPhase = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  // Tính thời gian đã đi được bao nhiêu lâu (mls)
  const diffInMs = now - start;
  // Quy đổi ra tuần học
  const diffInWeeks = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000));

  //Công thức
  // 1000 là số mili-giây trong một giây.
  // 60 giây tạo thành một phút.
  // 60 phút tạo thành một giờ.
  // 24 giờ tạo thành một ngày.
  // 7 ngày tạo thành một tuần.
  // Tất cả nhân lại thành (7 * 24 * 60 * 60 * 1000) số mili-giây trong một tuần 
 
  // Xác định tuần học (min 0 và max 10)
  let week = Math.max(0, Math.min(diffInWeeks, 10));
// const week = 2;
   // Xác định các giai đoạn dựa trên tuần học
   let phases = [];
   if (week === 0) {
     phases = ["Chưa bắt đầu"];
   } else if (week === 1) {
     phases = ["Đang tạo nhóm"];
   } else if (week === 2) {
     phases = ["Chốt nhóm xong", "Chốt đề tài nhóm"];
   } else if (week >= 3 && week <= 4) {
     phases = ["Đang ghép nhóm với mentor", "Outcome 1"];
   } else if (week >= 5 && week <= 7) {
     phases = ["Outcome 2"];
   } else if (week >= 8 && week <= 10) {
     phases = ["Outcome 3"];
   } else {
     phases = ["Môn học đã kết thúc"];
   }
 
   return { week, phases };
};

export default calculateWeekAndPhase;
