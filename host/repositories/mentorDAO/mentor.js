import Group from "../../models/groupModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
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
      .populate('mentorId professionId specialties.specialtyId')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    throw new Error(`Unable to retrieve mentor categories: ${error.message}`);
  }
};

// Lấy MentorCategory theo ID

const getMentorCategoryById = async (id) => {
  try {
    return await MentorCategory.findById(id)
      .populate('mentorId professionId specialties.specialtyId');
  } catch (error) {
    throw new Error(`Unable to find mentor category with ID ${id}: ${error.message}`);
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

export default {
  getAvailableGroupsForMentor,
  getAllMentorCategories,
  getMentorCategoryById,
  createNewMentorCategory,
};
