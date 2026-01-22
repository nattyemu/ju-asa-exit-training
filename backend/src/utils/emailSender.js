import nodemailer from "nodemailer";
import "dotenv/config";

export const sendEmail = async (user_email, otp = null, isPasswordResetConfirmation = false) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let subject, html;

    if (isPasswordResetConfirmation) {
      // Password reset confirmation email
      subject = "✅ Password Reset Successful";
      html = `
        <div style="
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          padding: 20px;
        ">
          <div style="
            max-width: 500px;
            background: white;
            margin: auto;
            padding: 25px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          ">
            <h2 style="color: #10b981; text-align:center;">Password Reset Successful</h2>
            <p style="font-size: 16px; color: #333;">
              Hello 👋,<br><br>
              Your password has been successfully reset. You can now login with your new password.
            </p>
            <div style="
              background-color: #d1fae5;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            ">
              <p style="font-size: 16px; margin: 0; color: #065f46;">
                <strong>Security Alert:</strong> If you did not perform this action, please contact support immediately.
              </p>
            </div>
            <p style="text-align:center; color:#999; font-size:13px; margin-top:30px;">
              © ${new Date().getFullYear()} JU ASA exit exam practice. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else {
      // OTP email for password reset
      subject = "🔐 Password Reset OTP";
      html = `
        <div style="
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          padding: 20px;
        ">
          <div style="
            max-width: 500px;
            background: white;
            margin: auto;
            padding: 25px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          ">
            <h2 style="color: #2b6cb0; text-align:center;">Password Reset OTP</h2>
            <p style="font-size: 16px; color: #333;">
              Hello 👋,<br><br>
              You requested to reset your password. Use the OTP below to verify your identity:
            </p>
            <div style="
              background-color: #edf2f7;
              border-left: 4px solid #2b6cb0;
              padding: 15px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 3px;
              color: #2b6cb0;
              margin: 20px 0;
            ">
              ${otp}
            </div>
            <div style="
              background-color: #fff5f5;
              border: 1px solid #fed7d7;
              border-radius: 6px;
              padding: 12px;
              margin: 15px 0;
            ">
              <p style="margin: 0; color: #c53030; font-size: 14px;">
                ⚠️ <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong>.
              </p>
            </div>
            <p style="font-size: 15px; color: #555;">
              If you did not request this password reset, please ignore this email or contact support if you're concerned.
            </p>
            <p style="text-align:center; color:#999; font-size:13px; margin-top:30px;">
              © ${new Date().getFullYear()} JU ASA exit exam practice. All rights reserved.
            </p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"JU ASA Exam System" <${process.env.EMAIL}>`,
      to: user_email,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, message: error.message };
  }
};