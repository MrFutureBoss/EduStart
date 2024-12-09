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

// Hàm để tìm các mentor đã chọn nhóm này (theo groupId)
const findMentorPreferencesByGroupId = async (groupId) => {
  const preferences = await MentorPreference.find({ groupIds: groupId })
    .populate({
      path: "mentorId",
      model: "User",
      select: "username email degree phoneNumber", // Chỉ lấy các trường cần thiết từ User
    })
    .lean();

  // Với mỗi mentor trong danh sách preferences, lấy MentorCategory và bổ sung trường còn thiếu
  const enhancedPreferences = await Promise.all(
    preferences.map(async (preference) => {
      // Kiểm tra chắc chắn preference.mentorId tồn tại
      if (!preference.mentorId || !preference.mentorId._id) {
        return null; // Hoặc bạn có thể xử lý khác nếu mentorId không hợp lệ
      }

      // Đếm số matched documents cho mentor này
      const currentLoad = await Matched.countDocuments({
        mentorId: preference.mentorId._id,
      });

      // Tìm MentorCategory
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
          currentLoad: currentLoad,
          maxLoad: mentorCategory.maxLoad,
          isPreferredGroup: true, // mentor đã chọn nhóm này
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
        // Không có MentorCategory, trả về dữ liệu tối giản
        return {
          mentorId: preference.mentorId._id,
          username: preference.mentorId.username,
          email: preference.mentorId.email,
          degree: preference.mentorId.degree,
          phoneNumber: preference.mentorId.phoneNumber,
          isPreferredGroup: true, // mentor đã chọn nhóm này
          professions: [],
          specialties: [],
        };
      }
    })
  );

  // Lọc bỏ các phần tử null nếu có
  return enhancedPreferences.filter((item) => item !== null);
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
    const projectCategory = await ProjectCategory.findOne({
      projectId: group.projectId,
    }).lean();
    if (!projectCategory) continue;

    const { professionId: professionIds, specialtyIds } = projectCategory;

    // 1. Mentor đã chọn nhóm này
    const preferredMentors = await findMentorPreferencesByGroupId(group._id);

    const structuredPreferredMentors = await Promise.all(
      preferredMentors
        .filter((mentor) => mentor.mentorId) // Loại bỏ mentor không hợp lệ
        .map(async (mentor) => {
          const currentLoad = await Matched.countDocuments({
            mentorId: mentor.mentorId,
          });
          return {
            ...mentor,
            currentLoad,
          };
        })
    ).then(
      (mentors) =>
        mentors.filter((mentor) => mentor.currentLoad < mentor.maxLoad) // Loại bỏ mentor đạt maxLoad
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

        if (currentLoad >= mentorCategory.maxLoad) continue; // Loại bỏ mentor đạt maxLoad

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

    const filteredMatchingMentors = await Promise.all(
      matchingMentors.map(async (mentor) => {
        const currentLoad = await Matched.countDocuments({
          mentorId: mentor.mentorId._id,
        });

        if (currentLoad >= mentor.maxLoad) return null; // Loại bỏ mentor đạt maxLoad

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
    );

    const finalMatchingMentors = filteredMatchingMentors.filter(
      (mentor) =>
        mentor &&
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
  findMentorPreferencesByGroupId,
  findMentorCategoriesByProfessionsAndSpecialties,
  findMentorCategoryByMentorId,
  recommendAndSaveMentorsForClassGroups,
};
