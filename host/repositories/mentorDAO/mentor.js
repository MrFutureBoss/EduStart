import Group from "../../models/groupModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Profession from "../../models/professionModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Specialty from "../../models/specialtyModel.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;
import User from "../../models/userModel.js";
import TeacherSelection from "../../models/teacherSelection.js";
import MentorPreference from "../../models/mentorPreference.js";
import Project from "../../models/projectModel.js";
import Matched from "../../models/matchedModel.js";

// Hàm lấy các dự án phù hợp cho mentor dựa trên profession và specialty
const getMatchingProjectsForMentor = async (mentorId) => {
  try {
    // Fetch mentor information from MentorCategory
    const mentorCategory = await MentorCategory.findOne({ mentorId })
      .populate("professionIds")
      .populate("specialties.specialtyId");

    if (!mentorCategory) return { projects: [] };

    const mentorProfessionIds = mentorCategory.professionIds.map(
      (prof) => prof._id
    );
    const mentorSpecialtyIds = mentorCategory.specialties.map(
      (spec) => spec.specialtyId
    );

    // Get matching projects based on profession and specialty
    const matchingProjects = await ProjectCategory.find({
      professionId: { $in: mentorProfessionIds },
      specialtyIds: { $in: mentorSpecialtyIds },
    })
      .populate({
        path: "projectId",
        match: { status: "InProgress" },
      })
      .populate("professionId specialtyIds");

    // Filter valid projects and exclude those already matched
    const projects = await Promise.all(
      matchingProjects
        .filter((pc) => pc.projectId) // Ensure project exists
        .map(async (projectCategory) => {
          const project = await Project.findById(
            projectCategory.projectId._id
          ).lean();

          // Find the group associated with the project
          const group = await Group.findOne({ projectId: project._id }).lean();

          // Check if the group is already in Matched
          const isMatched = group
            ? await Matched.exists({ groupId: group._id })
            : false;

          if (isMatched) {
            // Skip this project if it is already matched
            return null;
          }

          const professionDetails = await Profession.find({
            _id: { $in: projectCategory.professionId },
          })
            .select("_id name")
            .lean();

          const specialtyDetails = await Specialty.find({
            _id: { $in: projectCategory.specialtyIds },
          })
            .select("_id name")
            .lean();

          const mentorPreference = await MentorPreference.findOne({
            mentorId,
          }).lean();
          const isPreference = mentorPreference?.projectIds?.some(
            (projectId) => projectId.toString() === project._id.toString()
          );

          return {
            ...project,
            projectCategory: {
              _id: projectCategory._id,
              projectId: projectCategory.projectId._id,
              professionId: professionDetails,
              specialtyIds: specialtyDetails,
            },
            isPreference, // Indicates if the project is preferred by the mentor
          };
        })
    );

    // Remove null values from projects (i.e., those already matched)
    const filteredProjects = projects.filter((project) => project !== null);

    return { projects: filteredProjects };
  } catch (error) {
    throw new Error("Error while fetching matching projects: " + error.message);
  }
};

// Hàm lưu các dự án yêu thích của mentor vào MentorPreference
const saveMentorPreferences = async (mentorId, projectIds) => {
  try {
    const projectIdsArray = Array.isArray(projectIds)
      ? projectIds
      : [projectIds];

    const objectIds = projectIdsArray.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    let mentorPreference = await MentorPreference.findOne({ mentorId });

    if (!mentorPreference) {
      mentorPreference = new MentorPreference({
        mentorId,
        projectIds: objectIds,
      });
    } else {
      mentorPreference.projectIds = [
        ...new Set([...mentorPreference.projectIds, ...objectIds]),
      ];
    }

    await mentorPreference.save();
  } catch (error) {
    console.error(error);
    throw new Error("Lỗi khi lưu dự án yêu thích: " + error.message);
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
  const professions = await Profession.find({ status: true })
    .populate("specialty", "_id name status")
    .lean();

  // Lấy danh sách specialtyId đã cập nhật
  const teacherSelections = await TeacherSelection.find({
    teacherId,
  }).lean();
  const updatedSpecialtyIds = new Set(
    teacherSelections.map((selection) => selection.specialtyId.toString())
  );

  // Lấy danh sách specialtyId có mentor chọn
  const mentorCategories = await MentorCategory.find().lean();
  const mentorSpecialtyIds = new Set(
    mentorCategories.flatMap((category) =>
      category.specialties.map((specialty) => specialty.specialtyId.toString())
    )
  );

  // Xây dựng treeData với thông tin isUpdated, lọc các specialty không có mentor chọn
  const treeData = professions.map((profession) => {
    const specialties = (profession.specialty || [])
      .filter((specialty) => mentorSpecialtyIds.has(specialty._id.toString()))
      .map((specialty) => {
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
  // Lấy danh sách mentors dựa trên professionId và specialtyId
  const mentors = await MentorCategory.find({
    professionIds: professionId,
    "specialties.specialtyId": specialtyId,
  })
    .populate({
      path: "mentorId",
      select: "username email phoneNumber",
    })
    .lean();

  if (!mentors || mentors.length === 0) {
    return [];
  }

  // Lấy danh sách mentorId từ kết quả tìm kiếm
  const mentorIds = mentors.map((mentor) => mentor.mentorId._id);

  // Lấy currentLoad của mỗi mentor bằng cách đếm số lần xuất hiện trong bảng Matched
  const matchedCounts = await Matched.aggregate([
    {
      $match: {
        mentorId: { $in: mentorIds }, // Directly match mentorId field
      },
    },
    {
      $group: {
        _id: "$mentorId",
        count: { $sum: 1 }, // Count occurrences
      },
    },
  ]);

  // Tạo một map từ mentorId đến số lượng matched
  const matchedCountMap = matchedCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  // Gắn currentLoad vào mỗi mentor
  const mentorsWithCurrentLoad = mentors.map((mentor) => {
    return {
      ...mentor,
      currentLoad: matchedCountMap[mentor.mentorId._id.toString()] || 0, // Default to 0 if not found
    };
  });

  return mentorsWithCurrentLoad;
};

const getMentorCategoryByUserId = async (userId) => {
  try {
    return await MentorCategory.findOne({ mentorId: new ObjectId(userId) })
      .populate("mentorId", "username email")
      .populate("professionIds")
      .populate("specialties.specialtyId");
  } catch (error) {
    throw new Error(
      `Unable to find mentor category with userId ${userId}: ${error.message}`
    );
  }
};

const removeMentorPreference = async (mentorId, projectIds) => {
  try {
    const projectIdsArray = Array.isArray(projectIds)
      ? projectIds
      : [projectIds];

    const objectIds = projectIdsArray.map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    let mentorPreference = await MentorPreference.findOne({ mentorId });
    mentorPreference.projectIds = mentorPreference.projectIds.filter(
      (existingProjectId) =>
        !objectIds.some((id) => id.toString() === existingProjectId.toString())
    );

    await mentorPreference.save();
  } catch (error) {
    console.error(error);
    throw new Error("Lỗi khi xóa lựa chọn dự án: " + error.message);
  }
};

const getMentorDetailsById = async (mentorId) => {
  try {
    // Tìm mentor trong User
    const mentor = await User.findOne({ _id: mentorId, role: 3 }).select(
      "username phoneNumber email"
    );

    if (!mentor) {
      throw new Error("Không tìm thấy mentor với ID này");
    }

    // Lấy thông tin từ MentorCategory
    const mentorCategory = await MentorCategory.findOne({ mentorId })
      .populate({
        path: "professionIds",
        model: "Profession",
        select: "name specialty",
      })
      .populate({
        path: "specialties.specialtyId",
        model: "Specialty",
        select: "name",
      });

    if (!mentorCategory) {
      return {
        ...mentor.toObject(),
        maxLoad: 0,
        currentLoad: 0,
        professions: [],
        specialties: [],
      };
    }

    const { maxLoad, currentLoad, professionIds, specialties } = mentorCategory;

    // Tạo map giữa specialtyId và professionName
    const specialtyToProfessionMap = {};

    for (const profession of professionIds) {
      if (Array.isArray(profession.specialty)) {
        for (const specialtyId of profession.specialty) {
          specialtyToProfessionMap[specialtyId.toString()] = profession.name;
        }
      }
    }

    // Gắn professionName vào mỗi specialty
    const specialtiesWithProfession = specialties.map((specialty) => ({
      profession:
        specialtyToProfessionMap[specialty.specialtyId?._id.toString()] ||
        "N/A",
      name: specialty.specialtyId?.name || "N/A",
    }));

    return {
      ...mentor.toObject(),
      maxLoad,
      currentLoad,
      professions: professionIds.map((p) => p.name),
      specialties: specialtiesWithProfession,
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết mentor: ${error.message}`);
  }
};

const updateMentorData = async (mentorId, updateData) => {
  try {
    const { maxLoad, professions, specialties } = updateData;

    const updatedMentorCategory = await MentorCategory.findOneAndUpdate(
      { mentorId },
      {
        maxLoad,
        professionIds: professions,
        specialties: specialties.map((spec) => ({
          specialtyId: spec.specialtyId,
        })),
      },
      { new: true, upsert: true }
    );

    return updatedMentorCategory;
  } catch (error) {
    throw new Error(`Lỗi cập nhật mentor: ${error.message}`);
  }
};

const checkMentorInfoStatus = async (mentorId) => {
  try {
    const mentorCategory = await MentorCategory.findOne({ mentorId });

    if (!mentorCategory) {
      return { hasUpdated: false, message: "Chưa có thông tin cập nhật" };
    }

    const hasProfessions =
      mentorCategory.professionIds && mentorCategory.professionIds.length > 0;
    const hasSpecialties =
      mentorCategory.specialties && mentorCategory.specialties.length > 0;
    const hasMaxLoad = mentorCategory.maxLoad;

    if (hasProfessions && hasSpecialties) {
      return {
        hasUpdated: true,
        message: "Người dùng đã cập nhật đầy đủ thông tin",
      };
    } else if (!hasProfessions && !hasSpecialties) {
      return {
        hasUpdated: false,
        message: "Chưa cập nhật profession và specialty",
      };
    } else if (!hasMaxLoad) {
      return {
        hasUpdated: false,
        message: "Chưa cập nhật số nhóm đăng ký",
      };
    }
  } catch (error) {
    throw new Error(`Lỗi kiểm tra trạng thái thông tin: ${error.message}`);
  }
};
export default {
  getAllMentorCategories,
  getMentorCategoryById,
  createNewMentorCategory,
  getMentorsBySpecialty,
  fetchTreeData,
  getMentorCategoryByUserId,
  getMatchingProjectsForMentor,
  saveMentorPreferences,
  removeMentorPreference,
  getMentorDetailsById,
  updateMentorData,
  checkMentorInfoStatus,
};
