import heroPortrait from "../../abigail.jpeg";

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

export default function App() {
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
          <a href="#resources">Resources</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <a className="signin-link" href="#signin">
          Sign in
        </a>
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
              <a className="button button-primary" href="#get-started">
                Get Started Free
              </a>
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
      </main>
    </div>
  );
}
