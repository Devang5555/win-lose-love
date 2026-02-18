import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <SeoMeta
      title="Privacy Policy | GoBhraman"
      description="Learn how GoBhraman collects, uses, and protects your personal information."
    />
    <Navbar />

    <section className="relative py-28 md:py-36 gradient-ocean">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-3">Privacy Policy</h1>
        <p className="text-primary-foreground/80 text-sm">Last updated: February 18, 2026</p>
      </div>
    </section>

    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl space-y-10 text-sm md:text-base text-muted-foreground leading-relaxed">

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">1. Information We Collect</h2>
          <p>When you sign in using Google OAuth, we collect the following information from your Google account:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Profile image URL</li>
          </ul>
          <p className="mt-2">We may also collect information you voluntarily provide when booking a trip, such as your phone number, pickup location, and travel preferences.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To create and manage your account</li>
            <li>To process trip bookings and payments</li>
            <li>To send booking confirmations and trip reminders</li>
            <li>To manage your wallet balance and referral rewards</li>
            <li>To improve our services and user experience</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">3. Data Storage & Security</h2>
          <p>Your data is securely stored using industry-standard cloud infrastructure with encryption at rest and in transit. We employ row-level security policies to ensure your data is only accessible to you and authorized administrators.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">4. We Do Not Sell Your Data</h2>
          <p>GoBhraman will <strong className="text-foreground">never</strong> sell, rent, or trade your personal information to third parties for marketing or advertising purposes.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">5. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for data processing at any time</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, please contact us at the email below.</p>
        </div>

        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, reach out to us at:</p>
          <p className="mt-1 font-semibold text-foreground">
            <a href="mailto:support@gobhraman.com" className="text-primary hover:underline">support@gobhraman.com</a>
          </p>
        </div>

      </div>
    </section>

    <Footer />
  </div>
);

export default Privacy;
