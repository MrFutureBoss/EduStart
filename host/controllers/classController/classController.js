import classDAO from "../../repositories/classDAO/index.js";
import userDAO from "../../repositories/userDAO/index.js";


const getClassesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let user;
    let result = await classDAO.getClassesByUserId(userId);
    if (result.length === 0) {
      user = await userDAO.findUserById(userId);
      result = user?.classId;
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getClassesByUserId,
};
