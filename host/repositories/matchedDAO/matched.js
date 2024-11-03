import Matched from "../../models/matchedModel.js";
// hàm để tạo matched chờ xác nhận
const createMatched = async (data) => {
  try {
    const matched = new Matched({
      groupId: data.groupId,
      mentorId: data.mentorId,
      status: data.status || "Pending",
    });

    const savedMatched = await matched.save();
    return savedMatched;
  } catch (error) {
    throw error;
  }
};
//hàm để cập nhật matched
const updateMatchedById = async (id, updateData) => {
  try {
    const updatedMatched = await Matched.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return updatedMatched;
  } catch (error) {
    throw error;
  }
};
// hàm để xoá matched
const deleteMatchedById = async (id) => {
  try {
    const deletedMatched = await Matched.findByIdAndDelete(id);
    return deletedMatched;
  } catch (error) {
    throw error;
  }
};
export default {
  createMatched,
  updateMatchedById,
  deleteMatchedById,
};
