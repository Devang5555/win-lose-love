import {
  Clock, MapPin, Route, Users, Calendar, Banknote, Shirt, AlertTriangle, Sun,
  Home, ChevronRight, Moon, Camera, Star, Phone, MessageCircle, Heart, Waves, Mountain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";
import ScrollReveal from "@/components/ScrollReveal";
import heroImg from "@/assets/rishikesh-hero.jpg";

const WHATSAPP_NUMBER = "919415026522";
const wa = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const overview = [
  { icon: Calendar, label: "Duration", value: "3 Days / 2 Nights" },
  { icon: Route, label: "Distance", value: "~240 km from Delhi" },
  { icon: Clock, label: "Travel Time", value: "5–6 hours by road" },
  { icon: MapPin, label: "Route", value: "Delhi → Haridwar → Rishikesh" },
  { icon: Users, label: "Ideal For", value: "Solo, Friends, Spiritual Seekers, Adventure Lovers" },
];

const itinerary = [
  {
    day: 1, title: "Delhi → Rishikesh & Ganga Aarti", icon: Sun, stay: "Rishikesh",
    items: ["Depart Delhi early morning (5–6 AM)", "Breakfast stop at Murthal dhabas", "Arrive Rishikesh by noon", "Check in & relax", "Visit Laxman Jhula & Ram Jhula", "Attend Ganga Aarti at Triveni Ghat", "Dinner at a riverside café"],
  },
  {
    day: 2, title: "Adventure Day – Rafting & Exploration", icon: Waves, stay: "Rishikesh",
    items: ["White water rafting on the Ganges (16 km stretch)", "Cliff jumping at designated spots", "Visit Beatles Ashram (Chaurasi Kutia)", "Explore Rishikesh local market", "Yoga session at an ashram (optional)", "Evening bonfire at camp"],
  },
  {
    day: 3, title: "Temples & Return to Delhi", icon: Mountain, stay: null,
    items: ["Sunrise yoga or meditation by the Ganges", "Visit Neelkanth Mahadev Temple", "Breakfast & checkout", "Stop at Haridwar — Har Ki Pauri ghat", "Depart for Delhi by afternoon", "Reach Delhi by evening"],
  },
];

const travelNotes = [
  { icon: Banknote, text: "Rafting costs ₹800–₹2500 depending on distance" },
  { icon: Shirt, text: "Carry quick-dry clothes for rafting & comfortable shoes" },
  { icon: AlertTriangle, text: "Rafting season: Sept–June (closed during monsoon)" },
  { icon: Calendar, text: "Book Beatles Ashram tickets online in advance" },
];

const RishikeshItinerary = () => (
  <div className="min-h-screen bg-background">
    <SeoMeta title="Rishikesh 3-Day Itinerary | Adventure & Spirituality – GoBhraman" description="Plan your 3-day Rishikesh trip. White water rafting, Ganga Aarti, Beatles Ashram, yoga & Neelkanth Temple." />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "TravelAction", name: "Rishikesh Adventure & Spirituality – 3 Days", description: "3-day Rishikesh itinerary with rafting, temples, yoga and adventure." }} />
    <Navbar />

    <section className="relative h-[75vh] min-h-[480px] flex items-center justify-center overflow-hidden">
      <img src={heroImg} alt="Rishikesh with Ganges river and Laxman Jhula bridge" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      <div className="relative z-10 text-center px-4 max-w-3xl animate-fade-in">
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium">3-Day Itinerary</span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">Rishikesh – Adventure & Spirituality</h1>
        <p className="text-lg md:text-xl text-white/85 mb-8 font-light">Rafting • Yoga • Ganga Aarti &nbsp;•&nbsp; Best Time: Sept–June</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="text-base px-8 shadow-lg" asChild><a href={wa("Hi, I want to plan the 3-day Rishikesh trip!")}>Start Your Journey →</a></Button>
          <Button size="lg" variant="outline" className="text-base px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" asChild><a href={wa("Hi, I'd like a custom Rishikesh package.")}>Get Custom Package</a></Button>
        </div>
      </div>
    </section>

    <section className="py-16 md:py-20 bg-background">
      <div className="container max-w-5xl px-4">
        <ScrollReveal><h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Trip Overview</h2></ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {overview.map((item, i) => (<ScrollReveal key={item.label} delay={i * 0.1}><Card className="border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300"><CardContent className="flex items-start gap-4 p-5"><div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0"><item.icon className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p><p className="text-sm font-medium text-foreground leading-relaxed">{item.value}</p></div></CardContent></Card></ScrollReveal>))}
        </div>
      </div>
    </section>

    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container max-w-3xl px-4">
        <ScrollReveal><h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Day-Wise Itinerary</h2></ScrollReveal>
        <Accordion type="single" collapsible defaultValue="day-1" className="space-y-3">
          {itinerary.map((day) => (<ScrollReveal key={day.day} delay={day.day * 0.1}><AccordionItem value={`day-${day.day}`} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden px-0"><AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-primary/5"><div className="flex items-center gap-3 text-left"><span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{day.day}</span><div><p className="font-semibold text-foreground text-base">{day.title}</p>{day.stay && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Home className="h-3 w-3" /> Stay: {day.stay}</p>}</div></div></AccordionTrigger><AccordionContent className="px-5 pb-5 pt-2"><ul className="space-y-2">{day.items.map((item, i) => (<li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85"><ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul></AccordionContent></AccordionItem></ScrollReveal>))}
        </Accordion>
      </div>
    </section>

    <section className="py-16 md:py-20 bg-background">
      <div className="container max-w-3xl px-4">
        <ScrollReveal><h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-10">Important Travel Notes</h2></ScrollReveal>
        <div className="space-y-4">{travelNotes.map((note, i) => (<ScrollReveal key={i} delay={i * 0.1}><div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border/50 shadow-sm"><div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0"><note.icon className="h-5 w-5" /></div><p className="text-sm text-foreground/85 leading-relaxed pt-1">{note.text}</p></div></ScrollReveal>))}</div>
      </div>
    </section>

    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container max-w-3xl px-4 text-center">
        <ScrollReveal><h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">Customize Your Trip</h2><p className="text-muted-foreground mb-8">Get a version tailored just for you</p></ScrollReveal>
        <div className="flex flex-wrap justify-center gap-3">
          {[{ label: "Customize for Friends", icon: Users }, { label: "Customize for Couple", icon: Heart }, { label: "Adventure Focus", icon: Mountain }].map((btn) => (<Button key={btn.label} variant="outline" className="gap-2" asChild><a href={wa(`Hi, I'd like the ${btn.label} of the Rishikesh trip.`)}><btn.icon className="h-4 w-4" />{btn.label}</a></Button>))}
        </div>
      </div>
    </section>

    <section className="relative py-20 md:py-28 overflow-hidden">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      <div className="relative z-10 container max-w-2xl px-4 text-center">
        <ScrollReveal><h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">Ready for Rishikesh?</h2><p className="text-white/80 mb-8 text-lg">Adventure meets spirituality on the banks of the Ganges</p></ScrollReveal>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="text-base px-8 gap-2 shadow-lg" asChild><a href={wa("Hi, I'm interested in the 3-day Rishikesh trip!")} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-5 w-5" />Contact Us on WhatsApp</a></Button>
          <Button size="lg" variant="outline" className="text-base px-8 gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" asChild><a href={wa("Hi, please call me back regarding the Rishikesh trip.")}><Phone className="h-5 w-5" />Request Callback</a></Button>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default RishikeshItinerary;
