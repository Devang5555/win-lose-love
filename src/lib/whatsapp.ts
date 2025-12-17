// WhatsApp notification helpers using wa.me deep links

const WHATSAPP_NUMBER = "919415026522"; // GoBhraman contact number

export interface BookingDetails {
  userName: string;
  tripName: string;
  advanceAmount: number;
  remainingAmount: number;
  bookingId: string;
}

export const getWhatsAppAdvanceVerifiedLink = (details: BookingDetails): string => {
  const message = encodeURIComponent(
    `Hi ${details.userName},\n\n` +
    `✅ Your advance payment for *${details.tripName}* has been verified!\n\n` +
    `📋 Booking ID: ${details.bookingId}\n` +
    `💰 Advance Paid: ₹${details.advanceAmount.toLocaleString()}\n` +
    `💳 Remaining Balance: ₹${details.remainingAmount.toLocaleString()}\n\n` +
    `Thank you for booking with GoBhraman! 🌊\n\n` +
    `For any queries, feel free to reach out.`
  );
  return `https://wa.me/${details.userName.replace(/\D/g, '')}?text=${message}`;
};

export const getWhatsAppFullyPaidLink = (details: BookingDetails): string => {
  const message = encodeURIComponent(
    `🎉 Booking Confirmed!\n\n` +
    `Hi ${details.userName},\n\n` +
    `Your booking for *${details.tripName}* is fully paid! ✨\n\n` +
    `📋 Booking ID: ${details.bookingId}\n` +
    `💰 Total Amount: ₹${(details.advanceAmount + details.remainingAmount).toLocaleString()}\n\n` +
    `Get ready for an amazing adventure! 🌴\n\n` +
    `Team GoBhraman`
  );
  return `https://wa.me/${details.userName.replace(/\D/g, '')}?text=${message}`;
};

export const getWhatsAppUserLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
};

export const openWhatsAppAdvanceVerified = (phone: string, details: BookingDetails) => {
  const message = 
    `Hi ${details.userName},\n\n` +
    `✅ Your advance payment for *${details.tripName}* has been verified!\n\n` +
    `📋 Booking ID: ${details.bookingId}\n` +
    `💰 Advance Paid: ₹${details.advanceAmount.toLocaleString()}\n` +
    `💳 Remaining Balance: ₹${details.remainingAmount.toLocaleString()}\n\n` +
    `Thank you for booking with GoBhraman! 🌊`;
  
  window.open(getWhatsAppUserLink(phone, message), '_blank');
};

export const openWhatsAppFullyPaid = (phone: string, details: BookingDetails) => {
  const message = 
    `🎉 Booking Confirmed!\n\n` +
    `Hi ${details.userName},\n\n` +
    `Your booking for *${details.tripName}* is fully paid! ✨\n\n` +
    `📋 Booking ID: ${details.bookingId}\n\n` +
    `Get ready for an amazing adventure! 🌴\n\n` +
    `Team GoBhraman`;
  
  window.open(getWhatsAppUserLink(phone, message), '_blank');
};
