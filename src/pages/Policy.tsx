import { Link } from "react-router-dom";
import { Shield, CreditCard, AlertTriangle, Heart, ArrowRight, FileText, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";

const Policy = () => {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is GoBhraman's cancellation policy?",
        acceptedAnswer: { "@type": "Answer", text: "Cancellations 15+ days before departure receive 80% refund. 7-14 days: 50% refund. Less than 7 days: no refund." },
      },
      {
        "@type": "Question",
        name: "How do I pay for a trip?",
        acceptedAnswer: { "@type": "Answer", text: "Pay the advance via UPI to confirm your seat. The remaining balance is due 7 days before the trip." },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title="Safety & Cancellation Policy | GoBhraman"
        description="GoBhraman's refund, cancellation, payment terms, and safety measures for all trips."
      />
      <JsonLd data={faqLd} />
      <Navbar />

      <section className="relative py-32 md:py-40 gradient-ocean">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Safety & Cancellation Policy</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">Transparent terms for a worry-free travel experience</p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          {/* Cancellation Policy */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Cancellation & Refund Policy</h2>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { days: "15+ days before", refund: "80% refund", color: "bg-green-500/20 text-green-600" },
                  { days: "7–14 days before", refund: "50% refund", color: "bg-amber-500/20 text-amber-600" },
                  { days: "Less than 7 days", refund: "No refund", color: "bg-red-500/20 text-red-600" },
                ].map((tier) => (
                  <div key={tier.days} className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">{tier.days}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${tier.color}`}>{tier.refund}</span>
                  </div>
                ))}
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 mt-4">
                <li>• Refunds are processed within 7–10 business days to the original payment method.</li>
                <li>• In case of trip cancellation by GoBhraman, a full refund or rescheduling will be offered.</li>
                <li>• Force majeure events (natural disasters, government restrictions) may alter refund terms.</li>
              </ul>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Payment Terms</h2>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-3 text-sm text-muted-foreground">
              <p>• <strong className="text-foreground">Advance Payment:</strong> A non-refundable advance (typically ₹2,000–₹5,000) is required to confirm your seat.</p>
              <p>• <strong className="text-foreground">Balance Payment:</strong> The remaining amount must be paid at least 7 days before the trip departure date.</p>
              <p>• <strong className="text-foreground">Payment Methods:</strong> UPI (Google Pay, PhonePe, Paytm), Bank Transfer, or at designated pickup points.</p>
              <p>• <strong className="text-foreground">Wallet Credits:</strong> GoBhraman wallet balance can be applied to reduce your trip cost.</p>
              <p>• <strong className="text-foreground">GST:</strong> Applicable taxes are included in the quoted price unless stated otherwise.</p>
            </div>
          </div>

          {/* Safety Measures */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Safety Standards</h2>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-3 text-sm text-muted-foreground">
              <p>• <strong className="text-foreground">Verified Stays:</strong> All accommodations are personally inspected for hygiene and safety.</p>
              <p>• <strong className="text-foreground">Experienced Guides:</strong> Local guides with knowledge of terrain and emergency protocols.</p>
              <p>• <strong className="text-foreground">First Aid:</strong> Basic first-aid kits carried on all trips. Medical facilities mapped for each route.</p>
              <p>• <strong className="text-foreground">Small Groups:</strong> Limited batch sizes ensure better supervision and safety management.</p>
              <p>• <strong className="text-foreground">24/7 Support:</strong> Trip coordinators available round the clock during your journey.</p>
              <p>• <strong className="text-foreground">Emergency Protocol:</strong> Defined evacuation and emergency response procedures for all destinations.</p>
            </div>
          </div>

          {/* Travel Insurance */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Travel Insurance</h2>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
              <p>Travel insurance is <strong className="text-foreground">recommended but not included</strong> in the trip price. We advise all travelers to purchase personal travel insurance covering trip cancellation, medical emergencies, and baggage loss. GoBhraman is not liable for any medical expenses incurred during the trip.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-sunset">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-accent-foreground mb-4">Have Questions?</h2>
          <p className="text-accent-foreground/90 mb-6">Our team is here to help you with any queries about our policies.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-card text-foreground px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow">
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Policy;
