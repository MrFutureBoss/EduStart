import mongoose from "mongoose";
import Group from "../../models/groupModel.js";
import Matched from "../../models/matchedModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Profession from "../../models/professionModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Project from "../../models/projectModel.js";
import Specialty from "../../models/specialtyModel.js";
import TemporaryMatching from "../../models/temporaryMatchingModel.js";
import User from "../../models/userModel.js";
// hàm để tạo matched chờ xác nhận
const createMatched = async (data) => {
  try {
    // Tạo mới một bản ghi Matched
    const matched = new Matched({
      groupId: data.groupId,
      mentorId: data.mentorId,
      status: data.status || "Pending",
    });

    // Tăng currentLoad ngay khi tạo matched
    const mentorCategory = await MentorCategory.findOneAndUpdate(
      { mentorId: data.mentorId },
      { $inc: { currentLoad: 1 } },
      { new: true }
    );

    // Kiểm tra nếu mentor đạt giới hạn maxLoad trong TemporaryMatching và xóa khỏi gợi ý nếu cần
    if (
      mentorCategory &&
      mentorCategory.currentLoad >= mentorCategory.maxLoad
    ) {
      await TemporaryMatching.updateMany(
        {
          $or: [
            { "mentorPreferred.mentorId": data.mentorId },
            { "teacherPreferredMentors.mentorId": data.mentorId },
            { "matchingMentors.mentorId": data.mentorId },
          ],
        },
        {
          $pull: {
            mentorPreferred: { mentorId: data.mentorId },
            teacherPreferredMentors: { mentorId: data.mentorId },
            matchingMentors: { mentorId: data.mentorId },
          },
        }
      );
    }

    // Lưu bản ghi matched mới
    const savedMatched = await matched.save();
    return savedMatched;
  } catch (error) {
    throw error;
  }
};

// Hàm cập nhật matched
const updateMatchedById = async (id, updateData) => {
  try {
    // Cập nhật trạng thái trong model Matched
    const updatedMatched = await Matched.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updateData.status === "Accepted") {
      const mentorId = updateData.mentorId;

      // Kiểm tra lại currentLoad trong MentorCategory
      const mentorCategory = await MentorCategory.findOne({
        mentorId: mentorId,
      });
      if (mentorCategory) {
        const currentLoad = mentorCategory.currentLoad;
        const maxLoad = mentorCategory.maxLoad;

        // Xóa mentor khỏi danh sách trong TemporaryMatching nếu currentLoad đạt maxLoad
        if (currentLoad >= maxLoad) {
          await TemporaryMatching.updateMany(
            {
              $or: [
                { "mentorPreferred.mentorId": mentorId },
                { "teacherPreferredMentors.mentorId": mentorId },
                { "matchingMentors.mentorId": mentorId },
              ],
            },
            {
              $pull: {
                mentorPreferred: { mentorId: mentorId },
                teacherPreferredMentors: { mentorId: mentorId },
                matchingMentors: { mentorId: mentorId },
              },
            }
          );
        }
      }
    } else if (updateData.status === "Rejected") {
      const mentorId = updateData.mentorId;

      // Giảm currentLoad trong MentorCategory khi trạng thái là Rejected
      await MentorCategory.findOneAndUpdate(
        { mentorId: mentorId },
        { $inc: { currentLoad: -1 } },
        { new: true }
      );

      // Cập nhật currentLoad trong TemporaryMatching
      await TemporaryMatching.updateMany(
        {
          $or: [
            { "mentorPreferred.mentorId": mentorId },
            { "teacherPreferredMentors.mentorId": mentorId },
            { "matchingMentors.mentorId": mentorId },
          ],
        },
        {
          $inc: {
            "mentorPreferred.$.currentLoad": -1,
            "teacherPreferredMentors.$.currentLoad": -1,
            "matchingMentors.$.currentLoad": -1,
          },
        }
      );
    }

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

const getAllMatchingDetailByMentorId = async (mentorId) => {
  try {
    // Find all matched records for the mentor
    const matchedRecords = await Matched.find({ mentorId }).populate("groupId");

    if (!matchedRecords.length) {
      return { message: "No groups found for this mentor.", groups: [] };
    }

    const groupDetails = await Promise.all(
      matchedRecords.map(async (matched) => {
        const group = await Group.findById(matched.groupId._id)
          .populate("projectId") 
          .populate("classId", "className"); 

        if (!group) return null;

        const groupMembers = await User.find({ groupId: group._id })
          .select(
            "username email phoneNumber rollNumber memberCode status isLeader major"
          )
          .lean();

        const memberClassId = groupMembers[0].classId;

        const teacher = await User.findOne({
          role: 2,
          classId: memberClassId,
        })
          .select("username email")
          .lean();

        const project = group.projectId
          ? await Project.findById(group.projectId._id).lean()
          : null;
        const projectCategory = project
          ? await ProjectCategory.findOne({ projectId: project._id }).lean()
          : null;
        let professionDetails = [];
        let specialtyDetails = [];
        if (projectCategory) {
          professionDetails = await Profession.find({
            _id: { $in: projectCategory.professionId },
          })
            .select("name status")
            .lean();

          specialtyDetails = await Specialty.find({
            _id: { $in: projectCategory.specialtyIds },
          })
            .select("name status")
            .lean();
        }

        return {
          group: {
            name: group.name,
            description: group.description,
            status: group.status,
          },
          class: {
            className: group.classId?.className || null,
          },
          teacher: teacher || null,
          members: groupMembers,
          project: project || null,
          projectCategory: {
            profession: professionDetails,
            specialties: specialtyDetails,
          },
          matchedDetails: {
            _id: matched._id,
            status: matched.status,
            createdAt: matched.createdAt,
            updatedAt: matched.updatedAt,
            time: matched.time,
          },
        };
      })
    );

    return { groups: groupDetails.filter((detail) => detail !== null) };
  } catch (error) {
    console.error("Error fetching matching details:", error);
    throw new Error("Unable to retrieve matching details.");
  }
};

const patchMatchedById = async (id, updateData) => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid Matched ID format");
    }

    const updatedMatched = await Matched.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMatched) {
      throw new Error("Matched record not found");
    }

    return updatedMatched;
  } catch (error) {
    console.error("Error updating Matched record:", error.message);
    throw new Error(error.message);
  }
};

export default {
  createMatched,
  updateMatchedById,
  deleteMatchedById,
  getMatchedInfoByGroupId,
  getAllMatchingDetailByMentorId,
  patchMatchedById,
};
