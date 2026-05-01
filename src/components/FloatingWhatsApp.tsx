const WHATSAPP_NUMBER = "919415026522";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi GoBhraman! I'd like to know more about your trips."
)}`;

// Official WhatsApp glyph
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.11 17.29c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM16.02 5.33c-5.89 0-10.67 4.78-10.67 10.67 0 1.88.49 3.71 1.42 5.33L5.33 26.67l5.49-1.43c1.56.85 3.31 1.3 5.2 1.3 5.89 0 10.67-4.78 10.67-10.67 0-2.85-1.11-5.53-3.13-7.55a10.6 10.6 0 0 0-7.54-3.12zm0 19.5c-1.7 0-3.36-.46-4.81-1.32l-.34-.2-3.57.93.95-3.48-.22-.36a8.83 8.83 0 0 1-1.36-4.7c0-4.88 3.97-8.85 8.85-8.85 2.36 0 4.59.92 6.26 2.59a8.81 8.81 0 0 1 2.59 6.26c0 4.88-3.97 8.85-8.85 8.85z" />
  </svg>
);

const FloatingWhatsApp = () => {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_28px_rgba(37,211,102,0.55)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center ring-2 ring-white/30"
    >
      <WhatsAppIcon className="w-7 h-7 md:w-8 md:h-8" />
    </a>
  );
};

export default FloatingWhatsApp;
