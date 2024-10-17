import mentorCategoryDAO from "../../repositories/mentorDAO/mentor.js";
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

export default {
  getAllMentorCategories,
  getMentorCategoryById,
  createNewMentorCategory,
};