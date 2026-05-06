import { Link } from "react-router-dom";
import { MessageCircle, HelpCircle, Calendar, XCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileLayout from "@/components/profile/ProfileLayout";

const SUPPORT_PHONE = "+91-9415026522";
const SUPPORT_EMAIL = "bhramanbyua@gmail.com";
const WHATSAPP_NUMBER = "919415026522";

const items = [
  {
    icon: MessageCircle,
    title: "Chat on WhatsApp",
    desc: "Fastest way to reach our trip captains",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi GoBhraman, I need help with my booking.")}`,
    external: true,
  },
  { icon: HelpCircle, title: "FAQs", desc: "Common questions answered", href: "/faq", external: false },
  { icon: Calendar, title: "Booking Help", desc: "Payment, batches & itinerary", href: "/contact", external: false },
  { icon: XCircle, title: "Cancellation Policy", desc: "Refunds, rescheduling & rules", href: "/cancellation", external: false },
];

const ProfileHelp = () => {
  return (
    <ProfileLayout title="Help & Support" description="We're here to help — choose the option that fits best">
      <div className="space-y-3">
        {items.map(({ icon: Icon, title, desc, href, external }) => {
          const inner = (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
            </>
          );
          const className = "flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all";
          return external ? (
            <a key={title} href={href} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>
          ) : (
            <Link key={title} to={href} className={className}>{inner}</Link>
          );
        })}

        <div className="bg-muted/40 rounded-2xl p-4 mt-6 space-y-2">
          <p className="text-sm font-semibold text-foreground">Still need help?</p>
          <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Phone className="w-4 h-4" /> {SUPPORT_PHONE}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Mail className="w-4 h-4" /> {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfileHelp;
