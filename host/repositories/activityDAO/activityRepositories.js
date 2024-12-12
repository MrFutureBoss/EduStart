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
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid OutcomeType ID");
    }
    const allowedUpdates = ["name", "description"];
    const updates = Object.keys(updateData);

    const isValidUpdate = updates.every((key) => allowedUpdates.includes(key));
    if (!isValidUpdate) {
      throw new Error("Invalid update fields");
    }
    const updatedOutcomeType = await OutcomeType.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedOutcomeType) {
      throw new Error("OutcomeType not found");
    }
    return updatedOutcomeType;
  } catch (error) {
    console.error(`Error in updateOutcomeTypeById: ${error.message}`);
    throw error;
  }
};
const deleteOutcomeTypeById = async (id) => {
  return await OutcomeType.findByIdAndDelete(id);
};
const getOutcomesBySemesterId = async (semesterId) => {
  try {
    return await OutcomeType.find({ semesterId });
  } catch (error) {
    console.error("Error fetching outcomes by semesterId:", error);
    throw error;
  }
};

const isDuplicateOutcomeNameInSemester = async (name, semesterId) => {
  return await OutcomeType.findOne({ name, semesterId });
};
const findOutcomeByNameAndSemester = async (name, semesterId, excludeId) => {
  const semesterObjectId = mongoose.Types.ObjectId.isValid(semesterId)
    ? new mongoose.Types.ObjectId(semesterId)
    : semesterId;

  const exclusionId = mongoose.Types.ObjectId.isValid(excludeId)
    ? new mongoose.Types.ObjectId(excludeId)
    : excludeId;

  const result = await OutcomeType.findOne({
    name,
    semesterId: semesterObjectId,
    _id: { $ne: exclusionId },
  });

  console.log("Search result:", result);

  return result;
};
const markActivityAsCompleted = async (activityId) => {
  try {
    return await Activity.findByIdAndUpdate(activityId, { completed: true });
  } catch (error) {
    throw new Error("Error updating activity status: " + error.message);
  }
};
const countOutcomesType = async () => {
  try {
    return await OutcomeType.countDocuments();
  } catch (error) {
    console.error("Error counting outcomes:", error);
    throw error;
  }
};
const getActivitiesByClassId = async (classId) => {
  try {
    const activities = await Activity.find({
      classId,
      activityType: "outcome",
    }).lean();
    return activities;
  } catch (error) {
    console.error(`Error fetching activities for class ${classId}:`, error);
    throw new Error("Error fetching activities by class ID.");
  }
};
const getGroupOutcomesByGroupId = async (groupId) => {
  try {
    return await Activity.find({ groupId, activityType: "outcome" }).lean();
  } catch (error) {
    console.error(
      `[GroupOutcomeRepository] Error fetching group outcomes: ${error.message}`
    );
    throw new Error("Failed to fetch group outcomes.");
  }
};

const findUnsubmittedGroups = async (outcomeId, classId) => {
  try {
    if (!outcomeId || !classId) {
      throw new Error("OutcomeId and ClassId are required.");
    }

    const hasOutcomeActivities = await Activity.exists({
      activityType: "outcome",
      outcomeId,
      classId,
    });

    if (!hasOutcomeActivities) {
      return null;
    }

    const groups = await Activity.find({
      completed: false,
      activityType: "outcome",
      outcomeId,
      classId,
    })
      .populate("groupId", "name")
      .populate("classId", "className");

    return groups || [];
  } catch (error) {
    console.error(`Error in findUnsubmittedGroups: ${error.message}`);
    throw error;
  }
};

const findOutcomesByGroupId = async (groupId) => {
  try {
    const activities = await Activity.find({
      groupId: groupId,
      activityType: "outcome",
    })
      .populate("outcomeId", "name description") // Populate outcome details
      .select(
        "description startDate deadline completed outcomeId classId groupId"
      );

    if (!activities || activities.length === 0) return [];

    const currentDate = new Date();

    // Categorize outcomes
    const groupOutcomes = activities.map((activity) => {
      const isUpcoming = activity.startDate > currentDate;
      const isPast = activity.deadline < currentDate;
      const status = activity.completed ? "Completed" : "Incomplete";

      return {
        outcomeId: activity.outcomeId?._id,
        outcomeName: activity.outcomeId?.name || "N/A",
        description: activity.description,
        startDate: activity.startDate,
        deadline: activity.deadline,
        completed: activity.completed,
        status,
        category: isUpcoming ? "Upcoming" : isPast ? "Past" : "Ongoing",
        classId: activity.classId,
        groupId: activity.groupId,
      };
    });

    return groupOutcomes;
  } catch (error) {
    console.error("Error in findOutcomesByGroupId:", error.message);
    throw error;
  }
};

const doesClassHaveOutcome = async (classId, outcomeId, semesterId) => {
  try {
    return await Activity.exists({
      activityType: "outcome",
      classId,
      outcomeId,
      semesterId
    })
  } catch (error) {
    console.error("Error in doesClassHaveOutcome:", error.message);
    throw new Error("Database query failed.");
  }
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
  markActivityAsCompleted,
  countOutcomesType,
  getActivitiesByClassId,
  getOutcomesBySemesterId,
  getGroupOutcomesByGroupId,
  findUnsubmittedGroups,
  findOutcomesByGroupId,
  doesClassHaveOutcome,
};
