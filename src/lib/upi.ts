// UPI Deep Link Helper for payment redirect

// Merchant UPI ID for GoBhraman
const MERCHANT_UPI_ID = "8433676328@indie";
const MERCHANT_NAME = "GoBhraman";

export interface UpiPaymentDetails {
  amount: number;
  transactionNote: string;
  transactionRef?: string;
}

/**
 * Generates a UPI payment string for QR code generation
 * When scanned, opens the UPI app with UPI ID and amount pre-filled
 * Uses proper UPI intent format that works with all major UPI apps
 */
export const generateUpiQrString = (details: UpiPaymentDetails): string => {
  // Build UPI string manually to avoid over-encoding issues
  // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  const upiString = [
    `pa=${MERCHANT_UPI_ID}`,
    `pn=${encodeURIComponent(MERCHANT_NAME)}`,
    `am=${details.amount.toFixed(2)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(details.transactionNote)}`,
  ];

  if (details.transactionRef) {
    upiString.push(`tr=${encodeURIComponent(details.transactionRef)}`);
  }

  return `upi://pay?${upiString.join("&")}`;
};

/**
 * Generates a UPI deep link that opens installed UPI apps
 * Works with Google Pay, PhonePe, Paytm, BHIM, etc.
 */
export const generateUpiDeepLink = (details: UpiPaymentDetails): string => {
  const params = new URLSearchParams({
    pa: MERCHANT_UPI_ID,
    pn: MERCHANT_NAME,
    am: details.amount.toString(),
    tn: details.transactionNote,
    cu: "INR",
    mode: "02", // Collect request mode
  });

  if (details.transactionRef) {
    params.append("tr", details.transactionRef);
  }

  return `upi://pay?${params.toString()}`;
};

/**
 * Get the merchant UPI ID for display purposes
 */
export const getMerchantUpiId = (): string => MERCHANT_UPI_ID;

/**
 * Triggers UPI payment by redirecting to the deep link
 * On mobile, this opens the UPI app selector
 */
export const triggerUpiPayment = (details: UpiPaymentDetails): void => {
  const deepLink = generateUpiDeepLink(details);
  window.location.href = deepLink;
};

/**
 * Validates UPI ID format
 */
export const isValidUpiId = (upiId: string): boolean => {
  // UPI ID format: username@bankhandle
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiPattern.test(upiId);
};

/**
 * Common UPI handles for validation hints
 */
export const commonUpiHandles = [
  "@upi",
  "@okaxis",
  "@okhdfc",
  "@okhdfcbank",
  "@okicici",
  "@oksbi",
  "@ybl",
  "@paytm",
  "@ibl",
  "@axl",
];
