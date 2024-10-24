import Group from "../../models/groupModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Profession from "../../models/professionModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Specialty from "../../models/specialtyModel.js";
import mongoose from "mongoose";

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
const fetchTreeData = async () => {
  try {
    const mentorCategories = await MentorCategory.find()
      .populate("professionIds")
      .select("professionIds")
      .lean();

    // Lấy tất cả các ObjectId từ professionIds
    const allProfessionIds = mentorCategories.flatMap((item) =>
      item.professionIds.map((prof) => prof._id)
    );

    // Lọc để lấy các professionId duy nhất
    const uniqueProfessionIds = [
      ...new Set(allProfessionIds.map((id) => id.toString())),
    ].map((id) => new mongoose.Types.ObjectId(id));

    // Tìm tất cả các profession theo các professionId đã lọc
    const professions = await Profession.find({
      _id: { $in: uniqueProfessionIds },
    }).lean();

    // Với mỗi profession, lấy các specialty liên quan
    for (const profession of professions) {
      if (profession.specialty && Array.isArray(profession.specialty)) {
        try {
          const specialties = await Specialty.find({
            _id: { $in: profession.specialty },
          }).lean();
          profession.specialty = specialties;
        } catch (error) {
          profession.specialty = [];
        }
      } else {
        profession.specialty = [];
      }
    }

    return professions;
  } catch (error) {
    throw new Error("Lỗi server khi lấy dữ liệu profession và specialty.");
  }
};

// hàm lấy mentor theo chuyên môn
const getMentorsBySpecialty = async (professionId, specialtyId) => {
  const mentors = await MentorCategory.find({
    professionIds: professionId,
    "specialties.specialtyId": specialtyId,
  })
    .populate({
      path: "mentorId",
      select: "username email",
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
