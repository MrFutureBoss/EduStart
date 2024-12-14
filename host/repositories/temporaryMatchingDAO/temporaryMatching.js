import Group from "../../models/groupModel.js";
import MentorPreference from "../../models/mentorPreference.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import TeacherSelection from "../../models/teacherSelection.js";
import TemporaryMatching from "../../models/temporaryMatchingModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import User from "../../models/userModel.js";
import Profession from "../../models/professionModel.js";
import Specialty from "../../models/specialtyModel.js";
import Matched from "../../models/matchedModel.js";
import mongoose from "mongoose";
import Project from "../../models/projectModel.js";

// Hàm để tìm các mentor đã chọn nhóm này (theo groupId)
const findMentorPreferencesByGroupId = async (
  projectId,
  professionIds,
  specialtyIds
) => {
  const preferences = await MentorPreference.find({ projectIds: projectId })
    .populate({
      path: "mentorId",
      model: "User",
      select: "username email degree phoneNumber avatarUrl", // Only fetch required fields
    })
    .lean();

  // Debugging: Log fetched preferences

  // Enhance preferences with MentorCategory and current load
  const enhancedPreferences = await Promise.all(
    preferences.map(async (preference) => {
      // Validate mentorId existence
      if (!preference.mentorId || !preference.mentorId._id) {
        return null; // Skip invalid mentor
      }

      // Fetch current load for the mentor
      const currentLoad = await Matched.countDocuments({
        mentorId: preference.mentorId._id,
      });

      // Fetch MentorCategory for the mentor
      const mentorCategory = await MentorCategory.findOne({
        mentorId: preference.mentorId._id,
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
        })
        .lean();

      if (mentorCategory) {
        // Match professions
        const matchedProfessions = (mentorCategory.professionIds || [])
          .filter((profession) =>
            professionIds
              .map((id) => id.toString())
              .includes(profession._id.toString())
          )
          .map((profession) => ({
            professionId: profession._id,
            name: profession.name,
          }));

        // Match specialties
        const matchedSpecialties = (mentorCategory.specialties || [])
          .filter((specialty) =>
            specialtyIds
              .map((id) => id.toString())
              .includes(specialty.specialtyId._id.toString())
          )
          .map((specialty) => ({
            specialtyId: specialty.specialtyId._id,
            name: specialty.specialtyId.name,
            proficiencyLevel: specialty.proficiencyLevel,
          }));

        return {
          mentorId: preference.mentorId._id,
          username: preference.mentorId.username,
          email: preference.mentorId.email,
          degree: preference.mentorId.degree,
          phoneNumber: preference.mentorId.phoneNumber,
          currentLoad,
          maxLoad: mentorCategory.maxLoad,
          isPreferredGroup: true, // Mentor preferred this project
          matchedProfessions,
          matchedSpecialties,
        };
      } else {
        console.warn(
          "No MentorCategory for MentorId:",
          preference.mentorId._id
        );
        return {
          mentorId: preference.mentorId._id,
          username: preference.mentorId.username,
          email: preference.mentorId.email,
          degree: preference.mentorId.degree,
          phoneNumber: preference.mentorId.phoneNumber,
          isPreferredGroup: true, // Mentor preferred this project
          matchedProfessions: [],
          matchedSpecialties: [],
        };
      }
    })
  );

  // Filter out null values
  const validPreferences = enhancedPreferences.filter((item) => item !== null);
  return validPreferences;
};

// Hàm để tìm các mentor được giáo viên ưu tiên (theo teacherId, professionId và specialtyIds)
const findPreferredMentorsByTeacher = async (
  teacherId,
  professionId,
  specialtyIds
) => {
  return await TeacherSelection.findOne({
    teacherId,
    professionId,
    specialtyId: { $in: specialtyIds },
  })
    .populate(
      "selectedMentors.mentorId",
      "username email degree phoneNumber avatarUrl"
    ) // Chỉ populate các trường cần thiết
    .lean();
};

// Hàm để tìm các mentor trùng profession và specialty và lấy đầy đủ thông tin
const findMentorCategoriesByProfessionsAndSpecialties = async (
  professionIds,
  specialtyIds
) => {
  const mentors = await MentorCategory.find({
    professionIds: { $in: professionIds },
    "specialties.specialtyId": { $in: specialtyIds },
  })
    .populate({
      path: "mentorId",
      model: User,
      select: "username email degree phoneNumber avatarUrl",
    })
    .populate({
      path: "professionIds",
      model: Profession,
      select: "name",
    })
    .populate({
      path: "specialties.specialtyId",
      model: "Specialty",
      select: "name",
    })
    .lean();

  return mentors;
};

// Hàm để lấy MentorCategory cho một mentor cụ thể
const findMentorCategoryByMentorId = async (mentorId) => {
  return await MentorCategory.findOne({ mentorId })
    .populate({
      path: "professionIds",
      model: Profession,
      select: "name",
    })
    .populate({
      path: "specialties.specialtyId",
      model: Specialty,
      select: "name",
    })
    .lean();
};

// Hàm chính để tạo gợi ý mentor cho tất cả nhóm trong lớp
const recommendAndSaveMentorsForClassGroups = async (classId, teacherId) => {
  const groups = await Group.find({ classId }).lean();
  if (!groups.length) throw new Error("Không có nhóm nào trong lớp này");

  const recommendations = [];

  for (const group of groups) {
    // Check if the group's groupId is already matched
    const isMatched = await Matched.exists({ groupId: group._id });
    if (isMatched) continue;

    // Fetch the project's details
    const project = await Project.findById(group.projectId).lean();
    if (!project || project.status !== "InProgress") continue;

    const projectCategory = await ProjectCategory.findOne({
      projectId: group.projectId,
    }).lean();
    if (!projectCategory) continue;

    const { professionId: professionIds, specialtyIds } = projectCategory;

    // 1. Mentor đã chọn nhóm này
    const preferredMentors = await findMentorPreferencesByGroupId(
      group.projectId,
      professionIds,
      specialtyIds
    );

    const structuredPreferredMentors = await Promise.all(
      preferredMentors
        .filter((mentor) => mentor.mentorId)
        .map(async (mentor) => {
          const currentLoad = await Matched.countDocuments({
            mentorId: mentor.mentorId,
          });
          return {
            ...mentor,
            currentLoad,
          };
        })
    ).then((mentors) =>
      mentors.filter((mentor) => mentor.currentLoad < mentor.maxLoad)
    );

    // 2. Mentor được giáo viên ưu tiên trong lĩnh vực
    const teacherPreferredMentorsRaw = await findPreferredMentorsByTeacher(
      teacherId,
      professionIds[0],
      specialtyIds
    );

    const teacherPreferredMentors = [];
    if (
      teacherPreferredMentorsRaw &&
      teacherPreferredMentorsRaw.selectedMentors
    ) {
      for (const preferredMentorData of teacherPreferredMentorsRaw.selectedMentors) {
        const mentorCategory = await findMentorCategoryByMentorId(
          preferredMentorData.mentorId
        );

        if (!mentorCategory) continue;

        const currentLoad = await Matched.countDocuments({
          mentorId: preferredMentorData.mentorId,
        });

        if (currentLoad >= mentorCategory.maxLoad) continue;

        const matchedProfessions = (mentorCategory.professionIds || [])
          .filter((profession) =>
            professionIds
              .map((id) => id.toString())
              .includes(profession._id.toString())
          )
          .map((profession) => ({
            professionId: profession._id,
            name: profession.name,
          }));

        const matchedSpecialties = (mentorCategory.specialties || [])
          .filter((specialty) =>
            specialtyIds
              .map((id) => id.toString())
              .includes(specialty.specialtyId._id.toString())
          )
          .map((specialty) => ({
            specialtyId: specialty.specialtyId._id,
            name: specialty.specialtyId.name,
            proficiencyLevel: specialty.proficiencyLevel,
          }));

        teacherPreferredMentors.push({
          mentorId: preferredMentorData.mentorId,
          priority: preferredMentorData.priority,
          matchedSpecialties,
          matchCount: matchedSpecialties.length,
          professions: matchedProfessions,
          username: preferredMentorData.mentorId.username,
          email: preferredMentorData.mentorId.email,
          degree: preferredMentorData.mentorId.degree,
          phoneNumber: preferredMentorData.mentorId.phoneNumber,
          currentLoad,
          maxLoad: mentorCategory.maxLoad,
        });
      }
    }

    // 3. Mentor trùng profession và specialty nhưng không có ưu tiên đặc biệt
    const matchingMentors =
      await findMentorCategoriesByProfessionsAndSpecialties(
        professionIds,
        specialtyIds
      );

    const finalMatchingMentors = await Promise.all(
      matchingMentors.map(async (mentor) => {
        const currentLoad = await Matched.countDocuments({
          mentorId: mentor.mentorId._id,
        });

        if (currentLoad >= mentor.maxLoad) return null;

        const matchedSpecialties = (mentor.specialties || [])
          .filter((specialty) =>
            specialtyIds
              .map((id) => id.toString())
              .includes(specialty.specialtyId._id.toString())
          )
          .map((specialty) => ({
            specialtyId: specialty.specialtyId._id,
            name: specialty.specialtyId.name,
            proficiencyLevel: specialty.proficiencyLevel,
          }));

        const matchedProfessions = (mentor.professionIds || [])
          .filter((profession) =>
            professionIds
              .map((id) => id.toString())
              .includes(profession._id.toString())
          )
          .map((profession) => ({
            professionId: profession._id,
            name: profession.name,
          }));

        return {
          mentorId: mentor.mentorId._id,
          matchedSpecialties,
          matchCount: matchedSpecialties.length,
          professions: matchedProfessions,
          username: mentor.mentorId.username,
          email: mentor.mentorId.email,
          degree: mentor.mentorId.degree,
          phoneNumber: mentor.mentorId.phoneNumber,
          currentLoad,
          maxLoad: mentor.maxLoad,
        };
      })
    ).then((mentors) =>
      mentors.filter(
        (mentor) =>
          mentor &&
          !structuredPreferredMentors.some(
            (pref) => pref.mentorId.toString() === mentor.mentorId.toString()
          ) &&
          !teacherPreferredMentors.some(
            (tp) => tp.mentorId.toString() === mentor.mentorId.toString()
          )
      )
    );

    const mentorSuggestions = {
      groupId: group._id,
      teacherId,
      mentorPreferred: structuredPreferredMentors,
      teacherPreferredMentors,
      matchingMentors: finalMatchingMentors,
      status: "Pending",
    };
    recommendations.push(mentorSuggestions);

    await TemporaryMatching.findOneAndUpdate(
      { groupId: group._id },
      mentorSuggestions,
      { upsert: true, new: true }
    );
  }

  return recommendations;
};

const getSuggestionsByClassId = async (classId) => {
  try {
    // Lấy tất cả các nhóm thuộc classId
    const groups = await Group.find({ classId }).select("_id").lean();
    if (!groups || groups.length === 0) {
      throw new Error("Không tìm thấy nhóm nào trong lớp này.");
    }

    const groupIds = groups.map((group) => group._id);

    // Lấy tất cả các TemporaryMatching liên quan đến các nhóm này
    const suggestions = await TemporaryMatching.find({
      groupId: { $in: groupIds },
    })
      .populate({
        path: "groupId",
        select: "name description status",
      })
      .populate({
        path: "teacherId",
        select: "username email",
      })
      .lean();

    if (!suggestions || suggestions.length === 0) {
      return { message: "Không có gợi ý nào trong lớp này.", suggestions: [] };
    }

    // Cập nhật currentLoad cho từng mentor
    const updatedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        // Cập nhật từng loại gợi ý
        const mentorPreferred = await Promise.all(
          (suggestion.mentorPreferred || []).map(async (mentor) => {
            const currentLoad = await Matched.countDocuments({
              mentorId: mentor.mentorId,
            });
            // Ensure isPreferredGroup is set to true
            return {
              ...mentor,
              currentLoad,
              isPreferredGroup: true, // Explicitly set isPreferredGroup to true
            };
          })
        );

        const teacherPreferredMentors = await Promise.all(
          (suggestion.teacherPreferredMentors || []).map(async (mentor) => {
            const currentLoad = await Matched.countDocuments({
              mentorId: mentor.mentorId,
            });
            return {
              ...mentor,
              currentLoad,
            };
          })
        );

        const matchingMentors = await Promise.all(
          (suggestion.matchingMentors || []).map(async (mentor) => {
            const currentLoad = await Matched.countDocuments({
              mentorId: mentor.mentorId,
            });
            return {
              ...mentor,
              currentLoad,
            };
          })
        );

        // Trả về suggestion với danh sách mentor được cập nhật
        return {
          ...suggestion,
          mentorPreferred,
          teacherPreferredMentors,
          matchingMentors,
        };
      })
    );

    return {
      message: "Danh sách gợi ý được lấy thành công.",
      suggestions: updatedSuggestions,
    };
  } catch (error) {
    console.error("Lỗi khi lấy gợi ý của các lớp:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi lấy gợi ý.");
  }
};

const recommendAndSaveMentorsForSingleGroup = async (groupId, teacherId) => {
  const group = await Group.findById(groupId).lean();
  if (!group) throw new Error("Không tìm thấy nhóm này");

  // Check if the group's groupId is already matched
  const isMatched = await Matched.exists({ groupId: group._id });
  if (isMatched) throw new Error("Nhóm này đã được ghép mentor");

  // Fetch the project's details
  const project = await Project.findById(group.projectId).lean();
  if (!project || project.status !== "InProgress") {
    throw new Error(
      "Dự án của nhóm này không hợp lệ hoặc chưa ở trạng thái InProgress"
    );
  }

  const projectCategory = await ProjectCategory.findOne({
    projectId: group.projectId,
  }).lean();
  if (!projectCategory) {
    throw new Error("Không tìm thấy danh mục dự án cho nhóm này");
  }

  const { professionId: professionIds, specialtyIds } = projectCategory;

  // 1. Mentor đã chọn nhóm này
  const preferredMentors = await findMentorPreferencesByGroupId(
    group.projectId,
    professionIds,
    specialtyIds
  );

  const structuredPreferredMentors = await Promise.all(
    preferredMentors
      .filter((mentor) => mentor.mentorId) // Loại bỏ các mentor không hợp lệ
      .map(async (mentor) => {
        const currentLoad = await Matched.countDocuments({
          mentorId: mentor.mentorId,
        });
        return {
          ...mentor,
          currentLoad,
          maxLoad: mentor.maxLoad,
        };
      })
  ).then(
    (mentors) => mentors.filter((mentor) => mentor.currentLoad < mentor.maxLoad) // Loại bỏ mentor đã đạt maxLoad
  );

  // 2. Mentor được giáo viên ưu tiên trong lĩnh vực
  const teacherPreferredMentorsRaw = await findPreferredMentorsByTeacher(
    teacherId,
    professionIds[0],
    specialtyIds
  );

  const teacherPreferredMentors = [];
  if (
    teacherPreferredMentorsRaw &&
    teacherPreferredMentorsRaw.selectedMentors
  ) {
    for (const preferredMentorData of teacherPreferredMentorsRaw.selectedMentors) {
      const mentorCategory = await findMentorCategoryByMentorId(
        preferredMentorData.mentorId
      );

      if (!mentorCategory) continue;

      const currentLoad = await Matched.countDocuments({
        mentorId: preferredMentorData.mentorId,
      });
      if (currentLoad >= mentorCategory.maxLoad) continue;
      const matchedProfessions = (mentorCategory.professionIds || [])
        .filter((profession) =>
          professionIds
            .map((id) => id.toString())
            .includes(profession._id.toString())
        )
        .map((profession) => ({
          professionId: profession._id,
          name: profession.name,
        }));

      const matchedSpecialties = (mentorCategory.specialties || [])
        .filter((specialty) =>
          specialtyIds
            .map((id) => id.toString())
            .includes(specialty.specialtyId._id.toString())
        )
        .map((specialty) => ({
          specialtyId: specialty.specialtyId._id,
          name: specialty.specialtyId.name,
          proficiencyLevel: specialty.proficiencyLevel,
        }));

      teacherPreferredMentors.push({
        mentorId: preferredMentorData.mentorId,
        priority: preferredMentorData.priority,
        matchedSpecialties,
        matchCount: matchedSpecialties.length,
        professions: matchedProfessions,
        username: preferredMentorData.mentorId.username,
        email: preferredMentorData.mentorId.email,
        degree: preferredMentorData.mentorId.degree,
        phoneNumber: preferredMentorData.mentorId.phoneNumber,
        currentLoad,
        maxLoad: mentorCategory.maxLoad, // Giữ lại maxLoad
      });
    }
  }

  // 3. Mentor trùng profession và specialty nhưng không có ưu tiên đặc biệt
  const matchingMentors = await Promise.all(
    (
      await findMentorCategoriesByProfessionsAndSpecialties(
        professionIds,
        specialtyIds
      )
    ).map(async (mentor) => {
      const currentLoad = await Matched.countDocuments({
        mentorId: mentor.mentorId._id,
      });
      if (currentLoad >= mentor.maxLoad) return null;
      const matchedSpecialties = (mentor.specialties || [])
        .filter((specialty) =>
          specialtyIds
            .map((id) => id.toString())
            .includes(specialty.specialtyId._id.toString())
        )
        .map((specialty) => ({
          specialtyId: specialty.specialtyId._id,
          name: specialty.specialtyId.name,
          proficiencyLevel: specialty.proficiencyLevel,
        }));

      const matchedProfessions = (mentor.professionIds || [])
        .filter((profession) =>
          professionIds
            .map((id) => id.toString())
            .includes(profession._id.toString())
        )
        .map((profession) => ({
          professionId: profession._id,
          name: profession.name,
        }));

      return {
        mentorId: mentor.mentorId._id,
        matchedSpecialties,
        matchCount: matchedSpecialties.length,
        professions: matchedProfessions,
        username: mentor.mentorId.username,
        email: mentor.mentorId.email,
        degree: mentor.mentorId.degree,
        phoneNumber: mentor.mentorId.phoneNumber,
        currentLoad,
        maxLoad: mentor.maxLoad, // Giữ lại maxLoad
      };
    })
  );

  const mentorSuggestions = {
    groupId: group._id,
    teacherId,
    mentorPreferred: structuredPreferredMentors,
    teacherPreferredMentors,
    matchingMentors,
    status: "Pending",
  };

  // Lưu dữ liệu vào TemporaryMatching mà không thay đổi cấu trúc
  await TemporaryMatching.findOneAndUpdate(
    { groupId: group._id },
    mentorSuggestions,
    { upsert: true, new: true }
  );

  return mentorSuggestions;
};

export default {
  findMentorPreferencesByGroupId,
  findMentorCategoriesByProfessionsAndSpecialties,
  findMentorCategoryByMentorId,
  recommendAndSaveMentorsForClassGroups,
  getSuggestionsByClassId,
  findPreferredMentorsByTeacher,
  recommendAndSaveMentorsForSingleGroup,
};
