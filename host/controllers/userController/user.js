import userDAO from "../../repositories/userDAO/index.js";
import { clearOTP, verifyOTP } from "../../utilities/otpStore.js";
import { sendEmail } from "../../utilities/email.js";

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

export default {
  getUserLogin,
  forgotPassword,
  resetPassword,
};
