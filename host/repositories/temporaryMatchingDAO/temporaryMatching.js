import Group from "../../models/groupModel.js";
import MentorPreference from "../../models/mentorPreference.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import TeacherSelection from "../../models/teacherSelection.js";
import TemporaryMatching from "../../models/temporaryMatchingModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import User from "../../models/userModel.js";
import Profession from "../../models/professionModel.js";
import Specialty from "../../models/specialtyModel.js";

// Hàm để tìm các mentor đã chọn nhóm này (theo groupId)
export const findMentorPreferencesByGroupId = async (groupId) => {
  const preferences = await MentorPreference.find({ groupIds: groupId })
    .populate({
      path: "mentorId",
      model: "User",
      select: "username email degree phoneNumber", // Chỉ lấy các trường từ User cần thiết
    })
    .lean();

  // Với mỗi mentor trong danh sách preferences, lấy MentorCategory và bổ sung các trường còn thiếu
  const enhancedPreferences = await Promise.all(
    preferences.map(async (preference) => {
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
        return {
          mentorId: preference.mentorId._id,
          username: preference.mentorId.username,
          email: preference.mentorId.email,
          degree: preference.mentorId.degree,
          phoneNumber: preference.mentorId.phoneNumber,
          currentLoad: mentorCategory.currentLoad,
          maxLoad: mentorCategory.maxLoad,
          isPreferredGroup: true, // Gán `isPreferredGroup` là true vì mentor đã chọn nhóm này
          professions: (mentorCategory.professionIds || []).map(
            (profession) => ({
              professionId: profession._id,
              name: profession.name,
            })
          ),
          specialties: (mentorCategory.specialties || []).map((specialty) => ({
            specialtyId: specialty.specialtyId._id,
            name: specialty.specialtyId.name,
            proficiencyLevel: specialty.proficiencyLevel,
          })),
        };
      } else {
        return {
          mentorId: preference.mentorId._id,
          username: preference.mentorId.username,
          email: preference.mentorId.email,
          degree: preference.mentorId.degree,
          phoneNumber: preference.mentorId.phoneNumber,
          isPreferredGroup: true, // Gán `isPreferredGroup` là true vì mentor đã chọn nhóm này
          professions: [],
          specialties: [],
        };
      }
    })
  );

  return enhancedPreferences;
};

// Hàm để tìm các mentor được giáo viên ưu tiên (theo teacherId, professionId và specialtyIds)
export const findPreferredMentorsByTeacher = async (
  teacherId,
  professionId,
  specialtyIds
) => {
  return await TeacherSelection.findOne({
    teacherId,
    professionId,
    specialtyId: { $in: specialtyIds },
  })
    .populate("selectedMentors.mentorId", "username email degree phoneNumber") // Chỉ populate các trường cần thiết
    .lean();
};

// Hàm để tìm các mentor trùng profession và specialty và lấy đầy đủ thông tin
export const findMentorCategoriesByProfessionsAndSpecialties = async (
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
      select: "username email degree phoneNumber",
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
export const findMentorCategoryByMentorId = async (mentorId) => {
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
    const projectCategory = await ProjectCategory.findOne({
      projectId: group.projectId,
    }).lean();
    if (!projectCategory) continue;

    const { professionId: professionIds, specialtyIds } = projectCategory;

    // 1. Mentor đã chọn nhóm này
    const preferredMentors = await findMentorPreferencesByGroupId(group._id);

    // Kiểm tra nếu dữ liệu preferredMentors đã bao gồm isPreferredGroup
    const structuredPreferredMentors = preferredMentors.map((mentor) => ({
      mentorId: mentor.mentorId,
      username: mentor.username,
      email: mentor.email,
      degree: mentor.degree,
      phoneNumber: mentor.phoneNumber,
      currentLoad: mentor.currentLoad,
      maxLoad: mentor.maxLoad,
      isPreferredGroup: mentor.isPreferredGroup || false,
      professions: mentor.professions || [],
      specialties: mentor.specialties || [],
    }));

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

        const specialties = mentorCategory.specialties.map((specialty) => ({
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
          currentLoad: mentorCategory.currentLoad,
          maxLoad: mentorCategory.maxLoad,
          specialties,
        });
      }
    }

    // 3. Mentor trùng profession và specialty nhưng không có ưu tiên đặc biệt
    const matchingMentors =
      await findMentorCategoriesByProfessionsAndSpecialties(
        professionIds,
        specialtyIds
      );

    const filteredMatchingMentors = matchingMentors
      .filter((mentor) => mentor.mentorId)
      .map((mentor) => {
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

        const specialties = mentor.specialties.map((specialty) => ({
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
          specialties,
          username: mentor.mentorId.username,
          email: mentor.mentorId.email,
          degree: mentor.mentorId.degree,
          phoneNumber: mentor.mentorId.phoneNumber,
          currentLoad: mentor.currentLoad,
          maxLoad: mentor.maxLoad,
        };
      });

    const finalMatchingMentors = filteredMatchingMentors.filter(
      (mentor) =>
        !structuredPreferredMentors.some(
          (pref) => pref.mentorId.toString() === mentor.mentorId.toString()
        ) &&
        !teacherPreferredMentors.some(
          (tp) => tp.mentorId.toString() === mentor.mentorId.toString()
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

    const savedRecommendation = await TemporaryMatching.findOneAndUpdate(
      { groupId: group._id },
      mentorSuggestions,
      { upsert: true, new: true }
    );
    recommendations.push(savedRecommendation);
  }

  return recommendations;
};

export default {
  recommendAndSaveMentorsForClassGroups,
};
