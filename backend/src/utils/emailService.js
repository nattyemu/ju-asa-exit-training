import nodemailer from "nodemailer";
import "dotenv/config";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email with HTML template
 */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"JU-ASA EXIT exam practice" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Exam reminder email template
 */
export const sendExamReminder = async (userEmail, examDetails) => {
  const { studentName, examTitle, startTime, endTime, duration } = examDetails;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50; text-align: center;">📚 Exam Reminder</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #3498db; margin-top: 0;">${examTitle}</h3>
        <p><strong>⏰ Available:</strong> ${new Date(
          startTime
        ).toLocaleString()}</p>
        <p><strong>⏳ Deadline:</strong> ${new Date(
          endTime
        ).toLocaleString()}</p>
        <p><strong>⌛ Duration:</strong> ${duration} minutes</p>
      </div>
      
      <p>Please make sure to complete the exam before the deadline.</p>
      <p>Good luck! 🍀</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
        This is an automated message from the JU ASA Exam Management System.
      </p>
    </div>
  `;

  return await sendEmail(userEmail, `Reminder: ${examTitle} Exam`, htmlContent);
};

/**
 * Deadline warning email template
 */
export const sendDeadlineWarning = async (userEmail, examDetails) => {
  const { studentName, examTitle, endTime, timeLeft } = examDetails;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #e74c3c; text-align: center;">⏰ Deadline Approaching!</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="color: #856404; margin-top: 0;">${examTitle}</h3>
        <p><strong>⏳ Time remaining:</strong> ${timeLeft}</p>
        <p><strong>📅 Deadline:</strong> ${new Date(
          endTime
        ).toLocaleString()}</p>
      </div>
      
      <p>Please complete the exam before the deadline to avoid automatic submission.</p>
      <p>Best of luck! 🎯</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
        This is an automated reminder from the JU ASA Exam Management System.
      </p>
    </div>
  `;

  return await sendEmail(
    userEmail,
    `Urgent: ${examTitle} Deadline Approaching`,
    htmlContent
  );
};

/**
 * System announcement email template
 */
export const sendSystemAnnouncement = async (userEmail, announcement) => {
  const { title, message, sentBy } = announcement;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #27ae60; text-align: center;">📢 System Announcement</h2>
      
      <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2980b9; margin-top: 0;">${title}</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      </div>
      
      <p style="text-align: right; font-style: italic;">- ${
        sentBy || "System Administrator"
      }</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
        This is an official announcement from the JU ASA Exam Management System.
      </p>
    </div>
  `;

  return await sendEmail(userEmail, `Announcement: ${title}`, htmlContent);
};
/**
 * Unstarted exam reminder email template
 */
export const sendUnstartedExamReminder = async (userEmail, examDetails) => {
  const { studentName, examTitle, endTime, timeLeft } = examDetails;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #e67e22; text-align: center;">📝 Exam Reminder</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      
      <div style="background-color: #fef9e7; border-left: 4px solid #f1c40f; padding: 15px; margin: 20px 0;">
        <h3 style="color: #d35400; margin-top: 0;">${examTitle}</h3>
        <p><strong>⏰ Status:</strong> You haven't started this exam yet</p>
        <p><strong>📅 Deadline:</strong> ${new Date(
          endTime
        ).toLocaleString()}</p>
        <p><strong>⏳ Time left:</strong> ${timeLeft}</p>
      </div>
      
      <p>Please log in to your account and complete the exam before the deadline.</p>
      <p>Don't miss this opportunity to test your knowledge! 📚</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/dashboard" 
           style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
        This is an automated reminder from the JU ASA Exam Management System.
      </p>
    </div>
  `;

  return await sendEmail(
    userEmail,
    `Reminder: You haven't started ${examTitle}`,
    htmlContent
  );
};
export default {
  sendEmail,
  sendExamReminder,
  sendDeadlineWarning,
  sendSystemAnnouncement,
  sendUnstartedExamReminder,
};
