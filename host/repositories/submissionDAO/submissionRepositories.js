import Submission from "../../models/submissionModel.js";

const createSubmission = async (submissionData) => {
  try {
    const submission = new Submission(submissionData);
    return await submission.save();
  } catch (error) {
    throw new Error("Error creating submission: " + error.message);
  }
};

const getSubmissionById = async (id) => {
  try {
    return await Submission.findById(id)
      .populate("groupId")
      .populate("classId")
      .populate("submitId")
      .populate("leaderId");
  } catch (error) {
    throw new Error("Error fetching submission by ID: " + error.message);
  }
};

const getSubmissions = async (filter = {}) => {
  try {
    return await Submission.find(filter)
      .populate("groupId")
      .populate("classId")
      .populate("submitId")
      .populate("leaderId");
  } catch (error) {
    throw new Error("Error fetching submissions: " + error.message);
  }
};

const updateSubmissionById = async (id, updateData) => {
  try {
    return await Submission.findByIdAndUpdate(id, updateData, { new: true });
  } catch (error) {
    throw new Error("Error updating submission: " + error.message);
  }
};

const deleteSubmissionById = async (id) => {
  try {
    return await Submission.findByIdAndDelete(id);
  } catch (error) {
    throw new Error("Error deleting submission: " + error.message);
  }
};

const findSubmissionBySubmitId = async (submitId) => {
  return await Submission.findOne({ submitId })
    .populate("groupId", "name description status")
    .populate("classId", "className limitStudent teacherId status")
    .populate("leaderId", "username email rollNumber");
};

export default {
  createSubmission,
  getSubmissionById,
  getSubmissions,
  updateSubmissionById,
  deleteSubmissionById,
  findSubmissionBySubmitId,
};