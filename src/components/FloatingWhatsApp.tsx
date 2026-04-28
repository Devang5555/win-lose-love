import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919415026522";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi GoBhraman! I'd like to know more about your trips."
)}`;

const FloatingWhatsApp = () => {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 bottom-20 md:bottom-6 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
    >
      <MessageCircle className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" />
    </a>
  );
};

export default FloatingWhatsApp;
