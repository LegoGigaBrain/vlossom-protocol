/**
 * Landing Page (V7.5.0)
 *
 * Marketing landing page for Vlossom Protocol.
 * Explains what Vlossom is and drives users to launch the app.
 *
 * Structure:
 * - Navbar (fixed)
 * - Hero with orange "Launch App" CTA
 * - How It Works (3 steps)
 * - For Customers (value props)
 * - For Stylists (value props)
 * - For Salon Owners (value props)
 * - Final CTA
 * - Footer
 */

import {
  LandingNavbar,
  HeroSection,
  HowItWorksSection,
  ForCustomersSection,
  ForStylistsSection,
  ForOwnersSection,
  CTASection,
  LandingFooter,
} from '../components/landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <HowItWorksSection />
      <ForCustomersSection />
      <ForStylistsSection />
      <ForOwnersSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
