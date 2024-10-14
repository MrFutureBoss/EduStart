// routes/groupRoutes.js
import express from "express";
import teacherController from "../controllers/teacherController/index.js";

const teacherRouter = express.Router();

teacherRouter.get("/groups/:teacherId", teacherController.getGroupsByTeacher);

export default teacherRouter;
