import ruleJoinDAO from "../../repositories/ruleJoinDAO/index.js";

const createRuleJoin = async (req, res, next) => {
  try {
    const data = req.body;
    const newRuleJoin = await ruleJoinDAO.createRuleJoin(data);
    res.status(201).json(newRuleJoin);
  } catch (error) {
    next(error);
  }
};

const getRuleJoinById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ruleJoin = await ruleJoinDAO.getRuleJoinById(id);

    if (!ruleJoin) {
      return res.status(404).json({ message: "RuleJoin not found" });
    }

    res.status(200).json(ruleJoin);
  } catch (error) {
    next(error);
  }
};

const updateRuleJoin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedRuleJoin = await ruleJoinDAO.updateRuleJoin(id, data);

    if (!updatedRuleJoin) {
      return res.status(404).json({ message: "RuleJoin not found" });
    }

    res.status(200).json(updatedRuleJoin);
  } catch (error) {
    next(error);
  }
};

const deleteRuleJoin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedRuleJoin = await ruleJoinDAO.deleteRuleJoin(id);

    if (!deletedRuleJoin) {
      return res.status(404).json({ message: "RuleJoin not found" });
    }

    res.status(200).json({ message: "RuleJoin deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getAllRuleJoins = async (req, res, next) => {
  try {
    const ruleJoins = await ruleJoinDAO.getAllRuleJoins();
    res.status(200).json(ruleJoins);
  } catch (error) {
    next(error);
  }
};

export default {
  createRuleJoin,
  getRuleJoinById,
  updateRuleJoin,
  deleteRuleJoin,
  getAllRuleJoins,
};
