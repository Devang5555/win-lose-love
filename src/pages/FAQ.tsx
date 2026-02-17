import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    category: "Booking Process",
    items: [
      { q: "How do I book a trip with GoBhraman?", a: "Browse our trips page, select your preferred trip and batch date, fill in your details, and pay the advance amount via UPI to confirm your seat." },
      { q: "Can I book for multiple travelers?", a: "Yes! During booking, you can specify the number of travelers. The total amount will be calculated accordingly." },
      { q: "What happens after I book?", a: "After paying the advance, your booking enters 'pending verification'. Our team verifies the payment (usually within 24 hours) and confirms your seat via WhatsApp." },
      { q: "Can I change my batch date after booking?", a: "Date changes are subject to availability. Contact our support team at least 10 days before your trip for assistance." },
    ],
  },
  {
    category: "Payment Methods",
    items: [
      { q: "What payment methods do you accept?", a: "We accept UPI payments (Google Pay, PhonePe, Paytm, etc.) and bank transfers. Cash payments at pickup points are also available for remaining balance." },
      { q: "How much advance do I need to pay?", a: "The advance amount varies by trip, typically ₹2,000–₹5,000. The exact amount is shown on the trip page." },
      { q: "When is the remaining balance due?", a: "The remaining balance must be paid at least 7 days before the trip departure date." },
      { q: "Can I use my GoBhraman wallet balance?", a: "Yes! Wallet credits (from referrals, signup bonus, or loyalty rewards) can be applied to reduce your trip cost during booking." },
    ],
  },
  {
    category: "Cancellation & Refunds",
    items: [
      { q: "What is the cancellation policy?", a: "15+ days before departure: 80% refund. 7–14 days: 50% refund. Less than 7 days: no refund. Refunds are processed within 7–10 business days." },
      { q: "What if GoBhraman cancels the trip?", a: "If we cancel a trip, you'll receive a full refund or the option to reschedule to another batch at no extra cost." },
      { q: "How do I cancel my booking?", a: "Contact our support team via WhatsApp or email. Cancellation requests must include your booking ID and reason." },
    ],
  },
  {
    category: "Trip Preparation",
    items: [
      { q: "What should I pack for the trip?", a: "We send a detailed packing list via WhatsApp 3 days before your trip. Generally: comfortable clothes, sturdy shoes, sunscreen, personal medications, and a small daypack." },
      { q: "What about food and accommodation?", a: "All trips include meals and accommodation as mentioned in the inclusions. We cater to vegetarian preferences. Let us know about dietary restrictions in advance." },
      { q: "Is the trip suitable for beginners?", a: "Most of our trips are designed for all fitness levels. Difficulty ratings are mentioned on each trip page. Feel free to ask us if unsure." },
      { q: "What's the reporting time and pickup location?", a: "Pickup details are shared via WhatsApp 24–48 hours before departure. Common pickup points include Mumbai, Pune, and destination-specific locations." },
    ],
  },
];

const FAQ = () => {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap(cat =>
      cat.items.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title="FAQ - Frequently Asked Questions | GoBhraman"
        description="Find answers to common questions about booking, payments, cancellations, and trip preparation with GoBhraman."
      />
      <JsonLd data={faqLd} />
      <Navbar />

      <section className="relative py-32 md:py-40 gradient-ocean">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">Everything you need to know about traveling with GoBhraman</p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          {faqs.map((category) => (
            <div key={category.category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold text-foreground">{category.category}</h2>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {category.items.map((item, i) => (
                  <AccordionItem key={i} value={`${category.category}-${i}`} className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 gradient-sunset">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-accent-foreground mb-4">Still have questions?</h2>
          <p className="text-accent-foreground/90 mb-6">Reach out and we'll get back to you within hours.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-card text-foreground px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow">
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
