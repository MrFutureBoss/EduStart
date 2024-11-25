import classTransferDAO from "../repositories/classTransferDAO/index.js";

export const getAvailableClasses = async (req, res) => {
  try {
    const availableClasses = await classTransferDAO.getAvailableClasses();
    res.status(200).json({ classes: availableClasses });
  } catch (error) {
    console.error("Error fetching available classes:", error);
    res.status(500).json({ message: "Error fetching available classes." });
  }
};

export const requestClassTransfer = async (req, res) => {
  try {
    const { studentId, currentClassId, requestedClassId, reason } = req.body;

    const transferRequest = await classTransferDAO.createTransferRequest({
      studentId,
      currentClassId,
      requestedClassId,
      reason,
    });

    res.status(201).json({
      message: "Transfer request created successfully.",
      data: transferRequest,
    });
  } catch (error) {
    console.error("Error creating transfer request:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserTransferRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const transferRequests = await classTransferDAO.getUserTransferRequests(
      userId
    );

    res.status(200).json({
      message: "Fetched user transfer requests.",
      data: transferRequests,
    });
  } catch (error) {
    console.error("Error fetching user transfer requests:", error);
    res.status(500).json({ message: error.message });
  }
};
