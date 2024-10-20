import activityDAO from "../../repositories/activityDAO/index.js";

const createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      activityType,
      classId,
      assignmentType,
      deadline,
      startDate,
      semesterId,
    } = req.body;
    const teacherId = req.user._id;

    // Handle material upload
    if (activityType === "material") {
      if (!req.file) {
        return res.status(400).json({ message: "Material file is required." });
      }

      // Ensure that we save only the relative URL, not the absolute path
      const materialUrl = `uploads/materials/${req.file.filename}`;

      const newMaterial = {
        teacherId,
        title,
        description,
        activityType: "material",
        classId,
        materialUrl, // Save relative URL
      };

      const savedMaterial = await activityDAO.createActivity(newMaterial);
      return res.status(201).json({
        message: "Material created successfully",
        activity: savedMaterial,
      });
    }

    // Handle post creation
    if (activityType === "post") {
      if (!title || !classId || !semesterId) {
        return res.status(400).json({
          message: "Title, ClassId, and SemesterId are required for Post",
        });
      }

      const newPost = {
        teacherId,
        title,
        description,
        activityType: "post",
        classId,
        semesterId,
      };

      const savedPost = await activityDAO.createActivity(newPost);
      return res.status(201).json({
        message: "Post created successfully",
        activity: savedPost,
      });
    }

    // Handle outcome creation
    if (activityType === "outcome") {
      if (!title || !classId || !assignmentType || !deadline || !startDate || !semesterId) {
        return res.status(400).json({
          message:
            "All fields (Title, ClassId, AssignmentType, Deadline, StartDate, SemesterId) are required for Outcome",
        });
      }

      const newOutcome = {
        teacherId,
        title,
        description,
        activityType: "outcome",
        classId,
        assignmentType,
        deadline,
        startDate,
        semesterId,
      };

      const savedOutcome = await activityDAO.createActivity(newOutcome);
      return res.status(201).json({
        message: "Outcome created successfully",
        activity: savedOutcome,
      });
    }

    // Invalid activity type
    return res.status(400).json({ message: "Invalid activity type" });
  } catch (error) {
    console.error("Error creating or updating activity:", error);
    res.status(500).json({
      message: "Failed to create or update activity",
      error: error.message,
    });
  }
};


const getActivities = async (req, res) => {
  try {
    const { classId } = req.query;
    const activities = await activityDAO.findActivitiesByClassAndTeacher(
      classId,
      req.user._id
    );
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activities", error });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { title, description, deadline } = req.body;
    const existingActivity = await activityDAO.findActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const updatedActivity = await activityDAO.updateActivityById(activityId, {
      title,
      description,
      deadline,
    });
    if (!updatedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.status(200).json({
      message: "Activity updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update activity", error });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const existingActivity = await activityDAO.findActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }
    await activityDAO.deleteActivityById(activityId);
    res.status(200).json({
      message: "Activity deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { title, description } = req.body;
    let materialUrl = null;
    if (req.file) {
      materialUrl = req.file.path;
    }
    const existingActivity = await activityDAO.findActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: "Material not found" });
    }
    if (existingActivity.title === title) {
      return res.status(400).json({
        message:
          "Tên tài liệu không được trùng với tài liệu hiện tại. Vui lòng nhập tên mới.",
      });
    }
    const updatedActivity = await activityDAO.updateActivityById(activityId, {
      title,
      description,
      materialUrl,
    });
    res.status(200).json({
      message: "Material updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update material",
      error: error.message,
    });
  }
};
const getActivitiesByTeacher = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const activities = await activityDAO.findActivitiesByTeacher(teacherId);

    if (!activities || activities.length === 0) {
      return res.status(404).json({
        message: "No activities found for this teacher",
      });
    }

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};
const checkFileExists = async (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res
      .status(400)
      .json({ success: false, message: "File name is required" });
  }

  try {
    const existingMaterial = await activityDAO.findActivityByMaterialUrl(
      filename
    );

    if (existingMaterial) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while checking file existence",
      errors: error.message,
    });
  }
};
export default {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  updateMaterial,
  getActivitiesByTeacher,
  checkFileExists,
};
