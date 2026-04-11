import CTASection from "../components/home/CTASection";
import HeroSection from "../components/home/HeroSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import PricingSection from "../components/home/PricingSection";
import ProofSection from "../components/home/ProofSection";
import SolutionsSection from "../components/home/SolutionsSection";
import Navbar from "../components/Navbar";
import Login from "./Login";

export default function LandingPage({ currentUser, showAuth, onCloseAuth, onSignIn }) {
  return (
    <div className="site-shell">
      <Navbar currentUser={currentUser} onSignIn={onSignIn} />

      <main className="landing" id="hero">
        <HeroSection onSignIn={onSignIn} />
        <ProofSection />
        <HowItWorksSection />
        <SolutionsSection />
        <PricingSection />
        <CTASection onSignIn={onSignIn} />
      </main>

      {showAuth ? (
        <Login
          onClose={onCloseAuth}
          onLogin={onCloseAuth}
        />
      ) : null}
    </div>
  );
}
