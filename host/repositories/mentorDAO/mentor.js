import Group from "../../models/groupModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Profession from "../../models/professionModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Specialty from "../../models/specialtyModel.js";
import mongoose from "mongoose";
import User from "../../models/userModel.js";
import TeacherSelection from "../../models/teacherSelection.js";

// hàm này để lọc danh sách các nhóm có cung lĩnh vực với mentor để mentor lựa chọn
const getAvailableGroupsForMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Lấy thông tin chuyên môn của mentor
    const mentorCategories = await MentorCategory.find({ mentorId })
      .populate("professionId")
      .populate("specialtyIds");

    const mentorProfessionIds = mentorCategories.map((mc) =>
      mc.professionId._id.toString()
    );
    const mentorSpecialtyIds = mentorCategories.flatMap((mc) =>
      mc.specialtyIds.map((s) => s._id.toString())
    );

    // Lấy danh sách tất cả các nhóm chưa được ghép mentor
    const groups = await Group.find({
      /* Điều kiện để lấy các nhóm phù hợp */
    }).populate("projectId");

    const availableGroups = [];

    for (let group of groups) {
      // Lấy thông tin ProjectCategory của nhóm
      const projectCategory = await ProjectCategory.findOne({
        projectId: group.projectId._id,
      })
        .populate("professionId")
        .populate("specialtyIds");

      if (!projectCategory) {
        continue; // Bỏ qua nhóm chưa cập nhật lĩnh vực và chuyên ngành
      }

      const groupProfessionId = projectCategory.professionId._id.toString();
      const groupSpecialtyIds = projectCategory.specialtyIds.map((s) =>
        s._id.toString()
      );

      const hasMatchingProfession =
        mentorProfessionIds.includes(groupProfessionId);
      const hasMatchingSpecialty = mentorSpecialtyIds.some((specId) =>
        groupSpecialtyIds.includes(specId)
      );

      if (hasMatchingProfession || hasMatchingSpecialty) {
        availableGroups.push(group);
      }
    }

    res.json(availableGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả MentorCategories
const getAllMentorCategories = async (skip, limit) => {
  try {
    return await MentorCategory.find()
      .populate("mentorId professionId specialties.specialtyId")
      .skip(skip)
      .limit(limit);
  } catch (error) {
    throw new Error(`Unable to retrieve mentor categories: ${error.message}`);
  }
};

// Lấy MentorCategory theo ID

const getMentorCategoryById = async (id) => {
  try {
    return await MentorCategory.findById(id).populate(
      "mentorId professionId specialties.specialtyId"
    );
  } catch (error) {
    throw new Error(
      `Unable to find mentor category with ID ${id}: ${error.message}`
    );
  }
};

// Tạo mới MentorCategory
const createNewMentorCategory = async (mentorCategoryData) => {
  try {
    const newMentorCategory = new MentorCategory(mentorCategoryData);
    return await newMentorCategory.save();
  } catch (error) {
    throw new Error(`Unable to create mentor category: ${error.message}`);
  }
};

// hàm lấy danh sách lĩnh vực
const fetchTreeData = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== 2) {
    throw new Error("Giáo viên không tồn tại.");
  }

  // Lấy tất cả Profession cùng Specialty
  const professions = await Profession.find()
    .populate("specialty", "_id name status")
    .lean();

  // Lấy danh sách specialtyId đã cập nhật
  const teacherSelections = await TeacherSelection.find({
    teacherId,
  }).lean();
  const updatedSpecialtyIds = new Set(
    teacherSelections.map((selection) => selection.specialtyId.toString())
  );

  // Xây dựng treeData với thông tin isUpdated
  const treeData = professions.map((profession) => {
    const specialties = (profession.specialty || []).map((specialty) => {
      const isUpdated = updatedSpecialtyIds.has(specialty._id.toString());
      return {
        _id: specialty._id,
        name: specialty.name,
        status: specialty.status,
        isUpdated,
      };
    });

    return {
      _id: profession._id,
      name: profession.name,
      status: profession.status,
      specialty: specialties,
    };
  });

  // Đếm số lượng profession và specialty
  const professionCount = professions.length;
  const specialtyCount = treeData.reduce(
    (count, profession) =>
      count + (profession.specialty ? profession.specialty.length : 0),
    0
  );

  // Đếm số lượng đã cập nhật và chưa cập nhật
  const updatedCount = teacherSelections.length;
  const notUpdatedCount = specialtyCount - updatedCount;

  return {
    professionCount,
    specialtyCount,
    updatedCount,
    notUpdatedCount,
    treeData,
  };
};

// hàm lấy mentor theo chuyên môn
const getMentorsBySpecialty = async (professionId, specialtyId) => {
  const mentors = await MentorCategory.find({
    professionIds: professionId,
    "specialties.specialtyId": specialtyId,
  })
    .populate({
      path: "mentorId",
      select: "username email phoneNumber",
    })
    .lean();

  return mentors;
};

export default {
  getAvailableGroupsForMentor,
  getAllMentorCategories,
  getMentorCategoryById,
  createNewMentorCategory,
  getMentorsBySpecialty,
  fetchTreeData,
};
