import Header from "../components/sections/Header";
import Hero from "../components/sections/Hero";
import FeaturesSection from "../components/sections/Features";
import HowItWorksSection from "../components/sections/HowItWorks";
import TestimonialsSection from "../components/sections/Testimonials";
import PricingSection from "../components/sections/Pricing";
import Footer from "../components/sections/Footer";

const LandingPage = () => {
  return (
    <>
      <Header />
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <Footer />
    </>
  );
};

export default LandingPage;
