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

export default {
  getAllTempGroups,
  getTempGroupById,
  getTempGroupsByClassId,
  createNewTempGroup,
  updateTempGroup,
  deleteTempGroup,
};
