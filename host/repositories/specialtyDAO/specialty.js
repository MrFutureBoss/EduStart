import mongoose from "mongoose";
import Specialty from "../../models/SpecialtyModel.js";

const getAllSpecialties = async (status, skip, limit, search) => {
  try {
    let query = {};
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const result = await Specialty.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await Specialty.countDocuments(query);  // Adjust query in count as well
    return { data: result, total };
  } catch (error) {
    throw new Error(error);
  }
};

const getSpecialtiesById = async () => {
  try {
  } catch (error) {
    throw new Error(error);
  }
};

const createNewSpecialty = async (name) => {
  try {
    return await Specialty.create({ name });
  } catch (error) {
    throw new Error(error);
  }
};

const createMultipleSpecialties = async (specialties) => {
  try {
    if (!Array.isArray(specialties)) {
      throw new Error("Input should be an array of specialties.");
    }

    const newSpecialties = await Promise.all(
      specialties.map(({ name, status }) => {
        return Specialty.create({ name, status });
      })
    );

    return newSpecialties; 
  } catch (error) {
    throw new Error(error);
  }
};



const updateSpecialty = async (id, values) => {
  try {
    return await Specialty.findByIdAndUpdate(id, values).exec();
  } catch (error) {
    throw new Error(error);
  }
};

const deleteSpecialty = async (id) => {
  try {
    return await Specialty.findByIdAndDelete(id);
  } catch (error) {
    throw new Error(error);
  }
};

export default {
  getAllSpecialties,
  getSpecialtiesById,
  createNewSpecialty,
  createMultipleSpecialties,
  updateSpecialty,
  deleteSpecialty,
};
