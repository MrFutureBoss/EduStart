import userDAO from "../../repositories/userDAO/index.js";
import { clearOTP, verifyOTP } from "../../utilities/otpStore.js";
import { sendEmail } from "../../utilities/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const getUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await userDAO.loginUser({ email, password });
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ token, user });
  } catch (error) {
    if (error.message === "Wrong password.") {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === "User not found.") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const userProfile = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).send("Access denied");
  }

  const tokenString = token.split(" ")[1];

  try {
    const decoded = jwt.verify(tokenString, process.env.SECRETKEY);
    req.user = decoded;

    if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
      return res.status(400).json({ error: "Invalid user ID format in token" });
    }

    const result = await userDAO.findUserById(
      new mongoose.Types.ObjectId(decoded._id)
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in userProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const emailExist = await userDAO.findUser({ email });
  if (!emailExist) {
    return res.status(404).send("Email not found");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  sendEmail({ recipient_email: email, OTP: otp })
    .then((response) => res.send(response.message))
    .catch((error) => {
      console.error("Email sending error: ", error);
      res.status(500).send(error.message);
    });
};

const resetPassword = async (req, res) => {
  const { email, newPassword, otp } = req.body;
  try {
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const result = verifyOTP(email, otp);
    if (!result.valid) {
      return res.status(400).send(result.message);
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be longer than 6 characters" });
    }
    clearOTP(email);
    await userDAO.updateUserPassword(user._id, newPassword);
    res
      .status(200)
      .json({ message: "Password successfully updated", newPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body; // Get email, old password, and new password from request

  try {
    const result = await userDAO.changePassword(
      email,
      oldPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const findUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userDAO.findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStudentByClassId = async (req, res) => {
  const { classId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const skip = req.query.skip ? parseInt(req.query.skip) : null;

  try {
    const { students, total } = await userDAO.getAllStudentByClassId(classId, limit, skip);
    
    if (!students.length) {
      return res.status(404).json({ message: "No students found in this class." });
    }
    
    res.status(200).json({
      students,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getUserLogin,
  forgotPassword,
  resetPassword,
  findUserById,
  changePassword,
  userProfile,
  getAllStudentByClassId,
};
