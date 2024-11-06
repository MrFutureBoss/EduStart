import xlsx from "xlsx";
import Project from "../models/projectModel.js";
import User from "../models/userModel.js";

// Import investment projects from an Excel file
export const importInvestmentProjects = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Loop through the parsed data and save each investment project
    const importedProjects = [];
    for (const item of data) {
      const sponsor = await User.findOne({ email: item.sponsorEmail, role: 5 }); // role 5 = sponsor
      if (!sponsor) continue;

      const project = await Project.findOne({ name: item.projectName });
      if (!project) continue;

      importedProjects.push({ sponsor: sponsor._id, project: project._id });
    }

    await Investment.insertMany(importedProjects); // Save all at once
    res.status(200).json({ message: "Investment projects imported successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error importing investment projects", error });
  }
};

// Retrieve all investment projects
export const getAllInvestmentProjects = async (req, res) => {
  try {
    const investments = await Investment.find()
      .populate("sponsor", "username email") // Get sponsor details
      .populate("project", "name description"); // Get project details
    res.status(200).json(investments);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving investment projects", error });
  }
};
