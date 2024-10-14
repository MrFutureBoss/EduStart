import specialtyDAO from "../../repositories/specialtyDAO/index.js";

const getAllSpecialties = async (req, res, next) => {
  try {
    const { status, skip, limit, search } = req.query;
    res.send(
      await specialtyDAO.getAllSpecialties(
        Number.parseInt(skip || 0),
        Number.parseInt(limit || 0),
        search
      )
    );
  } catch (error) {
    next(error);
  }
};


const createNewSpecialty = async (req, res, next) => {
  try {
    const { specialties } = req.body;  // Expecting an array of specialties

    // If "specialties" is an array, handle bulk creation
    if (Array.isArray(specialties) && specialties.length > 0) {
      res.send(await specialtyDAO.createMultipleSpecialties(specialties));
    } else {
      // If it's not an array, return an error or handle it for single specialty creation
      res.status(400).send({ message: "Invalid input, please provide an array of specialties." });
    }
  } catch (error) {
    next(error);
  }
};


const updateSpecialty = async (req, res, next) => {
  try {
    const { status, name } = req.body;
    const { id } = req.params;
    res.send(await specialtyDAO.updateSpecialty(id, { status, name }));
  } catch (error) {
    next(error);
  }
};
const deleteSpecialty = async (req, res, next) => {
  try {
    const { id } = req.params;
    res.send(await specialtyDAO.deleteSpecialty(id));
  } catch (error) {
    next(error);
  }
};
export default {
  getAllSpecialties,
  createNewSpecialty,
  updateSpecialty,
  deleteSpecialty,
};
