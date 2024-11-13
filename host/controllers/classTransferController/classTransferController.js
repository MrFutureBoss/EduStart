import classTransferDAO from "../../repositories/classTransferDAO/index.js";

const requestClassTransfer = async (req, res) => {
  try {
    const { studentId, currentClassId, requestedClassId, reason } = req.body;

    // Gọi service để tạo yêu cầu chuyển lớp
    const transferRequest = await classTransferDAO.createTransferRequest({
      studentId,
      currentClassId,
      requestedClassId,
      reason,
    });

    res.status(201).json({
      message: "Yêu cầu chuyển lớp đã được tạo.",
      data: transferRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi gửi yêu cầu chuyển lớp.",
      error: error.message,
    });
  }
};

const updateTransferRequestStatus = async (req, res) => {
  try {
    const { status, requestId, rejectMessage } = req.body; // `status` có thể là `approved` hoặc `rejected`

    const updatedRequest = await classTransferDAO.updateRequestStatus(
      requestId,
      status,
      rejectMessage
    );

    res.status(200).json({
      message: "Trạng thái yêu cầu chuyển lớp đã được cập nhật.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật trạng thái yêu cầu chuyển lớp.",
      error: error.message,
    });
  }
};

const getAllTransferRequests = async (req, res) => {
  try {
    const transferRequests = await classTransferDAO.getAllTransferRequests();
    res.status(200).json({
      message: "Danh sách tất cả yêu cầu đổi lớp.",
      data: transferRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy danh sách yêu cầu đổi lớp.",
      error: error.message,
    });
  }
};

export default {
  getAllTransferRequests,
  requestClassTransfer,
  updateTransferRequestStatus,
};
