import ClassChangeRequest from "../models/ClassChangeRequest.js";
import Class from "../models/classModel.js"; // Assuming a `Class` model exists

// Create a new class change request
export const createRequest = async (req, res) => {
  try {
    const { studentId, currentClassId, requestedClassId, reason } = req.body;

    const newRequest = new ClassChangeRequest({
      studentId,
      currentClassId,
      requestedClassId,
      reason,
    });

    await newRequest.save();
    res.status(201).json({ message: "Class change request created successfully.", data: newRequest });
  } catch (error) {
    console.error("Error creating class change request:", error);
    res.status(500).json({ message: "Failed to create class change request.", error: error.message });
  }
};

// Fetch available classes
export const getAvailableClasses = async (req, res) => {
    try {
      // Fetch classes with available slots and active status
      const availableClasses = await Class.find({
        limitStudent: { $gt: 0 }, // Classes with remaining slots
        status: "Active",        // Only active classes
      })
        .select("_id className limitStudent") // Select required fields
        .lean();
  
      if (!availableClasses.length) {
        return res.status(404).json({ message: "No available classes found." });
      }
  
      res.status(200).json({ classes: availableClasses });
    } catch (error) {
      console.error("Error fetching available classes:", error);
      res.status(500).json({ message: "Failed to fetch available classes.", error: error.message });
    }
  };

// Fetch all requests for a specific user
export const getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await ClassChangeRequest.find({ studentId: userId })
      .populate("currentClassId", "className")
      .populate("requestedClassId", "className")
      .lean();

    res.status(200).json({ data: requests });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ message: "Failed to fetch user requests.", error: error.message });
  }
};

// Update the status of a request
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId, status, rejectMessage } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const updateFields = { status };
    if (status === "rejected") updateFields.rejectMessage = rejectMessage;

    const updatedRequest = await ClassChangeRequest.findByIdAndUpdate(requestId, updateFields, { new: true });

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({ message: "Request status updated successfully.", data: updatedRequest });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Failed to update request status.", error: error.message });
  }
};
