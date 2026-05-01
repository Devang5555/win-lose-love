import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is this trip suitable for beginners?",
    a: "Yes. Our trips are designed for travelers of all experience levels. Activities are well-planned and supervised by experienced trip leaders, with options to opt out of anything strenuous.",
  },
  {
    q: "What is included in the package?",
    a: "Typically: accommodation in verified stays, breakfast & dinner (unless specified), transport during the itinerary, sightseeing entries listed in the plan, and a trip leader. Check the “Included” tab for the exact inclusions of this trip.",
  },
  {
    q: "How is accommodation arranged?",
    a: "We partner with verified hotels, homestays, and camps based on the destination. Hotels shown are indicative — similar-category stays will be provided based on availability. Rooms are usually on a triple/double-sharing basis.",
  },
  {
    q: "Is this trip safe?",
    a: "Safety is our top priority. All trips have a dedicated trip leader, vetted vehicles and drivers, verified accommodations, and 24/7 on-trip support. We follow all local guidelines and weather advisories.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellation charges depend on how close you cancel to the trip start date. You can find the exact slab under the “Policies” tab on this page, or contact us on WhatsApp for help.",
  },
];

const TripFaqSection = () => {
  return (
    <section className="mt-10 mb-4">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-5 flex items-center gap-3">
        <HelpCircle className="w-6 h-6 text-primary" />
        FAQs
      </h2>
      <div className="bg-card rounded-2xl border border-border p-2 md:p-4 shadow-card">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold text-card-foreground px-2 md:px-3">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed px-2 md:px-3">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default TripFaqSection;
