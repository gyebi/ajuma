import CTASection from "../components/home/CTASection";
import Footer from "../components/Footer";
import FloatingSmsBubble from "../components/FloatingSmsBubble";
import HeroSection from "../components/home/HeroSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import PricingSection from "../components/home/PricingSection";
import SolutionsSection from "../components/home/SolutionsSection";
import Navbar from "../components/Navbar";
import Login from "./Login";

export default function LandingPage({ currentUser, showAuth, onChoosePlan, onCloseAuth, onSignIn }) {
  return (
    <div className="site-shell">
      <Navbar currentUser={currentUser} onSignIn={onSignIn} />

      <main className="landing" id="hero">
        <HeroSection onSignIn={onSignIn} />
        <HowItWorksSection />
        <SolutionsSection />
        <PricingSection onChoosePlan={onChoosePlan} />
        <CTASection onSignIn={onSignIn} />
      </main>

      <Footer />
      <FloatingSmsBubble />

      {showAuth ? (
        <Login
          onClose={onCloseAuth}
          onLogin={onCloseAuth}
        />
      ) : null}
    </div>
  );
}
