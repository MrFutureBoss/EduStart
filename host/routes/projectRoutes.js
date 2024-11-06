// routes/projectRoutes.js
import express from "express";
import Project from "../models/projectModel.js";

const router = express.Router();

router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json({ data: projects });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error });
  }
});

export default router;
