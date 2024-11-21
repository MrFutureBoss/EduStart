import tempGroupDAO from "../../repositories/tempGroupDAO/index.js";

const getAllTempGroups = async (req, res, next) => {
  try {
    const { skip, limit, search } = req.query;
    const groups = await tempGroupDAO.getAllTempGroups(
      Number.parseInt(skip || 0),
      Number.parseInt(limit || 10),
      search
    );
    res.status(200).send(groups);
  } catch (error) {
    next(error);
  }
};

const getTempGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await tempGroupDAO.getTempGroupById(id);
    if (group) {
      res.status(200).send(group);
    } else {
      res.status(404).send({ message: "TempGroup not found" });
    }
  } catch (error) {
    next(error);
  }
};

const createNewTempGroup = async (req, res, next) => {
  try {
    const { classId, groupName, userIds, maxStudent } = req.body;
    const newGroup = await tempGroupDAO.createNewTempGroup({
      classId,
      groupName,
      userIds,
      maxStudent,
    });
    res.status(201).send(newGroup);
  } catch (error) {
    next(error);
  }
};

const updateTempGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateValues = req.body;
    const updatedGroup = await tempGroupDAO.updateTempGroup(id, updateValues);
    if (updatedGroup) {
      res.status(200).send(updatedGroup);
    } else {
      res.status(404).send({ message: "TempGroup not found" });
    }
  } catch (error) {
    next(error);
  }
};

const deleteTempGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedGroup = await tempGroupDAO.deleteTempGroup(id);
    if (deletedGroup) {
      res.status(200).send({ message: "TempGroup deleted successfully" });
    } else {
      res.status(404).send({ message: "TempGroup not found" });
    }
  } catch (error) {
    next(error);
  }
};

const getTempGroupsByClassId = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { skip, limit } = req.query;

    const groups = await tempGroupDAO.getTempGroupsByClassId(
      classId,
      Number.parseInt(skip || 0),
      Number.parseInt(limit || 10)
    );

    if (groups.data.length > 0) {
      res.status(200).send(groups);
    } else {
      res.status(404).send({ message: "No groups found for this classId" });
    }
  } catch (error) {
    next(error);
  }
};

const autoFillGroupsOnDeadline = async (req, res, next) => {
  try {
    const result = await tempGroupDAO.checkAndFillExpiredGroups();

    if (result.unassignedUsers.total > 0) {
      return res.status(207).json({
        message: result.message,
        updatedGroups: result.updatedGroups,
        unassignedUsers: result.unassignedUsers,
      });
    }

    res.status(200).json({
      message: result.message,
      updatedGroups: result.updatedGroups,
      unassignedUsers: result.unassignedUsers,
    });
  } catch (error) {
    next(error);
  }
};

const getTempGroupDetailByGroupName = async (req, res, next) => {
  try {
    const { groupName } = req.params;
    const group = await tempGroupDAO.getTempGroupDetailByGroupName(groupName);

    if (group) {
      res.status(200).send(group);
    } else {
      res.status(404).send({ message: "TempGroup not found" });
    }
  } catch (error) {
    next(error);
  }
};

const fillGroupsByClassId = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const result = await tempGroupDAO.fillGroupsByClassId(classId);

    if (result.unassignedUsers.total > 0) {
      return res.status(207).json({
        message: result.message,
        updatedGroups: result.updatedGroups,
        unassignedUsers: result.unassignedUsers,
      });
    }

    res.status(200).json({
      message: result.message,
      updatedGroups: result.updatedGroups,
      unassignedUsers: result.unassignedUsers,
    });
  } catch (error) {
    next(error);
  }
};

const makeOfficalGroupByClassId = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const result = await tempGroupDAO.makeOfficalGroupByClassId(classId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const allStudentInClassHasGroup = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const result = await tempGroupDAO.allStudentInClassHasGroup(classId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in allStudentInClassHasGroupController:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllTempGroups,
  getTempGroupById,
  getTempGroupsByClassId,
  createNewTempGroup,
  updateTempGroup,
  deleteTempGroup,
  autoFillGroupsOnDeadline,
  getTempGroupDetailByGroupName,
  fillGroupsByClassId,
  makeOfficalGroupByClassId,
  allStudentInClassHasGroup
};
