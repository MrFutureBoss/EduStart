import RuleJoin from "../../models/RuleJoinModel.js";

// Tạo mới RuleJoin
const createRuleJoin = async (data) => {
  const newRuleJoin = new RuleJoin(data);
  return await newRuleJoin.save();
};

// Lấy RuleJoin theo ID
const getRuleJoinById = async (id) => {
  return await RuleJoin.findById(id);
};

// Cập nhật RuleJoin theo ID
const updateRuleJoin = async (id, data) => {
  return await RuleJoin.findByIdAndUpdate(id, data, { new: true });
};

// Xóa RuleJoin theo ID
const deleteRuleJoin = async (id) => {
  return await RuleJoin.findByIdAndDelete(id);
};

// Lấy tất cả RuleJoins
const getAllRuleJoins = async () => {
  return await RuleJoin.find({});
};

export default {
  createRuleJoin,
  getRuleJoinById,
  updateRuleJoin,
  deleteRuleJoin,
  getAllRuleJoins,
};
