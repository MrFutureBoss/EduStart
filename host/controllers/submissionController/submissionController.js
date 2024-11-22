import activityDAO from "../../repositories/activityDAO/index.js";
import submissionDAO from "../../repositories/submissionDAO/index.js";

const createSubmission = async (req, res) => {
  try {
    const { groupId, classId, submitId, leaderId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Files are required" });
    }

    const fileUrls = req.files.map(
      (file) => `/uploads/materials/${file.filename}`
    );

    const submissionData = {
      groupId,
      classId,
      submitId,
      leaderId,
      files: fileUrls,
    };

    const submission = await submissionDAO.createSubmission(submissionData);

    await activityDAO.markActivityAsCompleted(submitId);

    return res.status(201).json({ success: true, submission });
  } catch (error) {
    console.error("Error creating submission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await submissionDAO.getSubmissionById(id);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const filter = req.query || {};
    const submissions = await submissionDAO.getSubmissions(filter);
    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DEBUG] ID Received:", id);
    console.log("[DEBUG] Update Data Received:", req.body);
    console.log("[DEBUG] Files Received:", req.files);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Submission ID is required.",
      });
    }

    // Lấy dữ liệu từ req.body
    const updateData = req.body;

    // Xử lý file mới
    const newFiles = req.files
      ? req.files.map((file) => `/uploads/materials/${file.filename}`)
      : [];

    // Xử lý file cũ
    const existingFiles = updateData.existingFiles
      ? JSON.parse(updateData.existingFiles).filter((file) => file) // Lọc bỏ giá trị null hoặc không hợp lệ
      : [];

    // Gộp file cũ và file mới
    updateData.files = [...existingFiles, ...newFiles];

    // Cập nhật cơ sở dữ liệu
    const updatedSubmission = await submissionDAO.updateSubmissionById(
      id,
      updateData
    );

    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error(`[updateSubmissionById] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the submission.",
    });
  }
};

const deleteSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubmission = await submissionDAO.deleteSubmissionById(id);
    if (!deletedSubmission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getSubmissionBySubmitId = async (req, res) => {
  try {
    const { submitId } = req.params;

    const submission = await submissionDAO.findSubmissionBySubmitId(submitId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error("Error fetching submission by submitId:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export default {
  createSubmission,
  getSubmissionById,
  getSubmissions,
  updateSubmissionById,
  deleteSubmissionById,
  getSubmissionBySubmitId,
};
