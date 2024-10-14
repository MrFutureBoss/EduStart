const otpStore = {};

export const storeOTP = (email, otp) => {
  otpStore[email] = {
    otp,
    expiry: Date.now() + 5 * 60 * 1000,
  };
};

export const verifyOTP = (email, otp) => {
  const otpData = otpStore[email];
  console.log("Đang xác minh OTP:", otp, "Đã lưu:", otpData);

  if (!otpData) {
    return { valid: false, message: "OTP not found" };
  }

  if (otpData.otp.toString() !== otp.toString()) {
    return { valid: false, message: "Invalid OTP" };
  }

  if (Date.now() > otpData.expiry) {
    return { valid: false, message: "OTP expired" };
  }

  return { valid: true, message: "OTP is valid" };
};

export const clearOTP = (email) => {
  delete otpStore[email];
};
