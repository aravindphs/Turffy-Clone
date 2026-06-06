import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { IUser } from '../models/User.model';
import { IBooking } from '../models/Booking.model';
import { ITurf } from '../models/Turf.model';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendMail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turffy</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #16a34a; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; }
    .btn { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; font-weight: bold; }
    .otp { font-size: 36px; font-weight: bold; color: #16a34a; letter-spacing: 8px; text-align: center; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    td:first-child { font-weight: bold; color: #555; width: 40%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Turffy</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Turffy. All rights reserved.<br>
      Tamil Nadu's Premier Turf Booking Platform
    </div>
  </div>
</body>
</html>
`;

/**
 * Send welcome / verify email.
 */
export const sendWelcomeEmail = async (user: IUser): Promise<void> => {
  const content = `
    <h2>Welcome to Turffy, ${user.name}!</h2>
    <p>We're thrilled to have you on board. You can now discover and book the best sports turfs across Tamil Nadu.</p>
    <p>Start exploring turfs near you and make your first booking today!</p>
    <a href="${env.CLIENT_URL}" class="btn">Explore Turfs</a>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">If you have any questions, feel free to reach out to our support team.</p>
  `;
  await sendMail({
    to: user.email,
    subject: 'Welcome to Turffy!',
    html: baseTemplate(content),
  });
};

/**
 * Send booking confirmation email.
 */
export const sendBookingConfirmation = async (
  user: IUser,
  booking: IBooking,
  turf: ITurf
): Promise<void> => {
  const bookingDate = new Date(booking.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>Booking Confirmed!</h2>
    <p>Hi ${user.name}, your turf booking has been confirmed. See you on the field!</p>
    <table>
      <tr><td>Turf</td><td>${turf.name}</td></tr>
      <tr><td>Address</td><td>${turf.address}, ${turf.city}</td></tr>
      <tr><td>Date</td><td>${bookingDate}</td></tr>
      <tr><td>Time</td><td>${booking.startTime} – ${booking.endTime}</td></tr>
      <tr><td>Duration</td><td>${booking.durationMinutes} minutes</td></tr>
      <tr><td>Amount Paid</td><td>₹${booking.totalAmount.toLocaleString('en-IN')}</td></tr>
      <tr><td>Booking ID</td><td>${(booking._id as mongoose.Types.ObjectId).toString()}</td></tr>
    </table>
    <p>Please arrive 5 minutes before your slot. Carry this booking confirmation.</p>
    <a href="${env.CLIENT_URL}/bookings/${(booking._id as mongoose.Types.ObjectId).toString()}" class="btn">View Booking</a>
  `;
  await sendMail({
    to: user.email,
    subject: `Booking Confirmed – ${turf.name} on ${bookingDate}`,
    html: baseTemplate(content),
  });
};

// Need mongoose for ObjectId type check
import mongoose from 'mongoose';

/**
 * Send booking cancellation email.
 */
export const sendBookingCancellation = async (
  user: IUser,
  booking: IBooking,
  turfName: string
): Promise<void> => {
  const bookingDate = new Date(booking.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${user.name}, your booking has been cancelled.</p>
    <table>
      <tr><td>Turf</td><td>${turfName}</td></tr>
      <tr><td>Date</td><td>${bookingDate}</td></tr>
      <tr><td>Time</td><td>${booking.startTime} – ${booking.endTime}</td></tr>
      <tr><td>Amount</td><td>₹${booking.totalAmount.toLocaleString('en-IN')}</td></tr>
      ${booking.cancellationReason ? `<tr><td>Reason</td><td>${booking.cancellationReason}</td></tr>` : ''}
    </table>
    <p>If a refund was applicable, it will be processed within 5-7 business days to your original payment method.</p>
    <a href="${env.CLIENT_URL}/turfs" class="btn">Book Another Slot</a>
  `;
  await sendMail({
    to: user.email,
    subject: `Booking Cancelled – ${turfName}`,
    html: baseTemplate(content),
  });
};

/**
 * Send OTP for password reset.
 */
export const sendPasswordReset = async (user: IUser, otp: string): Promise<void> => {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${user.name}, you requested a password reset for your Turffy account.</p>
    <p>Your One-Time Password (OTP) is:</p>
    <div class="otp">${otp}</div>
    <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;
  await sendMail({
    to: user.email,
    subject: 'Password Reset OTP – Turffy',
    html: baseTemplate(content),
  });
};

/**
 * Notify turf owner that their turf was approved.
 */
export const sendOwnerTurfApproved = async (owner: IUser, turf: ITurf): Promise<void> => {
  const content = `
    <h2>Your Turf Has Been Approved!</h2>
    <p>Hi ${owner.name}, great news! Your turf <strong>${turf.name}</strong> has been verified and is now live on Turffy.</p>
    <p>Customers across Tamil Nadu can now discover and book your turf.</p>
    <a href="${env.CLIENT_URL}/owner/dashboard" class="btn">View Owner Dashboard</a>
    <p style="margin-top: 16px; font-size: 13px; color: #666;">
      Make sure your availability calendar is up to date to attract more bookings.
    </p>
  `;
  await sendMail({
    to: owner.email,
    subject: `Turf Approved – ${turf.name} is now live!`,
    html: baseTemplate(content),
  });
};

/**
 * Notify turf owner that their turf was rejected.
 */
export const sendOwnerTurfRejected = async (
  owner: IUser,
  turf: ITurf,
  reason: string
): Promise<void> => {
  const content = `
    <h2>Turf Verification Unsuccessful</h2>
    <p>Hi ${owner.name}, unfortunately your turf <strong>${turf.name}</strong> could not be verified at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please update your turf information and resubmit for review.</p>
    <a href="${env.CLIENT_URL}/owner/turf/edit" class="btn">Update Turf Details</a>
    <p style="margin-top: 16px; font-size: 13px; color: #666;">
      If you believe this is a mistake, please contact our support team.
    </p>
  `;
  await sendMail({
    to: owner.email,
    subject: `Turf Verification Update – ${turf.name}`,
    html: baseTemplate(content),
  });
};
