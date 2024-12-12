import mongoose from "mongoose";
import Profession from "../../models/professionModel.js";
import Specialty from "../../models/specialtyModel.js";

const getAllProfessionsAndSpecialty = async (status, skip, limit, search) => {
  try {
    let query = {};
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const result = await Profession.find(query)
      .populate({
        path: "specialty",
        model: "Specialty",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await Profession.countDocuments({});
    return { data: result, total };
  } catch (error) {
    throw new Error(error);
  }
};


const getProfessionById = async (id) => {
  try {
    const profession = await Profession.findById(id)
      .populate("specialty")
      .exec();

    if (!profession) {
      throw new Error("Profession not found");
    }

    return profession;
  } catch (error) {
    throw new Error(error);
  }
};

const getAllSpecialtyByProfessionID = async (professionId) => {
  try {
    const profession = await Profession.findById(professionId)
      .populate("specialty")
      .exec();

    if (!profession) {
      throw new Error("Không tìm thấy lĩnh vực với ID này");
    }

    const specialties = profession.specialty;
    const totalSpecialties = specialties.length;

    return {
      data: specialties,
      total: totalSpecialties,
    };
  } catch (error) {
    throw new Error(
      `Error finding specialties for profession: ${error.message}`
    );
  }
};

const findProfessionAndSpecialtyByName = async (name) => {
  try {
    // Chuyển tên tìm kiếm về dạng lowercase
    const lowerCaseName = name.toLowerCase();

    // Tìm profession với tên chính xác, không phân biệt hoa thường
    const professions = await Profession.find({
      $expr: { $eq: [{ $toLower: "$name" }, lowerCaseName] }, // So sánh chính xác nhưng không phân biệt hoa thường
    });

    // Tìm specialty với tên chính xác, không phân biệt hoa thường
    const specialties = await Specialty.find({
      $expr: { $eq: [{ $toLower: "$name" }, lowerCaseName] }, // So sánh chính xác nhưng không phân biệt hoa thường
    });

    // Kiểm tra nếu cả professions và specialties đều trống
    if (professions.length === 0 && specialties.length === 0) {
      throw new Error(
        "Không tìm thấy lĩnh vực hoặc chuyên môn nào khớp với tên."
      );
    }

    return {
      professions,
      specialties,
    };
  } catch (error) {
    throw new Error(`Error finding profession and specialty: ${error.message}`);
  }
};

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD") // Tách các ký tự Unicode tổ hợp (dấu)
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D") // Thay thế 'đ' thành 'd'
    .toLowerCase(); // Chuyển thành chữ thường
};

const searchProfessionsAndSpecialtiesByName = async (name) => {
  try {
    const searchRegex = new RegExp(name, "i"); // Tạo regex để tìm kiếm theo chuỗi con không phân biệt chữ hoa/thường

    // Tìm tất cả các profession có tên chứa chuỗi tìm kiếm
    const professions = await Profession.find({
      name: { $regex: searchRegex },
    });

    // Tìm tất cả các specialty có tên chứa chuỗi tìm kiếm
    const specialties = await Specialty.find({
      name: { $regex: searchRegex },
    });

    // Kiểm tra nếu không tìm thấy profession hoặc specialty nào
    if (professions.length === 0 && specialties.length === 0) {
      throw new Error(
        "Không tìm thấy lĩnh vực hoặc chuyên môn nào khớp với chuỗi tìm kiếm."
      );
    }

    return {
      professions,
      specialties,
    };
  } catch (error) {
    throw new Error(
      `Error finding profession and specialty by search: ${error.message}`
    );
  }
};

const createNewProfessionAndSpecialty = async (name, specialties, status) => {
  if (!name) {
    throw new Error("Tên lĩnh vực không được để trống");
  }
  if (name.length < 2) {
    throw new Error("Tên lĩnh vực không đúng định dạng");
  }
  try {
    const existingProfession = await Profession.findOne({ name });
    if (existingProfession) {
      throw new Error("Lĩnh vực đã tồn tại");
    }

    const specialtyDocs = await Promise.all(
      specialties.map(async (specialty) => {
        const createdSpecialty = await Specialty.create(specialty);
        return createdSpecialty._id;
      })
    );

    const newProfession = await Profession.create({
      name,
      status,
      specialty: specialtyDocs,
    });

    return newProfession;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateProfession = async (id, values) => {
  try {
    return await Profession.findByIdAndUpdate(id, values).exec();
  } catch (error) {
    throw new Error(error);
  }
};

const updateProfessionAndSpecialty = async (
  professionId,
  professionData,
  specialtiesData
) => {
  try {
    // Cập nhật profession
    const updatedProfession = await Profession.findByIdAndUpdate(
      professionId,
      { ...professionData },
      { new: true }
    );

    if (!updatedProfession) {
      throw new Error("Profession not found");
    }

    // Xử lý specialties
    const specialtyIds = [];
    for (const specialtyData of specialtiesData) {
      if (specialtyData._id) {
        const updatedSpecialty = await Specialty.findByIdAndUpdate(
          specialtyData._id,
          { ...specialtyData },
          { new: true }
        );
        specialtyIds.push(updatedSpecialty._id);
      } else {
        // Nếu không có _id, thêm chuyên môn mới
        const newSpecialty = new Specialty({ ...specialtyData });
        const savedSpecialty = await newSpecialty.save();
        specialtyIds.push(savedSpecialty._id);
      }
    }

    // Gán lại danh sách specialties cho profession
    updatedProfession.specialty = specialtyIds;
    await updatedProfession.save();

    return updatedProfession;
  } catch (error) {
    throw new Error(error.message);
  }
};

const patchProfession = async (id, values) => {
  try {
    return await Profession.findByIdAndUpdate(
      id,
      { $set: values },
      { new: true }
    ).exec();
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteProfessionAndSpecialties = async (professionId) => {
  try {
    const profession = await Profession.findById(professionId).populate(
      "specialty"
    );

    if (!profession) {
      throw new Error("Profession not found");
    }

    const specialtyIds = profession.specialty.map((s) => s._id);
    await Specialty.deleteMany({ _id: { $in: specialtyIds } });
    await Profession.findByIdAndDelete(professionId);
    return {
      message: "Profession and related specialties deleted successfully",
    };
  } catch (error) {
    throw new Error(`Error deleting profession: ${error.message}`);
  }
};

const getAllProfessionsWithSpecialties = async () => {
  try {
    const professions = await Profession.find({ status: true })
      .populate({
        path: "specialty",
        match: { status: true },
      })
      .sort({ name: 1 })
      .exec();

    return professions;
  } catch (error) {
    throw new Error(
      `Error fetching professions with specialties: ${error.message}`
    );
  }
};
const createMultipleProfessions = async (professionsData) => {
  try {
    const createdProfessions = [];

    for (const professionData of professionsData) {
      const { name, specialties = [], status } = professionData;

      // Kiểm tra profession đã tồn tại
      const existingProfession = await Profession.findOne({ name });
      if (existingProfession) {
        throw new Error(`Profession "${name}" đã tồn tại.`);
      }

      // Tạo specialties nếu có
      const specialtyIds = await Promise.all(
        specialties.map(async (specialty) => {
          const existingSpecialty = await Specialty.findOne({
            name: specialty.name,
          });
          if (existingSpecialty) {
            return existingSpecialty._id; // Sử dụng specialty đã tồn tại
          }
          const newSpecialty = await Specialty.create(specialty);
          return newSpecialty._id;
        })
      );

      // Tạo profession
      const newProfession = await Profession.create({
        name,
        status,
        specialty: specialtyIds,
      });

      createdProfessions.push(newProfession);
    }

    return createdProfessions;
  } catch (error) {
    throw new Error(`Error creating professions: ${error.message}`);
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
  getAllProfessionsWithSpecialties,
  createMultipleProfessions,
};
