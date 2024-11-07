import TempGroup from "../../models/tempGroupModel.js";
import CreateGroupSetting from "../../models/CreateGroupSettingModel.js";
import classDAO from "../classDAO/index.js";

const getAllTempGroups = async (skip, limit, search) => {
  try {
    let query = {};
    if (search) query.groupName = { $regex: search, $options: "i" };

    const result = await TempGroup.find(query)
      .populate({
        path: "userIds", // Populate thông tin của user
        select: "username email rollNumber memberCode", // Chỉ lấy các trường cần thiết
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
        select: "username email rollNumber memberCode", // Chỉ lấy các trường cần thiết
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
        select: "username email rollNumber memberCode", // Chỉ lấy các trường cần thiết từ User
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


export default {
  getAllTempGroups,
  getTempGroupById,
  getTempGroupsByClassId,
  createNewTempGroup,
  updateTempGroup,
  deleteTempGroup,
  checkAndFillExpiredGroups,
};
