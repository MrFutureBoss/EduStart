import express from "express";
import userController from "../controllers/userController/index.js";
import { verifyAccessToken, authorize } from "../utilities/jwt.js";

const userRouters = express.Router();
userRouters.get(
  "/class/:classId",
  verifyAccessToken,
  userController.getAllStudentByClassId
);

userRouters.patch("/:id", verifyAccessToken, userController.patchUser);
userRouters.put("/update/:id", verifyAccessToken, userController.updateUser);
// Change request endpoints
userRouters.post(
  "/change-request",
  verifyAccessToken,
  userController.createChangeRequest
);
userRouters.get(
  "/change-requests/:userId",
  verifyAccessToken,
  userController.getUserChangeRequests
);


userRouters.get("/profile", verifyAccessToken, userController.userProfile);
userRouters.get("/:id", verifyAccessToken, userController.findUserById);
userRouters.patch("/:id", verifyAccessToken, userController.patchUser);
userRouters.post("/login", userController.getUserLogin);
userRouters.post("/forgot_password", userController.forgotPassword);
userRouters.post("/reset_password", userController.resetPassword);
userRouters.post("/change_password", userController.changePassword);
userRouters.put("/update/:id", userController.updateUser);

// userRouters.get("/parameter", verifyAccessToken,
//     authorize([3, 4]), // Mentor: 3, Student: 4
//     userController.pmtUser
// );

export default userRouters;
