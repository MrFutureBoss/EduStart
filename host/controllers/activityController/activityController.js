import activityDAO from "../../repositories/activityDAO/index.js";
import groupDAO from "../../repositories/groupDAO/index.js";
import mongoose from "mongoose";
import moment from "moment";
import { ObjectId } from "mongodb";

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
      materialUrl,
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
        materialUrl,
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
const assignOutcomeToAllGroups = async (req, res) => {
  try {
    const { description, classIds, outcomes } = req.body;

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu hoặc không hợp lệ classIds." });
    }

    if (!Array.isArray(outcomes) || outcomes.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu hoặc không hợp lệ outcomes." });
    }

    const allGroups = await groupDAO.getGroupsByClassIds(classIds);

    if (!allGroups || allGroups.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhóm nào trong các lớp được chỉ định.",
      });
    }

    const groupsByClassId = {};
    allGroups.forEach((group) => {
      if (!groupsByClassId[group.classId]) {
        groupsByClassId[group.classId] = [];
      }
      groupsByClassId[group.classId].push(group);
    });

    const classIdsWithGroups = classIds.filter(
      (classId) =>
        groupsByClassId[classId] && groupsByClassId[classId].length > 0
    );
    const classIdsWithoutGroups = classIds.filter(
      (classId) =>
        !groupsByClassId[classId] || groupsByClassId[classId].length === 0
    );

    if (classIdsWithGroups.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhóm nào trong các lớp được chỉ định.",
      });
    }

    const activities = [];
    classIdsWithGroups.forEach((classId) => {
      const groups = groupsByClassId[classId];
      groups.forEach((group) => {
        outcomes.forEach((outcome) => {
          activities.push({
            teacherId: req.user._id,
            activityType: "outcome",
            description: description,
            assignmentType: outcome.assignmentType,
            startDate: outcome.startDate,
            deadline: outcome.deadline,
            classId: classId,
            groupId: group._id,
          });
        });
      });
    });

    if (activities.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có hoạt động nào để giao." });
    }

    await activityDAO.createActivity(activities);

    if (classIdsWithoutGroups.length > 0) {
      return res.status(207).json({
        message:
          "Giao Outcome thành công tới các lớp có nhóm. Một số lớp không có nhóm để giao Outcome.",
        details: {
          successfulClasses: classIdsWithGroups,
          failedClasses: classIdsWithoutGroups,
        },
      });
    } else {
      return res.status(201).json({
        message: "Giao Outcome thành công tới tất cả các nhóm trong các lớp.",
      });
    }
  } catch (error) {
    console.error("Error in assignOutcomeToAllGroups:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi giao Outcome." });
  }
};

const updateOutcomeDeadline = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { newDeadline } = req.body;

    const activity = await activityDAO.findActivityByIdAndType(
      activityId,
      "outcome"
    );
    if (!activity) {
      return res.status(404).json({ error: "Outcome activity not found." });
    }

    activity.deadline = new Date(newDeadline);
    await activity.save();

    res.status(200).json({
      message: "Deadline updated successfully.",
      activity,
    });
  } catch (error) {
    console.error("Error updating deadline:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the deadline." });
  }
};

const createOutcomeType = async (req, res) => {
  try {
    const { name, description, semesterId } = req.body;
    const createdBy = req.user._id;

    const existingOutcome = await activityDAO.isDuplicateOutcomeNameInSemester(
      name,
      semesterId
    );
    if (existingOutcome) {
      return res.status(400).json({
        message: "Outcome with this name already exists for this semester",
      });
    }

    const outcomeData = { name, description, createdBy, semesterId };
    const outcome = await activityDAO.createOutcomeType(outcomeData);
    res.status(201).json(outcome);
  } catch (error) {
    console.error("Error creating outcome:", error);
    res.status(500).json({ message: "Failed to create outcome" });
  }
};

const getAllOutcomesType = async (req, res) => {
  try {
    const outcomes = await activityDAO.getAllOutcomesType(req.query.semesterId); // Optionally filter by semesterId
    res.status(200).json(outcomes);
  } catch (error) {
    console.error("Error fetching outcomes:", error);
    res.status(500).json({ message: "Failed to fetch outcomes" });
  }
};

const getOutcomeTypeById = async (req, res) => {
  try {
    const outcome = await activityDAO.getOutcomeTypeById(req.params.id);
    if (!outcome) {
      return res.status(404).json({ message: "Outcome not found" });
    }
    res.status(200).json(outcome);
  } catch (error) {
    console.error("Error fetching outcome:", error);
    res.status(500).json({ message: "Failed to fetch outcome" });
  }
};

const updateOutcomeType = async (req, res) => {
  try {
    const { name, description, semesterId } = req.body;
    const outcomeId = req.params.id;

    const duplicateOutcome = await activityDAO.findOutcomeByNameAndSemester(
      name,
      semesterId,
      outcomeId
    );

    if (duplicateOutcome) {
      return res.status(400).json({
        message: "An outcome with this name already exists for this semester",
      });
    }

    const updateData = { name, description, semesterId };
    const outcome = await activityDAO.updateOutcomeTypeById(
      outcomeId,
      updateData
    );

    if (!outcome) {
      return res.status(404).json({ message: "Outcome not found" });
    }

    res.status(200).json(outcome);
  } catch (error) {
    console.error("Error updating outcome:", error);
    res.status(500).json({ message: "Failed to update outcome" });
  }
};

const deleteOutcomeType = async (req, res) => {
  try {
    const outcome = await activityDAO.deleteOutcomeTypeById(req.params.id);
    if (!outcome) {
      return res.status(404).json({ message: "Outcome not found" });
    }
    res.status(200).json({ message: "Outcome deleted successfully" });
  } catch (error) {
    console.error("Error deleting outcome:", error);
    res.status(500).json({ message: "Failed to delete outcome" });
  }
};

const getOutcomesBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const outcomes = await activityDAO.getOutcomesBySemesterId(semesterId);

    if (!outcomes || outcomes.length === 0) {
      return res
        .status(404)
        .json({ message: "No outcomes found for this semester" });
    }

    res.status(200).json(outcomes);
  } catch (error) {
    console.error("Error fetching outcomes by semester:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch outcomes for the semester" });
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
  updateOutcomeDeadline,
  assignOutcomeToAllGroups,
  createOutcomeType,
  getAllOutcomesType,
  getOutcomeTypeById,
  updateOutcomeType,
  deleteOutcomeType,
  getOutcomesBySemester,
};
