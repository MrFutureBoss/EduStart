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
import {
  sendEmailToGroupforNewMatching,
  sendEmailToGroupforNewMeetingEvent,
} from "../../utilities/email.js";
import Class from "../../models/classModel.js";
// hàm để tạo matched chờ xác nhận
const createMatched = async (data) => {
  try {
    // Kiểm tra giá trị hợp lệ của status
    const validStatuses = ["Pending", "Accepted", "Rejected"];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error("Giá trị của status không hợp lệ");
    }

    // Tạo mới một bản ghi Matched
    const matched = new Matched({
      groupId: data.groupId,
      mentorId: data.mentorId,
      status: data.status || "Pending",
    });

    // Đếm số lượng bản ghi Matched của mentor
    const currentLoad = await Matched.countDocuments({
      mentorId: data.mentorId,
    });
    console.log("currentLoad", currentLoad);

    // Lấy thông tin maxLoad của mentor
    const mentorCategory = await MentorCategory.findOne({
      mentorId: data.mentorId,
    });

    // Xóa gợi ý của nhóm hiện tại khỏi TemporaryMatching
    await TemporaryMatching.deleteOne(
      { groupId: data.groupId },
      {
        $pull: {
          mentorPreferred: { mentorId: data.mentorId },
          teacherPreferredMentors: { mentorId: data.mentorId },
          matchingMentors: { mentorId: data.mentorId },
        },
      }
    );

    // Nếu mentor đạt maxLoad, xóa khỏi tất cả các nhóm
    if (mentorCategory && currentLoad + 1 >= mentorCategory.maxLoad) {
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

    // Lưu bản ghi Matched mới
    const savedMatched = await matched.save();

    return savedMatched;
  } catch (error) {
    console.error("Error in createMatched:", error);
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
const deleteMatchedById = async (groupId) => {
  try {
    const deletedMatched = await Matched.deleteMany({ groupId });
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

    // Lấy thêm thông tin mentor từ MentorCategory
    const mentorProfession = await MentorCategory.findOne({
      mentorId: matchedInfo.mentorId?._id,
    })
      .populate({
        path: "professionIds",
        model: "Profession",
        select: "name",
      })
      .populate({
        path: "specialties.specialtyId",
        model: "Specialty",
        select: "name",
      });

    // Thêm projectCategory và mentorProfession vào matchedInfo để trả về đầy đủ dữ liệu
    return {
      ...matchedInfo.toObject(),
      projectCategory,
      mentorProfession: mentorProfession || null, // Nếu không có, trả null
    };
  } catch (error) {
    console.error("Chi tiết lỗi khi lấy thông tin matched từ database:", error);
    throw new Error(
      error.message || "Lỗi khi lấy thông tin matched từ database."
    );
  }
};

const getAllMatchingDetailByMentorId = async (mentorId) => {
  try {
    const matchedRecords = await Matched.find({ mentorId }).populate("groupId");

    if (!matchedRecords.length) {
      return { message: "No groups found for this mentor.", groups: [] };
    }

    const groupDetails = await Promise.all(
      matchedRecords.map(async (matched) => {
        const group = await Group.findById(matched.groupId._id)
          .populate("projectId")
          .populate("classId");

        if (!group) return null;

        const groupMembers = await User.find({
          groupId: group._id,
          status: "Active",
        })
          .select(
            "username email phoneNumber rollNumber memberCode status isLeader major"
          )
          .lean();

        // const memberClassId = groupMembers[0].classId;

        const teacher = await User.findOne({
          role: 2,
          _id: group.classId?.teacherId,
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

    // Nếu trạng thái cập nhật là Accepted, tiến hành gửi email
    if (updateData.status === "Accepted") {
      const matched = await Matched.findById(id)
        .populate({
          path: "groupId",
          model: "Group",
          select: "_id",
        })
        .populate({
          path: "mentorId",
          model: "User",
          select: "username email phoneNumber",
        });

      if (!matched) {
        throw new Error("Matched record not found");
      }

      const groupId = matched.groupId._id;
      const mentor = matched.mentorId;

      // Lấy danh sách email của các User trong nhóm
      const groupMembers = await User.find({ groupId: groupId })
        .select("email")
        .lean();

      const recipientEmails = groupMembers.map((member) => member.email);

      // Đẩy các email vào một danh sách promises
      const emailTasks = recipientEmails.map(async (email) => {
        try {
          await sendEmailToGroupforNewMatching(
            email,
            mentor.username,
            mentor.email,
            mentor.phoneNumber
          );
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error.message);
        }
      });

      // Chạy các promises song song
      await Promise.all(emailTasks);
    }

    return updatedMatched;
  } catch (error) {
    console.error("Error updating Matched record:", error.message);
    throw new Error(error.message);
  }
};

const createNewTimeEvents = async (id, newTimeArray) => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid Matched ID format");
    }

    if (!Array.isArray(newTimeArray) || newTimeArray.length === 0) {
      throw new Error("Time data must be a non-empty array");
    }

    // Cập nhật sự kiện thời gian mới
    const updatedMatched = await Matched.findByIdAndUpdate(
      id,
      { $push: { time: { $each: newTimeArray } } },
      { new: true, runValidators: true }
    );

    if (!updatedMatched) {
      throw new Error("Matched record not found");
    }

    // Tìm matched và lấy thông tin groupId và mentorId
    const matched = await Matched.findById(id)
      .populate({
        path: "groupId",
        model: "Group",
        select: "_id",
      })
      .populate({
        path: "mentorId",
        model: "User",
        select: "username email phoneNumber",
      });

    if (!matched) {
      throw new Error("Matched record not found");
    }

    const groupId = matched.groupId._id;

    // Lấy danh sách email của các User trong nhóm
    const groupMembers = await User.find({ groupId: groupId })
      .select("email")
      .lean();

    const recipientEmails = groupMembers.map((member) => member.email);

    // Tạo danh sách tác vụ gửi email song song
    const emailTasks = recipientEmails.flatMap((email) =>
      newTimeArray.map(async (event) => {
        const title = event.title;
        const date = new Date(event.start).toLocaleDateString();
        const start = new Date(event.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const end = new Date(event.end).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        try {
          await sendEmailToGroupforNewMeetingEvent(
            email,
            title,
            date,
            start,
            end
          );
        } catch (error) {
          console.error(
            `Error sending email to ${email} for event "${title}":`,
            error.message
          );
        }
      })
    );

    // Chạy tất cả tác vụ gửi email song song
    await Promise.all(emailTasks);

    return updatedMatched;
  } catch (error) {
    console.error("Error creating new time events:", error.message);
    throw new Error(error.message);
  }
};

const patchTimeEventById = async (eventId, updateData) => {
  try {
    if (!mongoose.isValidObjectId(eventId)) {
      throw new Error("Invalid Event ID format");
    }

    const updatedMatched = await Matched.findOneAndUpdate(
      { "time._id": eventId },
      {
        $set: {
          "time.$": updateData, // Cập nhật toàn bộ object của event con
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedMatched) {
      throw new Error("Event record not found");
    }

    return updatedMatched;
  } catch (error) {
    console.error("Error updating time event:", error.message);
    throw new Error(error.message);
  }
};

const deleteTimeEventById = async (eventId) => {
  try {
    if (!mongoose.isValidObjectId(eventId)) {
      throw new Error("Invalid Event ID format");
    }

    const updatedMatched = await Matched.findOneAndUpdate(
      { "time._id": eventId },
      { $pull: { time: { _id: eventId } } },
      { new: true }
    );

    if (!updatedMatched) {
      throw new Error("Event record not found");
    }

    return updatedMatched;
  } catch (error) {
    console.error("Error deleting time event:", error.message);
    throw new Error(error.message);
  }
};

const getMatchedGroupsCount = async (classId) => {
  // Validate the class ID
  const targetClass = await Class.findById(classId);

  // Lấy tất cả group thuộc classId
  const groupsInClass = await Group.find({ classId }).lean();
  if (!groupsInClass || groupsInClass.length === 0) {
    return {
      classId,
      className: targetClass.className,
      totalGroups: 0,
      matchedGroups: 0,
    };
  }

  const groupIds = groupsInClass.map((group) => group._id);

  // Đếm số lượng nhóm đã matched trong Matched
  const matchedCount = await Matched.countDocuments({
    groupId: { $in: groupIds },
  });

  return {
    classId,
    className: targetClass.className,
    totalGroups: groupsInClass.length,
    matchedGroups: matchedCount,
  };
};

export default {
  createMatched,
  updateMatchedById,
  deleteMatchedById,
  getMatchedInfoByGroupId,
  getAllMatchingDetailByMentorId,
  patchMatchedById,
  createNewTimeEvents,
  patchTimeEventById,
  deleteTimeEventById,
  getMatchedGroupsCount,
};
