import mongoose from "mongoose";
import Profession from "../../models/professionModel.js";
import Specialty from "../../models/SpecialtyModel.js";

const getAllProfessions = async (status, skip, limit, search) => {
  try {
    let query = {};
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };
    const result = await Profession.find(query)
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
    const profession = await Profession.findById(professionId).populate('specialty').exec();

    if (!profession) {
      throw new Error('Không tìm thấy lĩnh vực với ID này');
    }

    const specialties = profession.specialty;
    const totalSpecialties = specialties.length;

    return {
      data: specialties,
      total: totalSpecialties
    };
  } catch (error) {
    throw new Error(`Error finding specialties for profession: ${error.message}`);
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

const createNewProfession = async (name, specialties, status) => {
  try {
    // Kiểm tra xem profession với tên này đã tồn tại chưa
    const existingProfession = await Profession.findOne({ name });
    if (existingProfession) {
      // Ném lỗi với thông báo cụ thể
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
    throw new Error(error.message); // Ném lại lỗi với message cụ thể
  }
};

const updateProfession = async (id, values) => {
  try {
    return await Profession.findByIdAndUpdate(id, values).exec();
  } catch (error) {
    throw new Error(error);
  }
};


const updateProfessionAndSpecialty = async (professionId, professionData, specialtiesData) => {
  const session = await mongoose.startSession(); // Dùng session để thực hiện transaction
  session.startTransaction();

  try {
    // Cập nhật profession
    const updatedProfession = await Profession.findByIdAndUpdate(
      professionId,
      { ...professionData }, 
      { new: true, session }
    );

    if (!updatedProfession) {
      throw new Error('Profession not found');
    }

    // Xử lý specialties
    const specialtyIds = [];
    for (const specialtyData of specialtiesData) {
      if (specialtyData._id) {
        const updatedSpecialty = await Specialty.findByIdAndUpdate(
          specialtyData._id,
          { ...specialtyData },
          { new: true, session }
        );
        specialtyIds.push(updatedSpecialty._id);
      } else {
        // Nếu không có _id, thêm chuyên môn mới
        const newSpecialty = new Specialty({ ...specialtyData });
        const savedSpecialty = await newSpecialty.save({ session });
        specialtyIds.push(savedSpecialty._id);
      }
    }

    // Gán lại danh sách specialties cho profession
    updatedProfession.specialty = specialtyIds;
    await updatedProfession.save({ session });

    // Commit transaction sau khi tất cả các thao tác thành công
    await session.commitTransaction();
    session.endSession();

    return updatedProfession;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
