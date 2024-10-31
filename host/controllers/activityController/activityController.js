import activityDAO from "../../repositories/activityDAO/index.js";
import moment from "moment";

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
      content,
    } = req.body;
    const teacherId = req.user._id;

    if (activityType === "material") {
      if (!req.file) {
        return res.status(400).json({ message: "Material file is required." });
      }

      const materialUrl = `uploads/materials/${req.file.filename}`;

      const newMaterial = {
        teacherId,
        activityType: "material",
        classId,
        materialUrl,
      };

      const savedMaterial = await activityDAO.createActivity(newMaterial);
      return res.status(201).json({
        message: "Material created successfully",
        activity: savedMaterial,
      });
    }

    if (activityType === "post") {
      if (!description || !classId) {
        return res.status(400).json({
          message: "Description and ClassId are required for Post",
        });
      }

      let materialUrl = null;
      if (req.file) {
        materialUrl = `uploads/materials/${req.file.filename}`;
      }

      const newPost = {
        teacherId,
        description,
        activityType: "post",
        classId,
        materialUrl,
      };

      const savedPost = await activityDAO.createActivity(newPost);

      return res.status(201).json({
        message: "Post created successfully",
        activity: savedPost,
      });
    }

    if (activityType === "outcome") {
      if (assignmentType === "outcome 2") {
        const outcome1Exists = await activityDAO.findOutcomeByClassIdAndType(
          classId,
          "outcome 1"
        );
        if (!outcome1Exists) {
          return res.status(400).json({
            message: "Cannot create Outcome 2 before Outcome 1 is completed",
          });
        }
      }

      if (assignmentType === "outcome 3") {
        const outcome2Exists = await activityDAO.findOutcomeByClassIdAndType(
          classId,
          "outcome 2"
        );
        if (!outcome2Exists) {
          return res.status(400).json({
            message: "Cannot create Outcome 3 before Outcome 2 is completed",
          });
        }
      }

      const existingOutcome = await activityDAO.findOutcomeByClassIdAndType(
        classId,
        assignmentType
      );
      if (existingOutcome) {
        return res.status(400).json({
          message: `An Outcome of type ${assignmentType} already exists for this class.`,
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
    const { description, deadline } = req.body;
    let materialUrl = req.file
      ? `uploads/materials/${req.file.filename}`
      : null;

    const existingActivity = await activityDAO.findActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const updatedData = {
      description,
      deadline,
    };

    if (materialUrl) {
      updatedData.materialUrl = materialUrl;
    }

    const updatedActivity = await activityDAO.updateActivityById(
      activityId,
      updatedData
    );

    res.status(200).json({
      message: "Activity updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    console.error("Failed to update activity:", error);
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
    const { activityType } = req.query; 

    const activities = await activityDAO.findActivitiesByTeacher(
      teacherId,
      activityType
    );

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
  try {
    const { fileName, classId } = req.query;

    const existingMaterial = await activityDAO.findActivityByMaterialUrl(
      fileName,
      classId
    );

    if (existingMaterial) {
      return res.status(200).json({ exists: true });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check file existence",
      error: error.message,
    });
  }
};

const getSuggestedMaterials = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user._id;

    const suggestedMaterials = await activityDAO.getSuggestedMaterials(
      teacherId,
      classId
    );

    res.status(200).json({ success: true, suggestedMaterials });
  } catch (error) {
    console.error("Error fetching suggested materials:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch suggested materials" });
  }
};
const sendReminder = async (req, res) => {
  const { classId, assignmentType, deadline } = req.body;
  const teacherId = req.user?._id;

  if (!classId || !assignmentType || !deadline) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const formattedDeadline = moment(deadline).format("DD-MM-YYYY HH:mm:ss");
    const reminderPost = {
      teacherId,
      classId,
      activityType: "post",
      description: `Thông báo: ${assignmentType} sẽ hết hạn vào ngày ${formattedDeadline}.`,
    };

    const savedReminder = await activityDAO.createActivity(reminderPost);
    return res.status(201).json({
      message: "Reminder post created successfully",
      activity: savedReminder,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return res.status(500).json({
      message: "Failed to create reminder",
      error: error.message,
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
  getSuggestedMaterials,
  sendReminder,
};
