import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { storeOTP } from "./otpStore.js";

dotenv.config();

export function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "EduStart FORGOT PASSWORD RECOVERY",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTP Email Template</title>
</head>
<body>
<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
  <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
    <div style="border-bottom: 1px solid #eee;">
      <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600;">EduStart system</a>
    </div>
    <p style="font-size: 1.1em;">Hi,</p>
    <p>Thank you for choosing EduStart system. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes:</p>
    <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${OTP}</h2>
    <p style="font-size: 0.9em;">Regards,<br />EduStart system</p>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
      <p>FPTU</p>
      <p>Viet Nam</p>
    </div>
  </div>
</div>
</body>
</html>`,
    };
    storeOTP(recipient_email, OTP);

    transporter.sendMail(mail_configs, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
        return reject({ message: `An error has occurred` });
      }
      console.log("Email sent: ", info.response);
      return resolve({ message: "Email sent successfully" });
    });
  });
}

export async function sendEmailToUser(email, password) {
  if (process.env.EMAIL_ENABLED === "false") {
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to: email,
    subject: "Thông tin tài khoản của bạn",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thông tin tài khoản của bạn</title>
</head>
<body>
<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
  <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
    <div style="border-bottom: 1px solid #eee;">
      <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600;">EduStart system</a>
    </div>
    <p style="font-size: 1.1em;">Xin chào,</p>
    <p>Chào mừng bạn đến với hệ thống EduStart. Dưới đây là thông tin tài khoản của bạn:</p>
    <p>Email đăng nhập: <strong>${email}</strong></p>
    <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">Mật khẩu: ${password}</h2>
    <p>Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.</p>
    <p style="font-size: 0.9em;">Trân trọng,<br />Đội ngũ quản trị EduStart</p>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
      <p>FPTU</p>
      <p>Viet Nam</p>
    </div>
  </div>
</div>
</body>
</html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Unable to send email.");
  }
}

export async function sendReminderEmail(email, assignmentTitle, deadline) {
  if (process.env.EMAIL_ENABLED === "false") {
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to: email,
    subject: `Reminder: Assignment ${assignmentTitle} Submission Deadline`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assignment Reminder</title>
</head>
<body>
<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
  <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
    <div style="border-bottom: 1px solid #eee;">
      <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600;">EduStart System</a>
    </div>
    <p style="font-size: 1.1em;">Xin chào,</p>
    <p>Bạn chưa nộp bài tập "<strong>${assignmentTitle}</strong>" mà hạn nộp là vào ngày <strong>${deadline}</strong>. Vui lòng nộp bài sớm để tránh bị trễ hạn.</p>
    <p style="font-size: 1.1em;">Chúng tôi hy vọng bạn sẽ hoàn thành đúng hạn!</p>
    <p style="font-size: 0.9em;">Trân trọng,<br />Đội ngũ quản trị EduStart</p>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
      <p>EduStart System</p>
      <p>FPTU</p>
      <p>Vietnam</p>
    </div>
  </div>
</div>
</body>
</html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw new Error("Unable to send reminder email.");
  }
}
