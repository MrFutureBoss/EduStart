import mentorCategoryDAO from "../../repositories/mentorDAO/mentor.js";
import teacherDAO from "../../repositories/teacherDAO/index.js";
import mongoose from "mongoose";

// Lấy tất cả MentorCategories
const getAllMentorCategories = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const skip = (pageInt - 1) * limitInt;

    const mentorCategories = await mentorCategoryDAO.getAllMentorCategories(
      skip,
      limitInt
    );
    res.status(200).json(mentorCategories);
  } catch (error) {
    next(error);
  }
};

// Lấy MentorCategory theo ID
const getMentorCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const mentorCategory = await mentorCategoryDAO.getMentorCategoryById(id);

    if (!mentorCategory) {
      return res.status(404).json({ message: "Mentor Category không tồn tại" });
    }

    res.status(200).json(mentorCategory);
  } catch (error) {
    next(error);
  }
};

// Tạo mới MentorCategory
const createNewMentorCategory = async (req, res, next) => {
  try {
    const { mentorId, professionId, specialties, maxLoad } = req.body;

    const newMentorCategory = await mentorCategoryDAO.createNewMentorCategory({
      mentorId,
      professionId,
      specialties,
      maxLoad,
    });

    res.status(201).json(newMentorCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// hàm lấy danh sách data mentor
export const fetchTeacherTreeData = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const data = await mentorCategoryDAO.fetchTreeData(teacherId);
    res.json(data);
  } catch (error) {
    console.error("Detailed server error:", error);
    res
      .status(500)
      .json({ message: "Lỗi server", error: error.message || error });
  }
};

// hàm lấy mentor theo chuyên môn
const getMentorsBySpecialty = async (req, res) => {
  try {
    const { professionId, specialtyId } = req.query;
    const mentors = await mentorCategoryDAO.getMentorsBySpecialty(
      professionId,
      specialtyId
    );
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: `Lỗi server ${error.message}`, error });
  }
};
const getMentorCategoryByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const mentorCategory = await mentorCategoryDAO.getMentorCategoryByUserId(
      userId
    );

    if (!mentorCategory) {
      return res
        .status(404)
        .json({ message: "Mentor category không tìm thấy" });
    }

    res.status(200).json(mentorCategory);
  } catch (error) {
    console.error("Error fetching mentor category by userId:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export default {
  getAllMentorCategories,
  getMentorCategoryById,
  createNewMentorCategory,
  getMentorsBySpecialty,
  fetchTeacherTreeData,
  getMentorCategoryByUserId,
};
