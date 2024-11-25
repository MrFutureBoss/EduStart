import ClassTransferRequest from "../../models/ClassTransferRequest.js";
import Class from "../../models/classModel.js";

const getAvailableClasses = async () => {
  try {
    return await Class.find({ limitStudent: { $gt: 0 }, status: "Active" })
      .select("className limitStudent")
      .lean();
  } catch (error) {
    console.error("Error fetching available classes:", error);
    throw error;
  }
};

const createTransferRequest = async ({
  studentId,
  currentClassId,
  requestedClassId,
  reason,
}) => {
  try {
    const existingRequest = await ClassTransferRequest.findOne({
      studentId,
      currentClassId,
      requestedClassId,
      status: "pending",
    });

    if (existingRequest) {
      throw new Error("A pending transfer request already exists.");
    }

    const transferRequest = new ClassTransferRequest({
      studentId,
      currentClassId,
      requestedClassId,
      reason,
      status: "pending",
    });

    return await transferRequest.save();
  } catch (error) {
    console.error("Error creating transfer request:", error);
    throw error;
  }
};

const updateRequestStatus = async (requestId, status, rejectMessage = null) => {
  try {
    if (!["approved", "rejected"].includes(status)) {
      throw new Error("Invalid status.");
    }

    const updateFields = { status };
    if (status === "rejected" && rejectMessage) {
      updateFields.rejectMessage = rejectMessage;
    }

    const updatedRequest = await ClassTransferRequest.findByIdAndUpdate(
      requestId,
      updateFields,
      { new: true }
    );

    if (!updatedRequest) {
      throw new Error("Transfer request not found.");
    }

    return updatedRequest;
  } catch (error) {
    console.error("Error updating transfer request status:", error);
    throw error;
  }
};

const getAllTransferRequests = async () => {
  try {
    return await ClassTransferRequest.find()
      .populate("studentId", "username email rollNumber")
      .populate("currentClassId", "className")
      .populate("requestedClassId", "className")
      .lean();
  } catch (error) {
    console.error("Error fetching transfer requests:", error);
    throw error;
  }
};

const getUserTransferRequests = async (userId) => {
  try {
    return await ClassTransferRequest.find({ studentId: userId })
      .populate("currentClassId", "className")
      .populate("requestedClassId", "className")
      .lean();
  } catch (error) {
    console.error("Error fetching user transfer requests:", error);
    throw error;
  }
};

export default {
  getAvailableClasses,
  createTransferRequest,
  updateRequestStatus,
  getAllTransferRequests,
  getUserTransferRequests,
};
