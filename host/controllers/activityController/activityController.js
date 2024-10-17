import activityDAO from "../../repositories/activityDAO/index.js";
import { sendReminderEmail } from "../../utilities/email.js";

const createActivity = async (req, res) => {
  try {
    const { title, description, activityType, classId, assignmentType, deadline } = req.body;
    const teacherId = req.user._id;

    if (activityType === "assignment" && deadline) {
      const currentTime = new Date();
      const deadlineTime = new Date(deadline);

      if (deadlineTime < currentTime) {
        return res.status(400).json({
          message: "Deadline cannot be in the past",
        });
      }
    }

    if (activityType === "post") {
      const newPost = {
        teacherId,
        title,
        description,
        activityType: "post",
        classId,
      };

      const savedPost = await activityDAO.createActivity(newPost);

      return res.status(201).json({
        message: "Post created successfully",
        activity: savedPost,
      });
    }

    let materialUrl = null;
    if (activityType === "material" && req.file) {
      materialUrl = req.file.path; 
    }

    let options = {};
    if (activityType === "material") {
      options.materialUrl = materialUrl;
    } else if (activityType === "assignment") {
      options.assignmentType = assignmentType;
    }

    const existingActivity = await activityDAO.findExistingActivity(
      classId,
      teacherId,
      activityType,
      options
    );

    // If activity exists, update it (based on business logic)
    if (existingActivity) {
      const updateData = { title, description };

      if (activityType === "material" && materialUrl) {
        updateData.materialUrl = materialUrl;
      } else if (activityType === "assignment") {
        updateData.assignmentType = assignmentType;
        updateData.deadline = deadline;
      }

      const updatedActivity = await activityDAO.updateExistingActivity(existingActivity, updateData);
      return res.status(200).json({
        message: `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} updated successfully`,
        activity: updatedActivity,
      });
    }

    // Create new activity if no existing one is found
    const newActivityData = {
      teacherId,
      title,
      description,
      activityType,
      classId,
    };

    if (activityType === "material") {
      newActivityData.materialUrl = materialUrl;
    } else if (activityType === "assignment") {
      newActivityData.assignmentType = assignmentType;
      newActivityData.deadline = deadline;
    }

    const newActivity = await activityDAO.createActivity(newActivityData);

    res.status(201).json(newActivity);
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
    const updatedActivity = await activityDAO.updateActivityById(activityId, {
      title,
      description,
      deadline,
    });

    if (!updatedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.status(200).json(updatedActivity);
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
    console.error("Error deleting activity:", error);
    res.status(500).json({
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};
const getOverdueGroups = async (req, res) => {
  try {
    const { activityId } = req.params;

    const activity = await activityRepository.findActivityById(activityId);
    if (!activity || activity.activityType !== "assignment") {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const groups = await groupRepository.findGroupsByClassId(activity.classId);
    const submittedGroupIds = await activityDAO.findSubmittedGroups(activityId);

    const overdueGroups = groups.filter(
      (group) => !submittedGroupIds.includes(group._id.toString())
    );

    res.status(200).json({ overdueGroups });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch overdue groups", error });
  }
};
const sendReminder = async (req, res) => {
  try {
    const { activityId } = req.params;

    const activity = await activityRepository.findActivityById(activityId);
    if (!activity || activity.activityType !== "assignment") {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const groups = await groupRepository.findGroupsByClassId(activity.classId);
    const submittedGroupIds =
      await assignmentSubmissionRepository.findSubmittedGroups(activityId);
    const overdueGroups = groups.filter(
      (group) => !submittedGroupIds.includes(group._id.toString())
    );

    overdueGroups.forEach(async (group) => {
      const leader = await userRepository.findUserById(group.leaderId);
      if (leader) {
        await sendReminderEmail(
          leader.email,
          activity.title,
          activity.deadline
        );
      }
    });

    res.status(200).json({ message: "Reminder sent successfully" });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Failed to send reminder", error });
  }
};
export default {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  getOverdueGroups,
  sendReminder,
};
