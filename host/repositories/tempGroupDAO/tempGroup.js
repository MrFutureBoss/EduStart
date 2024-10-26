import TempGroup from "../../models/tempGroupModel.js";


const getAllTempGroups = async (skip, limit, search) => {
  try {
    let query = {};
    if (search) query.groupName = { $regex: search, $options: "i" };

    const result = await TempGroup.find(query)
      .populate({
        path: "userIds",  // Populate thông tin của user
        select: "username email rollNumber memberCode"  // Chỉ lấy các trường cần thiết
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
        path: "userIds",  // Populate thông tin của user
        select: "username email rollNumber memberCode"  // Chỉ lấy các trường cần thiết
      })
      .populate("classId")  // Có thể giữ lại hoặc xóa nếu không cần populate classId
      .exec();
  } catch (error) {
    throw new Error(error);
  }
};

const createNewTempGroup = async ({ classId, groupName, userIds, maxStudent }) => {
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
    const query = { classId };  // Tìm theo classId

    const result = await TempGroup.find(query)
      .populate({
        path: "userIds",
        select: "username email rollNumber memberCode"  // Chỉ lấy các trường cần thiết từ User
      })
      .sort({ createdAt: -1 })  // Sắp xếp theo thời gian tạo
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await TempGroup.countDocuments(query);
    return { data: result, total };
  } catch (error) {
    throw new Error(error);
  }
  
};

export default {
  getAllTempGroups,
  getTempGroupById,
  getTempGroupsByClassId,
  createNewTempGroup,
  updateTempGroup,
  deleteTempGroup,
};
