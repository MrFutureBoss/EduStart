import Group from "../../models/groupModel.js";
import TemporaryMatching from "../../models/temporaryMatchingModel.js";
import mongoose from "mongoose";
import MentorCategory from "../../models/mentorCategoryModel.js";
import ProjectCategory from "../../models/ProjectCategoryModel .js";
import MentorPreference from "../../models/mentorPreference.js";
import Matched from "../../models/matchedModel.js";
import Profession from "../../models/professionModel.js";
const getAllTempMatchingByTeacherId = async (
  teacherId,
  { search, skip, limit }
) => {
  try {
    // Get all groups managed by the teacher
    const groups = await Group.find({ "classId.teacherId": teacherId }).select(
      "_id"
    );

    if (!groups || groups.length === 0) {
      throw new Error("Không có nhóm nào cho giáo viên này.");
    }

    const groupIds = groups.map((group) => group._id);

    // Use pipeline to get matching info for all groups
    let pipeline = [
      {
        $match: { groupId: { $in: groupIds } },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "groupInfo",
        },
      },
      {
        $unwind: "$groupInfo",
      },
      // Lookup project info
      {
        $lookup: {
          from: "projects",
          localField: "groupInfo.projectId",
          foreignField: "_id",
          as: "projectInfo",
        },
      },
      {
        $unwind: {
          path: "$projectInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup project category
      {
        $lookup: {
          from: "projectcategories",
          localField: "projectInfo._id",
          foreignField: "projectId",
          as: "projectCategory",
        },
      },
      {
        $unwind: {
          path: "$projectCategory",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup profession info
      {
        $lookup: {
          from: "professions",
          localField: "projectCategory.professionId",
          foreignField: "_id",
          as: "professionInfo",
        },
      },
      {
        $unwind: {
          path: "$professionInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup specialties info
      {
        $lookup: {
          from: "specialties",
          localField: "projectCategory.specialtyIds",
          foreignField: "_id",
          as: "specialtiesInfo",
        },
      },
      // Lookup group members
      {
        $lookup: {
          from: "users",
          localField: "groupInfo.members",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
    ];

    // Add search condition if any
    if (search && search.length > 0) {
      pipeline.push({
        $match: { "groupInfo.name": { $regex: search, $options: "i" } },
      });
    }

    // Execute pagination
    const result = await TemporaryMatching.aggregate(pipeline)
      .skip(skip)
      .limit(limit);

    // Count total results
    const count = await TemporaryMatching.countDocuments({
      groupId: { $in: groupIds },
    });

    return { data: result, total: count };
  } catch (error) {
    throw new Error(error.message);
  }
};

const addTempMatchingByGid = async (gid, selectedMentorIds = []) => {
  try {
    // Xóa các ghép tạm thời trước đó của nhóm
    await TemporaryMatching.deleteMany({ groupId: gid });

    // Lấy thông tin nhóm và dự án
    const group = await Group.findById(gid)
      .populate({
        path: "projectId",
        match: { status: "InProgress" }, // Chỉ lấy project có status "InProgress"
      })
      .populate({
        path: "classId",
        populate: { path: "teacherId" },
      });

    if (!group) {
      throw new Error("Không tìm thấy nhóm");
    }

    if (!group.projectId) {
      // Nếu nhóm không có project hoặc project không có status "InProgress"
      // Không tạo TemporaryMatching cho nhóm này
      return { message: "Nhóm không có dự án đang hoạt động" };
    }

    if (!group.classId) {
      throw new Error("Không tìm thấy classId cho group");
    }

    if (!group.classId.teacherId) {
      throw new Error("Không tìm thấy teacherId cho class");
    }

    // Lấy thông tin ProjectCategory
    const projectCategory = await ProjectCategory.findOne({
      projectId: group.projectId._id,
    })
      .populate("professionId")
      .populate("specialtyIds");

    if (!projectCategory || !projectCategory.professionId) {
      // Nếu không có ProjectCategory hoặc professionId
      // Bỏ qua nhóm này
      return { message: "Nhóm chưa cập nhật lĩnh vực và chuyên ngành dự án" };
    }

    // Lấy danh sách mentor và chuyên môn của họ
    let mentorCategoriesQuery = MentorCategory.find();

    if (selectedMentorIds.length > 0) {
      mentorCategoriesQuery = mentorCategoriesQuery
        .where("mentorId")
        .in(selectedMentorIds);
    }

    const mentorCategories = await mentorCategoriesQuery
      .populate("mentorId")
      .populate("professionId")
      .populate("specialties.specialtyId");

    const mentorMap = {};

    mentorCategories.forEach((mentorCat) => {
      console.log("Mentor Category:", mentorCat); // Thêm dòng này để kiểm tra

      const mentorId = mentorCat.mentorId._id.toString();

      // Bỏ qua mentor đã đạt maxLoad
      if (mentorCat.currentLoad >= mentorCat.maxLoad) {
        return;
      }

      // Kiểm tra mentor có profession trùng với project hay không
      const isProfessionMatched =
        mentorCat.professionId._id.toString() ===
        projectCategory.professionId._id.toString();
      if (!isProfessionMatched) {
        return;
      }

      if (!mentorMap[mentorId]) {
        mentorMap[mentorId] = {
          mentorId: mentorCat.mentorId,
          professions: [
            {
              professionId: mentorCat.professionId._id,
              name: mentorCat.professionId.name,
            },
          ],
          specialties: [],
          maxLoad: mentorCat.maxLoad,
          currentLoad: mentorCat.currentLoad || 0,
        };
      }

      mentorCat.specialties.forEach((spec) => {
        mentorMap[mentorId].specialties.push({
          specialtyId: spec.specialtyId._id.toString(),
          proficiencyLevel: spec.proficiencyLevel,
          name: spec.specialtyId.name,
        });
      });
    });

    const availableMentors = Object.values(mentorMap);

    // Lấy thông tin về sự ưu tiên của mentor
    const mentorPreferences = await MentorPreference.find({
      mentorId: { $in: availableMentors.map((m) => m.mentorId._id) },
    });

    const mentorPreferenceMap = {};
    mentorPreferences.forEach((pref) => {
      mentorPreferenceMap[pref.mentorId.toString()] = pref.groupIds.map((gid) =>
        gid.toString()
      );
    });

    // Tính điểm và sắp xếp mentor
    const potentialMentors = [];

    availableMentors.forEach((mentor) => {
      let score = 0;
      const weightProfession = 5; // Trọng số cho profession
      const weightSpecialty = 2;
      const weightProficiency = 3;
      const weightLoad = 2;
      const weightPreference = 10;

      // Tính điểm cho profession trùng khớp
      score += weightProfession;

      // Kiểm tra trùng khớp chuyên ngành
      const projectSpecialtyIds = projectCategory.specialtyIds.map((s) =>
        s._id.toString()
      );

      let maxProficiencyLevel = 0;
      mentor.specialties.forEach((spec) => {
        if (projectSpecialtyIds.includes(spec.specialtyId)) {
          score += weightSpecialty;
          if (spec.proficiencyLevel > maxProficiencyLevel) {
            maxProficiencyLevel = spec.proficiencyLevel;
          }
        }
      });

      // Thêm điểm mức độ thành thạo cao nhất trong các chuyên ngành trùng khớp
      score += maxProficiencyLevel * weightProficiency;

      // Trừ điểm dựa trên tải hiện tại
      score -= mentor.currentLoad * weightLoad;

      // Kiểm tra mentor có chọn nhóm này không
      const preferredGroups =
        mentorPreferenceMap[mentor.mentorId._id.toString()] || [];
      const isPreferredGroup = preferredGroups.includes(gid) ? 1 : 0;
      score += isPreferredGroup * weightPreference;

      potentialMentors.push({
        mentorId: mentor.mentorId._id,
        username: mentor.mentorId.username,
        email: mentor.mentorId.email,
        degree: mentor.mentorId.degree,
        score: score,
        isPreferredGroup: isPreferredGroup,
        professions: mentor.professions,
        specialties: mentor.specialties,
        currentLoad: mentor.currentLoad, // Add current load
        maxLoad: mentor.maxLoad,
      });
    });

    // Sắp xếp mentor theo điểm số giảm dần
    potentialMentors.sort((a, b) => b.score - a.score);

    // Lưu danh sách mentor tiềm năng vào TemporaryMatching, kể cả khi potentialMentors rỗng
    await TemporaryMatching.create({
      groupId: gid,
      mentorIds: potentialMentors.map((mentor) => ({
        mentorId: mentor.mentorId,
        username: mentor.username,
        email: mentor.email,
        degree: mentor.degree,
        score: mentor.score,
        isPreferredGroup: mentor.isPreferredGroup,
        professions: mentor.professions,
        specialties: mentor.specialties,
        currentLoad: mentor.currentLoad,
        maxLoad: mentor.maxLoad,
      })),
      teacherId: group.classId.teacherId,
      status: "Pending",
    });

    return { message: "Đã tạo danh sách mentor tiềm năng cho nhóm" };
  } catch (error) {
    throw new Error(error.message);
  }
};

// hàm này để lấy thêm cả những mentor khác nếu như mà trong danh sách không có đủ
// temporaryMatchingDAO.js
const getAvailableMentors = async () => {
  try {
    // Lấy danh sách tất cả các mentor
    const mentorCategories = await MentorCategory.find()
      .populate("mentorId")
      .populate("professionId")
      .populate("specialties.specialtyId");

    // Kiểm tra dữ liệu mentorCategories trước khi lọc
    if (!mentorCategories || mentorCategories.length === 0) {
      throw new Error("Không tìm thấy mentor nào.");
    }

    // Lọc các mentor chưa đạt maxLoad
    const availableMentors = mentorCategories.filter((mentorCat) => {
      if (
        !mentorCat ||
        !mentorCat.mentorId ||
        !mentorCat.professionId ||
        typeof mentorCat.currentLoad === "undefined" ||
        typeof mentorCat.maxLoad === "undefined"
      ) {
        console.warn("Mentor Category is missing required fields:", mentorCat);
        return false;
      }

      // Kiểm tra điều kiện lọc
      return mentorCat.currentLoad < mentorCat.maxLoad;
    });

    return availableMentors;
  } catch (error) {
    console.error("Error in getAvailableMentors:", error);
    throw error; // Ném lỗi để Controller có thể bắt và xử lý
  }
};

//  hàm này để lấy danh sách những mentor tiềm năng được lưu khi mà hệ thống đề xuất
const getPotentialMentorsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const tempMatching = await TemporaryMatching.findOne({ groupId })
      .populate({
        path: "mentorIds.mentorId",
        select: "username email",
      })
      .lean();

    if (!tempMatching) {
      return res.status(404).json({ message: "Không tìm thấy ghép tạm thời" });
    }

    res.json(tempMatching.mentorIds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// hàm này để xác nhận lại matching chuyển thành matched
const confirmMatching = async (groupId, mentorId) => {
  try {
    // Kiểm tra mentor có khả dụng không
    const mentorCategory = await MentorCategory.findOne({ mentorId });
    if (
      !mentorCategory ||
      mentorCategory.currentLoad >= mentorCategory.maxLoad
    ) {
      throw new Error("Mentor không khả dụng");
    }

    // Tạo ghép cặp chính thức
    await Matched.create({
      groupId,
      mentorId,
      status: "Active",
    });

    // Cập nhật currentLoad của mentor
    await MentorCategory.updateOne({ mentorId }, { $inc: { currentLoad: 1 } });

    // Xóa ghép tạm thời của nhóm hiện tại
    await TemporaryMatching.deleteOne({ groupId });

    // Loại bỏ mentor khỏi danh sách mentor tiềm năng của các nhóm khác
    const updatedMentorCategory = await MentorCategory.findOne({ mentorId });
    if (updatedMentorCategory.currentLoad >= updatedMentorCategory.maxLoad) {
      // Loại mentor khỏi danh sách các nhóm khác
      await TemporaryMatching.updateMany(
        { groupId: { $ne: groupId } },
        { $pull: { mentorIds: { mentorId: mentorId } } }
      );

      // Xóa các TemporaryMatching trống nếu không còn mentor tiềm năng
      await TemporaryMatching.deleteMany({ "mentorIds.0": { $exists: false } });
    }

    return { message: "Ghép cặp thành công" };
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  getAllTempMatchingByTeacherId,
  addTempMatchingByGid,
  getAvailableMentors,
  getPotentialMentorsByGroupId,
  confirmMatching,
};
