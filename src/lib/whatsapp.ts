// WhatsApp notification helpers using wa.me deep links

const WHATSAPP_NUMBER = "919415026522"; // GoBhraman contact number

export interface BookingDetails {
  userName: string;
  tripName: string;
  advanceAmount: number;
  remainingAmount: number;
  bookingId: string;
  phone?: string;
}

// Clean phone number and add country code
export const cleanPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
};

// Generic WhatsApp link generator
export const getWhatsAppUserLink = (phone: string, message: string): string => {
  const phoneWithCountry = cleanPhoneNumber(phone);
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
};

// Open WhatsApp with message
export const openWhatsApp = (phone: string, message: string) => {
  window.open(getWhatsAppUserLink(phone, message), '_blank');
};

// ========== BOOKING CREATED MESSAGE ==========
export const getBookingCreatedMessage = (details: BookingDetails): string => {
  return `Hi ${details.userName} 👋

Your booking for *${details.tripName}* has been created.

📋 Booking ID: ${details.bookingId}
💰 Amount to Pay: ₹${details.advanceAmount.toLocaleString()}

Please complete the payment to confirm your seat.

– Team GoBhraman`;
};

export const openWhatsAppBookingCreated = (phone: string, details: BookingDetails) => {
  openWhatsApp(phone, getBookingCreatedMessage(details));
};

// ========== PAYMENT SCREENSHOT UPLOADED MESSAGE ==========
export const getPaymentUploadedMessage = (userName: string, tripName: string): string => {
  return `Hi ${userName},

We have received your payment screenshot for *${tripName}*.

Our team is verifying it and will update you shortly.

– Team GoBhraman`;
};

export const openWhatsAppPaymentUploaded = (phone: string, userName: string, tripName: string) => {
  openWhatsApp(phone, getPaymentUploadedMessage(userName, tripName));
};

// ========== ADVANCE PAYMENT VERIFIED / BOOKING CONFIRMED MESSAGE ==========
export const getAdvanceVerifiedMessage = (details: BookingDetails): string => {
  return [
    `Hi ${details.userName} 👋`,
    ``,
    `🎉 Your payment for *${details.tripName}* has been successfully verified and your booking is now confirmed!`,
    ``,
    `🧾 Booking ID: ${details.bookingId}`,
    `💳 Amount Received: ₹${details.advanceAmount.toLocaleString()}`,
    details.remainingAmount > 0
      ? `💰 Balance Due: ₹${details.remainingAmount.toLocaleString()}`
      : null,
    ``,
    `Thank you for choosing GoBhraman 💙`,
    `We're excited to have you join us for this experience!`,
    ``,
    `Further trip details, reporting instructions, and important updates will be shared with you shortly.`,
    ``,
    `For any assistance, feel free to reach out anytime.`,
    `— Team GoBhraman`,
  ].filter(Boolean).join("\n");
};

export const openWhatsAppAdvanceVerified = (phone: string, details: BookingDetails) => {
  openWhatsApp(phone, getAdvanceVerifiedMessage(details));
};

// ========== FULLY PAID MESSAGE ==========
export const getFullyPaidMessage = (details: BookingDetails): string => {
  return [
    `Hi ${details.userName} 👋`,
    ``,
    `🎉 Your payment for *${details.tripName}* has been successfully verified and your booking is now *fully paid & confirmed*!`,
    ``,
    `🧾 Booking ID: ${details.bookingId}`,
    `💳 Total Received: ₹${(details.advanceAmount + details.remainingAmount).toLocaleString()}`,
    ``,
    `Thank you for choosing GoBhraman 💙`,
    `We're excited to have you join us for this experience!`,
    ``,
    `Further trip details, reporting instructions, and important updates will be shared with you shortly.`,
    ``,
    `For any assistance, feel free to reach out anytime.`,
    `— Team GoBhraman`,
  ].join("\n");
};

export const openWhatsAppFullyPaid = (phone: string, details: BookingDetails) => {
  openWhatsApp(phone, getFullyPaidMessage(details));
};

// ========== PAYMENT REMINDER MESSAGE ==========
export const getPaymentReminderMessage = (details: BookingDetails): string => {
  return `⏰ Payment Reminder – GoBhraman

Hi ${details.userName},

This is a reminder to complete your payment for *${details.tripName}*.

📋 Booking ID: ${details.bookingId}
💳 Pending Amount: ₹${details.remainingAmount.toLocaleString()}

Please complete the payment to avoid cancellation.

– Team GoBhraman`;
};

export const openWhatsAppReminder = (phone: string, details: BookingDetails) => {
  openWhatsApp(phone, getPaymentReminderMessage(details));
};

// ========== CUSTOM MESSAGE ==========
export const openWhatsAppCustom = (phone: string, message: string) => {
  openWhatsApp(phone, message);
};

// ========== PREDEFINED MESSAGE TYPES ==========
export type MessageType = 
  | 'booking_created' 
  | 'payment_uploaded' 
  | 'advance_verified' 
  | 'fully_paid' 
  | 'reminder' 
  | 'custom';

export const getMessageByType = (type: MessageType, details: BookingDetails, customMessage?: string): string => {
  switch (type) {
    case 'booking_created':
      return getBookingCreatedMessage(details);
    case 'payment_uploaded':
      return getPaymentUploadedMessage(details.userName, details.tripName);
    case 'advance_verified':
      return getAdvanceVerifiedMessage(details);
    case 'fully_paid':
      return getFullyPaidMessage(details);
    case 'reminder':
      return getPaymentReminderMessage(details);
    case 'custom':
      return customMessage || '';
    default:
      return '';
  }
};

// Legacy exports for backward compatibility
export const getWhatsAppAdvanceVerifiedLink = (details: BookingDetails): string => {
  return getWhatsAppUserLink(details.phone || '', getAdvanceVerifiedMessage(details));
};

export const getWhatsAppFullyPaidLink = (details: BookingDetails): string => {
  return getWhatsAppUserLink(details.phone || '', getFullyPaidMessage(details));
};
