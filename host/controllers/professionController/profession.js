import professionDAO from "../../repositories/professionDAO/index.js";
import mongoose from "mongoose";

const getAllProfessionsAndSpecialty = async (req, res, next) => {
  try {
    const { status, search, limit = 10, page = 1 } = req.query;
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const skip = (pageInt - 1) * limitInt;
    const professions = await professionDAO.getAllProfessionsAndSpecialty(
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

//Hàm này phục vụ thanh search
const searchProfessionsAndSpecialtiesByName = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name || name.length < 2) {
      return res
        .status(400)
        .json({ message: "Tên tìm kiếm cần có ít nhất 2 ký tự" });
    }

    const result = await professionDAO.searchProfessionsAndSpecialtiesByName(
      name
    );

    res.status(200).json(result); // Trả về kết quả tìm kiếm
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const createNewProfessionAndSpecialty = async (req, res, next) => {
  try {
    const { name, specialties, status } = req.body;
    const newProfession = await professionDAO.createNewProfessionAndSpecialty(
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

const getProfessionsAndSpecialties = async (req, res) => {
  try {
    const professionsWithSpecialties =
      await professionDAO.getAllProfessionsWithSpecialties();
    res.status(200).json(professionsWithSpecialties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createProfessionsInBulk = async (req, res, next) => {
  try {
    const professionsData = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(professionsData) || professionsData.length === 0) {
      return res.status(400).json({
        message:
          "Dữ liệu không hợp lệ. Hãy cung cấp một danh sách các professions.",
      });
    }

    // Tạo professions và specialties
    const createdProfessions = await professionDAO.createMultipleProfessions(
      professionsData
    );

    res.status(201).json({
      message: "Đã tạo professions thành công.",
      data: createdProfessions,
    });
  } catch (error) {
    res.status(400).json({
      message: `Có lỗi xảy ra khi tạo professions: ${error.message}`,
    });
  }
};

export default {
  getAllProfessionsAndSpecialty,
  getProfessionById,
  getAllSpecialtyByProfessionID,
  findProfessionAndSpecialtyByName,
  searchProfessionsAndSpecialtiesByName,
  createNewProfessionAndSpecialty,
  updateProfessionAndSpecialty,
  updateProfession,
  deleteProfessionAndSpecialties,
  patchProfession,
  getProfessionsAndSpecialties,
  createProfessionsInBulk,
};
