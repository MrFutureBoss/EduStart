import TempGroup from "../../models/tempGroupModel.js";
import CreateGroupSetting from "../../models/CreateGroupSettingModel.js";
import classDAO from "../classDAO/index.js";
import Group from "../../models/groupModel.js";
import User from "../../models/userModel.js";
import mongoose from "mongoose";

const getAllTempGroups = async (skip, limit, search) => {
  try {
    let query = {};
    if (search) query.groupName = { $regex: search, $options: "i" };

    const result = await TempGroup.find(query)
      .populate({
        path: "userIds", // Populate thông tin của user
        select: "username email rollNumber memberCode major", // Chỉ lấy các trường cần thiết
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await TempGroup.countDocuments(query);
    return { data: result, total };
  } catch (error) {
    throw new Error(error);
  }
};

const getTempGroupById = async (id) => {
  try {
    return await TempGroup.findById(id)
      .populate({
        path: "userIds", // Populate thông tin của user
        select: "username email rollNumber memberCode major", // Chỉ lấy các trường cần thiết
      })
      .populate("classId") // Có thể giữ lại hoặc xóa nếu không cần populate classId
      .exec();
  } catch (error) {
    throw new Error(error);
  }
};

const createNewTempGroup = async ({
  classId,
  groupName,
  userIds,
  maxStudent,
}) => {
  try {
    return await TempGroup.create({ classId, groupName, userIds, maxStudent });
  } catch (error) {
    throw new Error(error);
  }
};

const updateTempGroup = async (id, values) => {
  try {
    return await TempGroup.findByIdAndUpdate(id, values, { new: true }).exec();
  } catch (error) {
    throw new Error(error);
  }
};

const deleteTempGroup = async (id) => {
  try {
    return await TempGroup.findByIdAndDelete(id).exec();
  } catch (error) {
    throw new Error(error);
  }
};

const getTempGroupsByClassId = async (classId, skip = 0, limit = 10) => {
  try {
    const query = { classId }; // Tìm theo classId

    // Lấy danh sách TempGroup theo điều kiện
    const result = await TempGroup.find(query)
      .populate({
        path: "userIds",
        select: "username email rollNumber memberCode major isLeader", // Chỉ lấy các trường cần thiết từ User
      })
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo
      .skip(skip)
      .limit(limit)
      .exec();

    // Tính tổng số lượng sinh viên trong tất cả các TempGroup
    const totalStudent = result.reduce(
      (acc, group) => acc + group.userIds.length,
      0
    );

    // Tính tổng số lượng TempGroup dựa trên classId
    const total = await TempGroup.countDocuments(query);

    return { data: result, total, totalStudent };
  } catch (error) {
    throw new Error(error);
  }
};

const checkAndFillExpiredGroups = async () => {
  try {
    // Find all CreateGroupSetting documents with due deadlines and autoFinish enabled
    const expiredSettings = await CreateGroupSetting.find({
      deadline: { $lte: new Date() },
      autoFinish: true,
    }).populate("classId");

    if (expiredSettings.length === 0) {
      console.log("No expired or due deadlines with autoFinish enabled found.");
      return {
        message: "No updates required",
        updatedGroups: [],
        unassignedUsers: [],
        affectedClasses: [], // No classes were processed
        totalAffectedClasses: 0, // Count of affected classes is zero
      };
    }

    const updatedGroupsLog = []; // Track details of updated groups
    const excessStudentsLog = []; // Track unassigned students
    const affectedClassIds = new Set(); // Track unique classIds that were processed

    for (const setting of expiredSettings) {
      const { classId } = setting;

      // Mark the class as affected
      affectedClassIds.add(classId._id.toString());

      // Fetch all ungrouped users
      let ungroupedUsersResult = await classDAO.unGroupUser(classId._id);
      let ungroupedUsers = ungroupedUsersResult.data;

      if (!ungroupedUsers || ungroupedUsers.length === 0) continue;

      // Fetch tempGroups in this class that are not full
      let tempGroups = await TempGroup.find({
        classId: classId._id,
        status: false,
      });

      // Fill tempGroups until no ungrouped users are left or all tempGroups are full
      for (const tempGroup of tempGroups) {
        while (
          tempGroup.userIds.length < tempGroup.maxStudent &&
          ungroupedUsers.length > 0
        ) {
          // Assign users to this group until maxStudent is reached
          const user = ungroupedUsers.shift();
          tempGroup.userIds.push(user._id);
        }

        // If the group is now full, set its status to true
        tempGroup.status = tempGroup.userIds.length === tempGroup.maxStudent;
        await tempGroup.save();

        // Log updated group details
        updatedGroupsLog.push({
          groupId: tempGroup._id,
          groupName: tempGroup.groupName,
          addedUsers: tempGroup.userIds.map((userId) => ({ userId })),
          isFull: tempGroup.status,
        });
      }

      // If any users remain unassigned, add them to the log
      if (ungroupedUsers.length > 0) {
        excessStudentsLog.push(
          ...ungroupedUsers.map((user) => ({
            userId: user._id,
            username: user.username,
            classId: classId._id,
          }))
        );
      }
    }

    return {
      message: "Auto-filling process completed",
      updatedGroups: updatedGroupsLog,
      unassignedUsers: {
        total: excessStudentsLog.length,
        users: excessStudentsLog,
      },
      affectedClasses: Array.from(affectedClassIds), // List of unique classIds processed
      totalAffectedClasses: affectedClassIds.size, // Count of unique classIds processed
    };
  } catch (error) {
    console.error("Error in checkAndFillExpiredGroups:", error.message);
    throw new Error("Error checking and filling expired groups.");
  }
};

const getTempGroupDetailByGroupName = async (groupName) => {
  try {
    const group = await TempGroup.findOne({ groupName })
      .populate({
        path: "userIds",
        select: "username email rollNumber memberCode major",
      })
      .exec();

    if (!group) {
      throw new Error("TempGroup not found");
    }

    return group;
  } catch (error) {
    throw new Error(error.message);
  }
};

const fillGroupsByClassId = async (classId) => {
  try {
    const updatedGroupsLog = [];
    const excessStudentsLog = [];
    const affectedClassIds = new Set();

    affectedClassIds.add(classId.toString());

    const ungroupedUsersResult = await classDAO.unGroupUser(classId);
    let ungroupedUsers = ungroupedUsersResult.data;

    if (!ungroupedUsers || ungroupedUsers.length === 0) {
      return {
        message: "No ungrouped users found for this class",
        updatedGroups: [],
        unassignedUsers: [],
        affectedClasses: Array.from(affectedClassIds),
        totalAffectedClasses: affectedClassIds.size,
      };
    }

    const tempGroups = await TempGroup.find({ classId });

    for (const tempGroup of tempGroups) {
      while (
        tempGroup.userIds.length < tempGroup.maxStudent &&
        ungroupedUsers.length > 0
      ) {
        const user = ungroupedUsers.shift();
        tempGroup.userIds.push(user._id);
      }

      tempGroup.status = tempGroup.userIds.length === tempGroup.maxStudent;
      await tempGroup.save();

      updatedGroupsLog.push({
        groupId: tempGroup._id,
        groupName: tempGroup.groupName,
        addedUsers: tempGroup.userIds.map((userId) => ({ userId })),
        isFull: tempGroup.status,
      });
    }

    if (ungroupedUsers.length > 0) {
      excessStudentsLog.push(
        ...ungroupedUsers.map((user) => ({
          userId: user._id,
          username: user.username,
          classId: classId,
        }))
      );
    }

    return {
      message: "Group filling process completed for specified classId",
      updatedGroups: updatedGroupsLog,
      unassignedUsers: {
        total: excessStudentsLog.length,
        users: excessStudentsLog,
      },
      affectedClasses: Array.from(affectedClassIds),
      totalAffectedClasses: affectedClassIds.size,
    };
  } catch (error) {
    console.error("Error in fillGroupsByClassId:", error.message);
    throw new Error("Error filling groups by classId.");
  }
};

const makeOfficalGroupByClassId = async (classId) => {
  try {
    const tempGroups = await TempGroup.find({ classId });

    if (tempGroups.length === 0) {
      return { message: "No TempGroups found for the provided classId" };
    }

    const createdGroups = [];

    for (const tempGroup of tempGroups) {
      const newGroup = await Group.create({
        name: tempGroup.groupName,
        description: "",
        status: "Active",
        projectId: null,
        classId: tempGroup.classId,
      });

      createdGroups.push(newGroup);
    }

    return { message: "Groups created successfully", createdGroups };
  } catch (error) {
    throw new Error("Error creating official groups: " + error.message);
  }
};

const allStudentInClassHasGroup = async (classId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("Invalid classId format");
    }

    // Fetch all TempGroups for the given classId
    const tempGroups = await TempGroup.find({ classId });

    if (tempGroups.length === 0) {
      return { message: "No TempGroups found for the provided classId" };
    }

    const updatedUsersLog = [];

    for (const tempGroup of tempGroups) {
      // Find the matching Group for this TempGroup
      const group = await Group.findOne({
        name: tempGroup.groupName,
        classId: tempGroup.classId,
      });

      if (!group) {
        return {
          message: `No matching Group found for TempGroup with groupName ${tempGroup.groupName} and classId ${tempGroup.classId}`,
        };
      }

      const userIds = tempGroup.userIds;

      if (userIds.length === 0) {
        return {
          message: `TempGroup ${tempGroup.groupName} has no users.`,
        };
      }

      // Assign groupId to each user in userIds and set one user as the leader
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        const isLeader = i === 0; // Set the first user as the leader

        // Update the user, adding groupId if it doesn't exist and setting isLeader
        const user = await User.findByIdAndUpdate(
          userId,
          {
            $set: { groupId: group._id }, // Set groupId
            isLeader,
          },
          { new: true, upsert: true } // Ensure groupId is set even if missing
        );

        if (!user) {
          return {
            message: `Failed to update user with _id ${userId}. User may not exist.`,
          };
        }

        updatedUsersLog.push({
          userId: user._id,
          groupId: group._id,
          isLeader: user.isLeader,
        });
      }
    }

    return {
      message: "Users updated with groupId and leader status",
      updatedUsers: updatedUsersLog,
    };
  } catch (error) {
    console.error("Error in allStudentInClassHasGroup:", error.message);
    throw new Error(`Error updating users with groupId: ${error.message}`);
  }
};

const findTempGroupByClassId = async (classId) => {
  return await TempGroup.findOne({ classId }).select(
    "groupName status maxStudent userIds"
  );
};
export default {
  getAllTempGroups,
  getTempGroupById,
  getTempGroupsByClassId,
  createNewTempGroup,
  updateTempGroup,
  deleteTempGroup,
  checkAndFillExpiredGroups,
  getTempGroupDetailByGroupName,
  fillGroupsByClassId,
  makeOfficalGroupByClassId,
  allStudentInClassHasGroup,
  findTempGroupByClassId,
};
