import express from "express";
import userController from "../controllers/userController/index.js";
import { verifyAccessToken, authorize } from "../utilities/jwt.js";


const userRouters = express.Router();

userRouters.post("/login", userController.getUserLogin);
userRouters.post("/forgot_password", userController.forgotPassword);
userRouters.post("/reset_password", userController.resetPassword);
userRouters.post("/change_password", userController.changePassword);

// userRouters.get("/parameter", verifyAccessToken,
//     authorize([3, 4]), // Mentor: 3, Student: 4
//     userController.pmtUser
// );

export default userRouters;
