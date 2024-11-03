import Group from "../../models/groupModel.js";
import Matched from "../../models/matchedModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Profession from "../../models/professionModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Project from "../../models/projectModel.js";
import Specialty from "../../models/specialtyModel.js";
// hàm để tạo matched chờ xác nhận
const createMatched = async (data) => {
  try {
    const matched = new Matched({
      groupId: data.groupId,
      mentorId: data.mentorId,
      status: data.status || "Pending",
    });

    const savedMatched = await matched.save();
    return savedMatched;
  } catch (error) {
    throw error;
  }
};
//hàm để cập nhật matched
const updateMatchedById = async (id, updateData) => {
  try {
    const updatedMatched = await Matched.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return updatedMatched;
  } catch (error) {
    throw error;
  }
};
// hàm để xoá matched
const deleteMatchedById = async (id) => {
  try {
    const deletedMatched = await Matched.findByIdAndDelete(id);
    return deletedMatched;
  } catch (error) {
    throw error;
  }
};

const getMatchedInfoByGroupId = async (groupId) => {
  try {
    // Tìm matched record theo groupId và populate Group, Project và Mentor
    const matchedInfo = await Matched.findOne({ groupId })
      .populate({
        path: "groupId",
        model: Group,
        select: "name description status projectId",
        populate: {
          path: "projectId",
          model: Project,
          select: "name status description",
        },
      })
      .populate({
        path: "mentorId",
        model: "User",
        select: "username email phoneNumber",
      });

    // Kiểm tra nếu matchedInfo hoặc groupId không tồn tại
    if (
      !matchedInfo ||
      !matchedInfo.groupId ||
      !matchedInfo.groupId.projectId
    ) {
      throw new Error(
        "Không tìm thấy thông tin matched hoặc project liên quan."
      );
    }

    // Lấy projectId để tìm ProjectCategory và populate các trường liên quan
    const projectCategory = await ProjectCategory.findOne({
      projectId: matchedInfo.groupId.projectId._id,
    })
      .populate({
        path: "professionId",
        model: "Profession",
        select: "name",
      })
      .populate({
        path: "specialtyIds",
        model: "Specialty",
        select: "name",
      });

    // Thêm projectCategory vào matchedInfo để trả về đầy đủ dữ liệu
    return { ...matchedInfo.toObject(), projectCategory };
  } catch (error) {
    console.error("Chi tiết lỗi khi lấy thông tin matched từ database:", error);
    throw new Error("Lỗi khi lấy thông tin matched từ database.");
  }
};

export default {
  createMatched,
  updateMatchedById,
  deleteMatchedById,
  getMatchedInfoByGroupId,
};
