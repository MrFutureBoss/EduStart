import Group from "../../models/groupModel";
import MentorCategory from "../../models/mentorCategoryModel";
import ProjectCategory from "../../models/ProjectCategoryModel ";
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
export default {
  getAvailableGroupsForMentor,
};
