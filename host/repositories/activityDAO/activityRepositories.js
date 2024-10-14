import Activity from "../../models/activityModel.js";
import Assignment from "../../models/assignmentModel.js";

const createActivity = async (activityData) => {
  const activity = new Activity(activityData);
  return await activity.save();
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
const findExistingActivity = async (classId, teacherId, activityType, options = {}) => {
  try {
    const query = {
      classId: classId,
      teacherId: teacherId,
      activityType: activityType,
    };

    if (activityType === "material" && options.materialUrl) {
      query.materialUrl = options.materialUrl; 
    } else if (activityType === "assignment" && options.assignmentType) {
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
    existingActivity.materialUrl = updateData.materialUrl;

    return await existingActivity.save();
  } catch (error) {
    throw new Error("Error while updating activity: " + error.message);
  }
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
};
