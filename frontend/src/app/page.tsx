import Navbar from "@/components/landing/navbar"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import Pricing from "@/components/landing/pricing"
import CTABanner from "@/components/landing/cta-banner"
import Footer from "@/components/landing/footer"
import Providers from "@/components/landing/ai-providers"
import Metrics from "@/components/landing/metrics"
import QuoteSection from "@/components/landing/testimonials"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Providers />
      <Metrics/>
      {/* <Pricing /> */}
      <QuoteSection />
      <CTABanner />
      <Footer />
    </main>
  )
}
