import temporaryMatchingDAO from "../../repositories/temporaryMatchingDAO/index.js";
import { validationResult } from "express-validator";
import groupDAO from "../../repositories/groupDAO/index.js";
const getAllTempMatchingByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { search } = req.query;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const result = await temporaryMatchingDAO.getAllTempMatchingByTeacherId(
      teacherId,
      {
        search,
        skip,
        limit,
      }
    );

    res.status(200).json({
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTempMatchingByGid = async (req, res) => {
  try {
    const { gid } = req.params;
    const result = await temporaryMatchingDAO.addTempMatchingByGid(gid);
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// tempMatchingController.js
const getAvailableMentors = async (req, res) => {
  try {
    const availableMentors = await temporaryMatchingDAO.getAvailableMentors();
    return res.json(availableMentors);
  } catch (error) {
    console.error("Error in getAvailableMentors:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getPotentialMentorsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await temporaryMatchingDAO.getPotentialMentorsByGroupId(
      groupId
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmMatching = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId, mentorId } = req.body;

    const result = await temporaryMatchingDAO.confirmMatching(
      groupId,
      mentorId
    );
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const addTempMatchingForAllGroups = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { selectedMentorIds } = req.body; // Nhận danh sách mentor được chọn

    const groups = await groupDAO.getAllGroupsByTeacherId(teacherId);

    const results = [];

    for (const group of groups) {
      const gidString = group._id.toString();

      try {
        const result = await temporaryMatchingDAO.addTempMatchingByGid(
          gidString,
          selectedMentorIds
        );
        results.push({
          groupId: group._id,
          message: result.message,
        });
      } catch (error) {
        results.push({
          groupId: group._id,
          message: `Error: ${error.message}`,
        });
      }
    }

    res.status(200).json({
      message: "Đã tạo gợi ý mentor cho tất cả các nhóm",
      results: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllTempMatchingByTeacherId,
  addTempMatchingByGid,
  getAvailableMentors,
  getPotentialMentorsByGroupId,
  confirmMatching,
  addTempMatchingForAllGroups,
};
