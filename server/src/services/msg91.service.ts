import { env } from '../config/env';

const MSG91_BASE_URL = 'https://api.msg91.com/api/v5';

interface SmsOptions {
  to: string;   // Indian phone number with country code: 91XXXXXXXXXX
  message: string;
  senderId?: string;
}

async function sendSms({ to, message, senderId = 'TURFFY' }: SmsOptions): Promise<void> {
  if (!env.MSG91_AUTH_KEY) return; // Skip if not configured

  const phone = to.startsWith('91') ? to : `91${to}`;

  const res = await fetch(`${MSG91_BASE_URL}/flow/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: env.MSG91_BOOKING_TEMPLATE_ID || '',
      short_url: '0',
      recipients: [{
        mobiles: phone,
        VAR1: message.substring(0, 40), // template variable
      }],
    }),
  });

  if (!res.ok) {
    console.error('MSG91 SMS failed:', await res.text());
  }

  // senderId is used per-template on MSG91; included for future use
  void senderId;
}

export async function sendBookingConfirmationSms(
  phone: string,
  turfName: string,
  date: string,
  startTime: string,
  endTime: string,
  amount: number
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Booking confirmed at ${turfName} on ${date} ${startTime}-${endTime}. Amount: ₹${amount}. - Turffy`,
  });
}

export async function sendBookingCancellationSms(
  phone: string,
  turfName: string,
  date: string,
  refundAmount: number
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Booking at ${turfName} on ${date} cancelled.${refundAmount > 0 ? ` Refund ₹${refundAmount} initiated.` : ''} - Turffy`,
  });
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) return;

  const phoneWithCode = phone.startsWith('91') ? phone : `91${phone}`;

  await fetch(`${MSG91_BASE_URL}/flow/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: env.MSG91_OTP_TEMPLATE_ID,
      short_url: '0',
      recipients: [{
        mobiles: phoneWithCode,
        OTP: otp,
      }],
    }),
  });
}
