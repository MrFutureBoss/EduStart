import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import Investment from "../models/Investment.js";
import User from "../models/userModel.js";
import Project from "../models/projectModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Endpoint to handle Excel file upload and parse investment data
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const file = XLSX.readFile(req.file.path);
    const sheetName = file.SheetNames[0];
    const sheet = file.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const investments = [];
    for (const row of rows) {
      const sponsor = await User.findOne({ username: row.sponsorName, role: 5 });
      const project = await Project.findOne({ name: row.projectName });

      if (sponsor && project) {
        investments.push({
          userId: sponsor._id,
          projectId: project._id,
          amount: row.amount,
          date: row.date || new Date(),
        });
      }
    }

    await Investment.insertMany(investments);
    res.status(200).json({ message: "Investments imported successfully!" });
  } catch (error) {
    console.error("Failed to import investments:", error);
    res.status(500).json({ message: "Failed to import investments.", error: error.message });
  }
});

// Endpoint to fetch all investments
router.get("/", async (req, res) => {
  try {
    const investments = await Investment.find().populate("userId projectId");
    res.status(200).json(investments);
  } catch (error) {
    console.error("Failed to fetch investments:", error);
    res.status(500).json({ message: "Failed to fetch investments." });
  }
});

export default router;
