import MentorCategory from "../../models/mentorCategoryModel.js";
import TeacherSelection from "../../models/teacherSelection.js";

const saveSelection = async ({
  teacherId,
  professionId,
  specialtyId,
  selectedMentors,
}) => {
  // Xóa lựa chọn cũ của giáo viên cho professionId và specialtyId này
  await TeacherSelection.findOneAndDelete({
    teacherId,
    professionId,
    specialtyId,
  });

  // Tạo lựa chọn mới
  const newSelection = new TeacherSelection({
    teacherId,
    professionId,
    specialtyId,
    selectedMentors,
  });

  await newSelection.save();
  return { message: "Lưu lựa chọn thành công" };
};

const getSelection = async ({ teacherId, professionId, specialtyId }) => {
  const selection = await TeacherSelection.findOne({
    teacherId,
    professionId,
    specialtyId,
  }).lean();

  if (!selection) {
    return [];
  }

  // Lấy danh sách mentorId từ selectedMentors
  const mentorIds = selection.selectedMentors.map(
    (mentorData) => mentorData.mentorId
  );

  // Lấy thông tin chi tiết của mentor từ bảng MentorCategory
  const mentors = await MentorCategory.find({
    mentorId: { $in: mentorIds },
  })
    .populate({
      path: "mentorId",
      select: "username email",
    })
    .lean();

  // Gắn thêm thông tin priority vào từng mentor
  const mentorsWithPriority = mentors.map((mentor) => {
    const priorityData = selection.selectedMentors.find(
      (m) => m.mentorId.toString() === mentor.mentorId._id.toString()
    );
    return {
      ...mentor,
      priority: priorityData.priority,
    };
  });

  return mentorsWithPriority;
};

export default {
  saveSelection,
  getSelection,
};
