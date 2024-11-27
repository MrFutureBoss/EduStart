import ClassChangeRequest from "../models/ClassChangeRequest.js";

// Get user-specific class change requests
export const getUserTransferRequests = async (req, res) => {
  const { userId } = req.params;

  try {
    const requests = await ClassChangeRequest.find({ studentId: userId })
      .populate("currentClassId", "className")
      .populate("requestedClassId", "className")
      .lean();

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Lỗi khi lấy yêu cầu chuyển lớp:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

export default {
  ...classTransferController,
  getUserTransferRequests,
};
