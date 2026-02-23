import { useState } from "react";
import {
  Clock, MapPin, Route, Users, Calendar, Fuel, Banknote, Signal, Shirt, AlertTriangle,
  Home, ChevronRight, Mountain, Star, Phone, MessageCircle, Download, Heart, Sun, Moon,
  Camera, TreePine, Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";

import heroImg from "@/assets/sissu-hero.jpg";
import waterfallImg from "@/assets/sissu-waterfall.jpg";
import templeImg from "@/assets/raja-ghepan-temple.jpg";
import riverImg from "@/assets/chandra-river.jpg";
import villageImg from "@/assets/sissu-village.jpg";
import keylongImg from "@/assets/keylong.jpg";
import fortImg from "@/assets/gondhla-fort.jpg";

const WHATSAPP_NUMBER = "919415026522";
const whatsappLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const overviewItems = [
  { icon: Calendar, label: "Duration", value: "5 Days" },
  { icon: Route, label: "Distance", value: "~550 km" },
  { icon: Clock, label: "Travel Time", value: "12–14 hours" },
  { icon: MapPin, label: "Route", value: "Delhi → Chandigarh → Mandi → Aut → Kullu → Atal Tunnel → Sissu" },
  { icon: Users, label: "Ideal For", value: "Couples, Friends, Family, Nature Lovers" },
];

const itinerary = [
  {
    day: 1,
    title: "Delhi → Sissu (Overnight Journey)",
    icon: Moon,
    stay: "Travel Night",
    items: [
      "Depart 6–7 PM from Delhi",
      "Overnight Volvo / Private Cab",
      "Early morning Atal Tunnel crossing",
      "Reach Sissu by 6–8 AM",
    ],
  },
  {
    day: 2,
    title: "Sissu Sightseeing & Relaxation",
    icon: Sun,
    stay: "Sissu",
    items: [
      "Rest & acclimatization",
      "Visit Sissu Waterfall",
      "Visit Raja Ghepan Temple",
      "Walk along Chandra River",
      "Explore Sissu Village",
      "Sunset photography",
    ],
  },
  {
    day: 3,
    title: "Day Trip to Keylong (14 km one way)",
    icon: Landmark,
    stay: "Sissu",
    items: [
      "Drive to Keylong",
      "Visit Kardang Monastery",
      "Explore local market",
      "Lunch at café / dhaba",
      "Return to Sissu",
      "Stargazing (weather permitting)",
    ],
  },
  {
    day: 4,
    title: "Local Exploration – Jispa or Gondhla",
    icon: Camera,
    stay: "Sissu",
    options: [
      { label: "Option A: Jispa", desc: "Riverside views, nature walks, photography" },
      { label: "Option B: Gondhla Village", desc: "Visit Gondhla Fort & explore local culture" },
    ],
    items: ["Evening return to Sissu"],
  },
  {
    day: 5,
    title: "Sissu → Delhi Return",
    icon: Route,
    stay: null,
    items: [
      "Early morning departure",
      "Drive via Atal Tunnel → Kullu → Chandigarh",
      "Reach Delhi late night",
    ],
  },
];

const places = [
  { img: waterfallImg, name: "Sissu Waterfall", desc: "A stunning cascade right beside the highway, perfect for a refreshing stop." },
  { img: templeImg, name: "Raja Ghepan Temple", desc: "Ancient Himalayan temple perched high with panoramic valley views." },
  { img: riverImg, name: "Chandra River", desc: "Glacial turquoise waters winding through the dramatic Lahaul valley." },
  { img: villageImg, name: "Sissu Village", desc: "A serene hamlet with green fields, traditional homes, and warm locals." },
  { img: keylongImg, name: "Keylong", desc: "District HQ of Lahaul, home to Kardang Monastery and vibrant markets." },
  { img: fortImg, name: "Gondhla Fort", desc: "A centuries-old stone fortress showcasing Lahaul's rich cultural heritage." },
];

const travelNotes = [
  { icon: Fuel, text: "Fuel up at Tandi Petrol Pump — last fuel station before Sissu" },
  { icon: Banknote, text: "Carry cash — limited ATMs beyond Kullu" },
  { icon: Signal, text: "BSNL network works best in Lahaul valley" },
  { icon: Shirt, text: "Pack warm clothes — cold nights even in summer" },
  { icon: AlertTriangle, text: "Check road & Atal Tunnel status before travel" },
];

const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "TravelAction",
  name: "Delhi to Sissu – 5 Days Scenic Road Trip",
  description: "5 Days Delhi to Sissu itinerary via Atal Tunnel. Explore Lahaul Valley, Sissu Waterfall, Keylong, and Gondhla Fort.",
  url: window.location.href,
};

const SissuItinerary = () => {
  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title="Delhi to Sissu 5 Day Itinerary | Atal Tunnel Road Trip – GoBhraman"
        description="Plan your 5-day Delhi to Sissu road trip via Atal Tunnel. Complete itinerary covering Sissu Waterfall, Keylong, Gondhla Fort & Lahaul Valley."
      />
      <JsonLd data={jsonLdData} />
      <Navbar />

      {/* HERO */}
      <section className="relative h-[75vh] min-h-[480px] flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Sissu Valley with Atal Tunnel and Himalayan mountains" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl animate-fade-in">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium tracking-wide">
            5-Day Itinerary
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Delhi to Sissu – 5 Days Scenic Road Trip
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-8 font-light">
            Via Atal Tunnel &nbsp;•&nbsp; Best Time: March–June & Sept–Oct
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="text-base px-8 shadow-lg" asChild>
              <a href={whatsappLink("Hi, I want to plan the Delhi to Sissu 5-day trip!")}>
                Start Your Journey →
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" asChild>
              <a href={whatsappLink("Hi, I'd like a custom Sissu trip package.")}>
                Get Custom Package
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-5xl px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Trip Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {overviewItems.map((item) => (
              <Card key={item.label} className="border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DAY-WISE ITINERARY */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-3xl px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Day-Wise Itinerary
          </h2>
          <Accordion type="single" collapsible defaultValue="day-1" className="space-y-3">
            {itinerary.map((day) => (
              <AccordionItem key={day.day} value={`day-${day.day}`} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden px-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-primary/5">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                      {day.day}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-base">{day.title}</p>
                      {day.stay && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Home className="h-3 w-3" /> Stay: {day.stay}
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2">
                  {day.options && (
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      {day.options.map((opt) => (
                        <div key={opt.label} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                          <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {day.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* PLACES COVERED */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-6xl px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Places You'll Explore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <Card key={place.name} className="overflow-hidden border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 group">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={place.img}
                    alt={place.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-serif font-semibold text-lg text-foreground mb-1">{place.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{place.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TRAVEL NOTES */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-3xl px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
            Important Travel Notes
          </h2>
          <div className="space-y-4">
            {travelNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                  <note.icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed pt-1">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STAY SUGGESTIONS */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            Stay Suggestions
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-6 text-left">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-3">
                  <Home className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-1">Local Homestays</h3>
                <p className="text-sm text-muted-foreground">Recommended for an authentic Lahauli experience with home-cooked meals and warm hospitality.</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-6 text-left">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-3">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-1">Small Hotels</h3>
                <p className="text-sm text-muted-foreground">Budget-friendly options near the village centre and helipad with mountain views.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ADD-ON SECTION */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            Customize Your Trip
          </h2>
          <p className="text-muted-foreground mb-8">Get a version tailored just for you</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Customize for Family", icon: Users },
              { label: "Customize for Couple", icon: Heart },
              { label: "March Special Version", icon: TreePine },
            ].map((btn) => (
              <Button key={btn.label} variant="outline" className="gap-2" asChild>
                <a href={whatsappLink(`Hi, I'd like the ${btn.label} of the Delhi-Sissu trip.`)}>
                  <btn.icon className="h-4 w-4" />
                  {btn.label}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 container max-w-2xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Experience Lahaul?
          </h2>
          <p className="text-white/80 mb-8 text-lg">Let us help you plan the perfect mountain escape</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="text-base px-8 gap-2 shadow-lg" asChild>
              <a href={whatsappLink("Hi, I'm interested in the Delhi to Sissu 5-day trip!")} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Contact Us on WhatsApp
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" asChild>
              <a href={whatsappLink("Hi, please call me back regarding the Sissu trip.")}>
                <Phone className="h-5 w-5" />
                Request Callback
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SissuItinerary;
