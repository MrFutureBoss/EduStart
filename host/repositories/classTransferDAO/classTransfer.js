import ClassTransferRequest from "../../models/ClassTransferRequest.js";

const createTransferRequest = async ({
  studentId,
  currentClassId,
  requestedClassId,
  reason,
}) => {
  try {
    const transferRequest = new ClassTransferRequest({
      studentId,
      currentClassId,
      requestedClassId,
      reason,
    });

    return await transferRequest.save();
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu chuyển lớp:", error);
    throw error;
  }
};

const updateRequestStatus = async (requestId, status, rejectMessage = null) => {
  try {
    // Kiểm tra trạng thái có hợp lệ không
    if (!["approved", "rejected"].includes(status)) {
      throw new Error("Trạng thái không hợp lệ.");
    }

    // Nếu trạng thái là "rejected", yêu cầu rejectMessage
    const updateFields = { status };
    if (status === "rejected") {
      if (!rejectMessage) {
        throw new Error("Bạn phải cung cấp rejectMessage khi từ chối yêu cầu.");
      }
      updateFields.rejectMessage = rejectMessage;
    }

    // Cập nhật yêu cầu với các trường cần thiết
    const transferRequest = await ClassTransferRequest.findByIdAndUpdate(
      requestId,
      updateFields,
      { new: true }
    );

    if (!transferRequest) {
      throw new Error("Yêu cầu chuyển lớp không tồn tại.");
    }

    return transferRequest;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái yêu cầu chuyển lớp:", error);
    throw error;
  }
};

const getAllTransferRequests = async () => {
  try {
    // Tìm tất cả các yêu cầu đổi lớp
    const transferRequests = await ClassTransferRequest.find()
      .populate("studentId", "username email rollNumber")
      .populate("currentClassId", "className")
      .populate("requestedClassId", "className")
      .lean();
    return transferRequests;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu đổi lớp:", error);
    throw error;
  }
};

export default {
  getAllTransferRequests,
  createTransferRequest,
  updateRequestStatus,
};
