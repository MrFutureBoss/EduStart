import Activity from "../../models/activityModel.js";
import mongoose from "mongoose";
import OutcomeType from "../../models/outcomeTypeModal.js";

const createActivity = async (activities, session) => {
  try {
    return await Activity.insertMany(activities, { session });
  } catch (error) {
    console.error("Error creating activities:", error);
    throw error;
  }
};

const findActivitiesByClassAndTeacher = async (classId, teacherId) => {
  return await Activity.find({ classId, teacherId });
};

const updateActivityById = async (activityId, updatedData) => {
  return await Activity.findByIdAndUpdate(activityId, updatedData, {
    new: true,
  });
};

const deleteActivityById = async (activityId) => {
  return await Activity.findByIdAndDelete(activityId);
};

const findActivityById = async (activityId) => {
  return await Activity.findById(activityId);
};

const findExistingActivity = async (
  classId,
  teacherId,
  activityType,
  options = {}
) => {
  try {
    const query = {
      classId: classId,
      teacherId: teacherId,
      activityType: activityType,
    };

    if (activityType === "material" && options.materialUrl) {
      query.materialUrl = options.materialUrl;
    }

    if (activityType === "assignment" && options.assignmentType) {
      query.assignmentType = options.assignmentType;
    }

    return await Activity.findOne(query);
  } catch (error) {
    throw new Error("Error while fetching existing activity: " + error.message);
  }
};

const updateExistingActivity = async (existingActivity, updateData) => {
  try {
    existingActivity.title = updateData.title;
    existingActivity.description = updateData.description;

    if (updateData.materialUrl) {
      existingActivity.materialUrl = updateData.materialUrl;
    }

    if (updateData.assignmentType) {
      existingActivity.assignmentType = updateData.assignmentType;
    }

    if (updateData.deadline) {
      existingActivity.deadline = updateData.deadline;
    }

    return await existingActivity.save();
  } catch (error) {
    throw new Error("Error while updating activity: " + error.message);
  }
};
const findActivityByMaterialUrl = async (fileName, classId) => {
  const regex = new RegExp(fileName, "i");
  return Activity.findOne({
    materialUrl: { $regex: regex },
    classId,
    activityType: "material",
  });
};

async function findOutcomeByClassIdAndType(classId, assignmentType) {
  return Activity.findOne({ classId, assignmentType });
}
const findActivitiesByTeacher = async (teacherId, activityType = null) => {
  const filter = { teacherId };
  if (activityType) {
    filter.activityType = activityType;
  }

  return Activity.find(filter).populate("classId");
};

const getSuggestedMaterials = async (teacherId, classId) => {
  try {
    return await Activity.find({
      teacherId,
      classId: { $ne: classId },
      activityType: "material",
    });
  } catch (error) {
    throw new Error("Error fetching suggested materials");
  }
};
const findActivityByIdAndType = async (activityId, activityType) => {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new Error("Invalid activityId format");
  }
  return await Activity.findOne({ _id: activityId, activityType });
};

const createOutcomeType = async (outcomeData) => {
  const outcome = new OutcomeType(outcomeData);
  return await outcome.save();
};

const getAllOutcomesType = async (semesterId) => {
  // If semesterId is provided, filter by it; otherwise, return all
  const filter = semesterId ? { semesterId } : {};
  return await OutcomeType.find(filter);
};

const getOutcomeTypeById = async (id) => {
  return await OutcomeType.findById(id);
};
const updateOutcomeTypeById = async (id, updateData) => {
  return await OutcomeType.findByIdAndUpdate(id, updateData, { new: true });
};
const deleteOutcomeTypeById = async (id) => {
  return await OutcomeType.findByIdAndDelete(id);
};
const getOutcomesBySemesterId = async (semesterId) => {
  return await OutcomeType.find({ semesterId });
};
const isDuplicateOutcomeNameInSemester = async (name, semesterId) => {
  return await OutcomeType.findOne({ name, semesterId });
};
const findOutcomeByNameAndSemester = async (name, semesterId, excludeId) => {
  return await OutcomeType.findOne({
    name,
    semesterId,
    _id: { $ne: excludeId },
  });
};

export default {
  createActivity,
  findActivitiesByClassAndTeacher,
  updateActivityById,
  deleteActivityById,
  findActivityById,
  findExistingActivity,
  updateExistingActivity,
  findActivityByMaterialUrl,
  findOutcomeByClassIdAndType,
  findActivitiesByTeacher,
  getSuggestedMaterials,
  findActivityByIdAndType,
  createOutcomeType,
  getAllOutcomesType,
  getOutcomeTypeById,
  updateOutcomeTypeById,
  deleteOutcomeTypeById,
  getOutcomesBySemesterId,
  isDuplicateOutcomeNameInSemester,
  findOutcomeByNameAndSemester,
};
