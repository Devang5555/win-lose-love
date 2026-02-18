import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SeoMeta
      title="Terms of Service | GoBhraman"
      description="Read the terms and conditions for using GoBhraman's travel booking platform."
    />
    <Navbar />

    <section className="relative py-28 md:py-36 gradient-ocean">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-3">Terms of Service</h1>
        <p className="text-primary-foreground/80 text-sm">Last updated: February 18, 2026</p>
      </div>
    </section>

    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl space-y-10 text-sm md:text-base text-muted-foreground leading-relaxed">

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using GoBhraman's website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">2. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate and complete information during registration and booking</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not engage in any fraudulent, abusive, or disruptive behavior</li>
            <li>Follow all trip guidelines and safety instructions provided by GoBhraman</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">3. Account Security</h2>
          <p>You are responsible for maintaining the security of your account. GoBhraman is not liable for any unauthorized access resulting from your failure to safeguard your login credentials. Notify us immediately if you suspect any unauthorized use of your account.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">4. Bookings & Payments</h2>
          <p>All trip bookings are subject to availability. Prices may vary based on batch, departure city, and demand. Payment terms and cancellation policies are detailed on our <a href="/policy" className="text-primary hover:underline font-medium">Cancellation Policy</a> page.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">5. Intellectual Property</h2>
          <p>All content on GoBhraman — including text, images, logos, trip itineraries, blog posts, and design — is the intellectual property of GoBhraman. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">6. Limitation of Liability</h2>
          <p>GoBhraman shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability for any claim shall not exceed the amount paid by you for the specific trip in question. We are not responsible for acts of nature, government actions, or other force majeure events.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">7. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the revised terms.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">8. Contact Us</h2>
          <p>For questions regarding these Terms of Service, contact us at:</p>
          <p className="mt-1 font-semibold text-foreground">
            <a href="mailto:support@gobhraman.com" className="text-primary hover:underline">support@gobhraman.com</a>
          </p>
        </div>

      </div>
    </section>

    <Footer />
  </div>
);

export default Terms;
