import MentorCategory from "../../models/mentorCategoryModel.js";
import TeacherSelection from "../../models/teacherSelection.js";
import User from "../../models/userModel.js";
import mongoose from "mongoose";

const saveSelection = async ({
  teacherId,
  professionId,
  specialtyId,
  selectedMentors,
}) => {
  const teacherObjId = new mongoose.Types.ObjectId(teacherId);
  const professionObjId = new mongoose.Types.ObjectId(professionId);
  const specialtyObjId = new mongoose.Types.ObjectId(specialtyId);

  if (selectedMentors.length === 0) {
    // Nếu selectedMentors rỗng, xóa document
    const deleted = await TeacherSelection.findOneAndDelete({
      teacherId: teacherObjId,
      professionId: professionObjId,
      specialtyId: specialtyObjId,
    });
    return { message: "Document đã bị xóa vì không có mentor được chọn" };
  } else {
    // Nếu selectedMentors không rỗng, cập nhật hoặc tạo mới document
    const updatedSelection = await TeacherSelection.findOneAndUpdate(
      {
        teacherId: teacherObjId,
        professionId: professionObjId,
        specialtyId: specialtyObjId,
      },
      {
        teacherId: teacherObjId,
        professionId: professionObjId,
        specialtyId: specialtyObjId,
        selectedMentors,
      },
      {
        new: true, // Trả về document sau khi update
        upsert: true, // Tạo mới document nếu không tồn tại
      }
    );

    return { message: "Lưu lựa chọn thành công" };
  }
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
      select: "username email phoneNumber",
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

// update phone teacher 
const updatePhoneNumberTeacher = async (teacherId, phoneNumber) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      teacherId,
      { phoneNumber },
      { new: true }
    );
    return teacher;
  } catch (error) {
    throw new Error("Không thể cập nhật số điện thoại: " + error.message);
  }
};
export default {
  saveSelection,
  getSelection,
  updatePhoneNumberTeacher,
};
