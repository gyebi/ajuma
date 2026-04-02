import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import heroPortrait from "../../abigail.jpeg";
import { auth } from "./firebase";
import Jobs from "./pages/Jobs";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import StarterCv from "./pages/StarterCv";
import UploadResume from "./pages/UploadResume";

const productPillars = [
  {
    title: "Build Your AI Profile",
    description: "Turn your resume and experience into a cleaner professional story that is easier to match against open roles."
  },
  {
    title: "Discover Better Matches",
    description: "Surface roles aligned to your strengths so you spend less time filtering weak-fit listings across multiple sites."
  },
  {
    title: "Move Faster",
    description: "Use one guided workflow for profile creation, job discovery, and faster applications instead of repeating manual steps."
  }
];

const solutionCards = [
  {
    eyebrow: "For New Graduates",
    title: "Turn limited experience into a stronger first impression.",
    description: "Ajuma AI helps early-career candidates structure projects, internships, and transferable skills into a profile that feels more employer-ready."
  },
  {
    eyebrow: "For Working Professionals",
    title: "Cut the noise and focus on roles that actually fit.",
    description: "Instead of searching endlessly across job boards, use AI-driven matching to prioritize the openings that align with your background and ambitions."
  },
  {
    eyebrow: "For Busy Job Seekers",
    title: "Reduce repetitive work across every application cycle.",
    description: "Move from resume to profile to opportunity faster with one workflow designed to save time and keep momentum high."
  }
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    description: "A clean starting point for job seekers who want to build a profile and test the Ajuma workflow.",
    features: [
      "Limited AI profile generation",
      "Basic job matching",
      "Manual job search support",
      "Email and in-app updates"
    ]
  },
  {
    name: "Pro",
    price: "$15",
    cadence: "/month",
    description: "For active job seekers who want more AI support, better matching, and stronger application momentum.",
    featured: true,
    features: [
      "Expanded AI profile credits",
      "Advanced job matching",
      "Profile refinement workflows",
      "Priority email support",
      "Limited SMS alerts included"
    ]
  },
  {
    name: "Automation",
    price: "$39",
    cadence: "/month",
    description: "For users who want higher limits, faster workflows, and a stronger automation layer for their job search.",
    theme: "dark",
    features: [
      "Higher AI usage limits",
      "Automation-focused workflows",
      "Faster opportunity handling",
      "Expanded notifications",
      "Best fit for premium users"
    ]
  }
];

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [appStep, setAppStep] = useState("onboarding");
  const [onboardingData, setOnboardingData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAppStep("onboarding");
      setOnboardingData(null);
      setResumeData(null);
      setProfile(null);
      return;
    }

    const saved = window.localStorage.getItem(`ajuma-flow:${currentUser.uid}`);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setAppStep(parsed.appStep || "onboarding");
      setOnboardingData(parsed.onboardingData || null);
      setResumeData(parsed.resumeData || null);
      setProfile(parsed.profile || null);
    } catch (_error) {
      window.localStorage.removeItem(`ajuma-flow:${currentUser.uid}`);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    window.localStorage.setItem(
      `ajuma-flow:${currentUser.uid}`,
      JSON.stringify({
        appStep,
        onboardingData,
        resumeData,
        profile
      })
    );
  }, [appStep, currentUser, onboardingData, profile, resumeData]);

  if (currentUser) {
    return (
      <div className="app-shell">
        <header className="app-topbar">
          <div>
            <p className="section-label">Ajuma AI Workflow</p>
            <h1 className="app-shell-title">Welcome back{onboardingData?.fullName ? `, ${onboardingData.fullName}` : ""}.</h1>
          </div>

          <button className="signin-link" type="button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </header>

        <main className="app-main">
          {appStep === "onboarding" ? (
            <Onboarding
              initialData={onboardingData}
              onContinue={(data) => {
                setOnboardingData(data);
                setAppStep(data.hasCv === "yes" ? "upload" : "starterCv");
              }}
            />
          ) : null}

          {appStep === "upload" ? (
            <UploadResume
              onNext={(data) => {
                setResumeData(data);
                setAppStep("profile");
              }}
            />
          ) : null}

          {appStep === "starterCv" ? (
            <StarterCv
              onboardingData={onboardingData}
              onNext={(data) => {
                setResumeData(data);
                setAppStep("profile");
              }}
            />
          ) : null}

          {appStep === "profile" ? (
            <Profile
              profile={profile}
              resumeData={resumeData}
              onProfileGenerated={setProfile}
              onNext={() => setAppStep("jobs")}
            />
          ) : null}

          {appStep === "jobs" ? (
            <Jobs profile={profile} resumeData={resumeData} />
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#hero">
          <span className="brand-mark">A</span>
          <span>Ajuma AI</span>
        </a>

        <nav className="nav">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
        </nav>

        {currentUser ? (
          <div className="auth-state">
            <span className="auth-user-pill">{currentUser.email}</span>
            <button className="signin-link" type="button" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="signin-link" type="button" onClick={() => setShowAuth(true)}>
            Sign in
          </button>
        )}
      </header>

      <main className="landing" id="hero">
        <section className="hero-layout">
          <div className="hero-copy">
            <p className="trust-pill">
              <span className="trust-icon">★</span>
              Trusted by job seekers worldwide
            </p>

            <h1>AI-Powered Job Search That Finds Your Next Role</h1>

            <p className="hero-text">
              The first career workflow that helps you build your profile,
              discover matching jobs, and move faster with AI-powered
              applications all in one place.
            </p>

            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => setShowAuth(true)}>
                Get Started Free
              </button>
              <a className="button button-secondary" href="#demo">
                See How It Works
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src={heroPortrait}
              alt="Ajuma AI job seeker success story"
            />
            <div className="floating-note primary-note">
              <span className="note-icon">✓</span>
              <p>CV ready. Start applying faster.</p>
            </div>

            <div className="floating-note secondary-note">
              <span className="note-dot" />
              <p>Unlock new opportunities with AI</p>
            </div>
          </div>
        </section>

        <section className="metrics-section" id="metrics">
          <div className="metrics-copy">
            <p className="section-label">Live Match Insights</p>
            <h2>See how Ajuma AI turns your profile into measurable job momentum.</h2>
          </div>

          <div className="metrics-card">
            <p className="metrics-title">Job Match Funnel</p>
            <div className="metric-grid">
              <div className="metric-block metric-pink">
                <span>Profile Score</span>
                <strong>82.4%</strong>
              </div>
              <div className="metric-block metric-mint">
                <span>Role Match</span>
                <strong>76.6%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="product-section" id="product">
          <div className="product-heading">
            <p className="section-label">Product</p>
            <h2>One workspace for profile generation, job matching, and faster applications.</h2>
            <p className="product-intro">
              Ajuma AI brings the core steps of job search into one focused
              product so you can stop jumping between tabs and start building
              momentum.
            </p>
          </div>

          <div className="product-layout">
            <div className="product-showcase">
              <div className="product-window">
                <div className="window-bar">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="workflow-stack">
                  <div className="workflow-card">
                    <p className="workflow-label">Step 1</p>
                    <h3>Upload Resume</h3>
                    <p>Bring in your experience once and let the platform structure it for you.</p>
                  </div>

                  <div className="workflow-card workflow-card-accent">
                    <p className="workflow-label">Step 2</p>
                    <h3>Generate Profile</h3>
                    <p>Ajuma AI shapes your story into a stronger, clearer candidate profile.</p>
                  </div>

                  <div className="workflow-card">
                    <p className="workflow-label">Step 3</p>
                    <h3>Match and Apply</h3>
                    <p>Move directly from profile quality into relevant job opportunities and action.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-pillar-list">
              {productPillars.map((pillar) => (
                <article className="product-pillar" key={pillar.title}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="solutions-section" id="solutions">
          <div className="solutions-heading">
            <p className="section-label">Solutions</p>
            <h2>Built for the real job-search situations people face every day.</h2>
            <p className="solutions-intro">
              Whether you are starting out, switching roles, or trying to move
              faster with limited time, Ajuma AI gives you a clearer path from
              effort to opportunity.
            </p>
          </div>

          <div className="solutions-grid">
            {solutionCards.map((card) => (
              <article className="solution-card" key={card.title}>
                <p className="solution-eyebrow">{card.eyebrow}</p>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="pricing-heading">
            <p className="section-label">Pricing</p>
            <h2>Simple plans designed around real usage, not guesswork.</h2>
            <p className="pricing-intro">
              Ajuma pricing is built to cover AI generation, infrastructure,
              and messaging costs while keeping the product accessible for job
              seekers at different stages.
            </p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <article
                className={`pricing-card${plan.featured ? " pricing-card-featured" : ""}${plan.theme === "dark" ? " pricing-card-dark" : ""}`}
                key={plan.name}
              >
                <div className="pricing-card-top">
                  <p className="pricing-name">{plan.name}</p>
                  <div className="pricing-amount">
                    <strong>{plan.price}</strong>
                    <span>{plan.cadence}</span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>
                </div>

                <ul className="pricing-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <a
                  className={`button ${plan.featured ? "button-primary" : "button-secondary"}`}
                  href="#hero"
                >
                  {plan.featured ? "Choose Pro" : `Choose ${plan.name}`}
                </a>
              </article>
            ))}
          </div>

          <div className="pricing-note">
            <p>
              SMS-heavy usage should be handled as an add-on or capped usage
              layer so pricing stays sustainable as Ajuma grows.
            </p>
          </div>
        </section>
      </main>

      {showAuth ? (
        <Login
          onClose={() => setShowAuth(false)}
          onLogin={() => setShowAuth(false)}
        />
      ) : null}
    </div>
  );
}
