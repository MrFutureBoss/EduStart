import express from "express";
import userController from "../controllers/userController/index.js";
import { verifyAccessToken, authorize } from "../utilities/jwt.js";
import activityController from "../controllers/activityController/activityController.js";

const userRouters = express.Router();
userRouters.patch(
  "/update_leader",
  verifyAccessToken,
  userController.updateLeaderByTeacher
);
userRouters.get(
  "/class/:classId",
  verifyAccessToken,
  userController.getAllStudentByClassId
);
userRouters.get(
  "/check-group",
  verifyAccessToken,
  userController.checkUserGroup
);
userRouters.get(
  "/check-upcoming-outcomes",
  verifyAccessToken,
  activityController.getGroupUpcomingOutcomes
);
userRouters.get("/profile", verifyAccessToken, userController.userProfile);
userRouters.get("/:id", verifyAccessToken, userController.findUserById);
userRouters.patch("/:id", verifyAccessToken, userController.patchUser);
userRouters.post("/login", userController.getUserLogin);
userRouters.post("/forgot_password", userController.forgotPassword);
userRouters.post("/reset_password", userController.resetPassword);
userRouters.post("/change_password", userController.changePassword);
userRouters.put("/update/:id", userController.updateUser);
userRouters.put(
  "/profile/edit",
  verifyAccessToken,
  userController.editUserProfile
);

// userRouters.get("/parameter", verifyAccessToken,
//     authorize([3, 4]), // Mentor: 3, Student: 4
//     userController.pmtUser
// );

export default userRouters;
