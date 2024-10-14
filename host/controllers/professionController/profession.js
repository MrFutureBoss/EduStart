import professionDAO from "../../repositories/professionDAO/index.js";
import mongoose from "mongoose";

const getAllProfessions = async (req, res, next) => {
  try {
    const { status, search, limit = 10, page = 1 } = req.query;
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const skip = (pageInt - 1) * limitInt;
    const professions = await professionDAO.getAllProfessions(
      status,
      skip,
      limitInt,
      search
    );
    res.status(200).json(professions);
  } catch (error) {
    next(error);
  }
};

const getProfessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profession = await professionDAO.getProfessionById(id);

    if (!profession) {
      return res.status(404).json({ message: "Profession not found" });
    }

    res.status(200).json(profession);
  } catch (error) {
    next(error);
  }
};

const getAllSpecialtyByProfessionID = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const result = await professionDAO.getAllSpecialtyByProfessionID(id);
    res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const findProfessionAndSpecialtyByName = async (req, res, next) => {
  try {
    const { name } = req.query; // Lấy 'name' từ query params

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Tên cần có ít nhất 2 ký tự" });
    }

    const result = await professionDAO.findProfessionAndSpecialtyByName(name);

    res.status(200).json(result); // Trả về kết quả
  } catch (error) {
    // Trả về message không tìm thấy hoặc lỗi khác từ DAO
    return res.status(404).json({ message: error.message });
  }
};


const createNewProfession = async (req, res, next) => {
  try {
    const { name, specialties, status } = req.body;
    const newProfession = await professionDAO.createNewProfession(
      name,
      specialties,
      status
    );
    res.status(201).send(newProfession);
  } catch (error) {
    // Trả về thông báo lỗi từ error.message
    return res.status(400).json({ message: error.message });
  }
};

const updateProfessionAndSpecialty = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { name, status, specialties } = req.body; 

    const updatedProfession = await professionDAO.updateProfessionAndSpecialty(
      id, // Profession ID
      { name, status },
      specialties
    );

    res.status(200).json(updatedProfession);
  } catch (error) {
    next(error);
  }
};

const updateProfession = async (req, res, next) => {
  try {
    const { status, name } = req.body;
    const { id } = req.params;
    res.send(await professionDAO.updateProfession(id, { status, name }));
  } catch (error) {
    next(error);
  }
};

const patchProfession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    res.send(await professionDAO.patchProfession(id, updateFields));
  } catch (error) {
    next(error);
  }
};

const deleteProfessionAndSpecialties = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await professionDAO.deleteProfessionAndSpecialties(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllProfessions,
  getProfessionById,
  getAllSpecialtyByProfessionID,
  findProfessionAndSpecialtyByName,
  createNewProfession,
  updateProfessionAndSpecialty,
  updateProfession,
  deleteProfessionAndSpecialties,
  patchProfession,
};
