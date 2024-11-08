import Activity from "../../models/activityModel.js";
import Assignment from "../../models/assignmentModel.js";
import mongoose from "mongoose";

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

const findSubmissionsByAssignmentId = async (assignmentId) => {
  return await Assignment.find({ assignmentId });
};

const createSubmission = async (submissionData) => {
  const submission = new Assignment(submissionData);
  return await submission.save();
};

const findSubmittedGroups = async (assignmentId) => {
  const submissions = await Assignment.find({ assignmentId });
  return submissions.map((submission) => submission.groupId.toString());
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
export default {
  createActivity,
  findActivitiesByClassAndTeacher,
  updateActivityById,
  deleteActivityById,
  findActivityById,
  findSubmissionsByAssignmentId,
  createSubmission,
  findSubmittedGroups,
  findExistingActivity,
  updateExistingActivity,
  findActivityByMaterialUrl,
  findOutcomeByClassIdAndType,
  findActivitiesByTeacher,
  getSuggestedMaterials,
  findActivityByIdAndType,
};
