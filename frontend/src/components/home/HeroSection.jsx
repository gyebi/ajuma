import heroPortrait from "../../../../abigail.jpeg";

export default function HeroSection({ onSignIn }) {
  return (
    <section className="hero-layout">
      <div className="hero-copy">
        <p className="trust-pill">
          <span className="trust-icon">★</span>
          A clearer starting point for a smarter job search.
        </p>

        <h1>Build an AI-powered career profile and focus your job search on the right opportunities.</h1>
        <p className="hero-text">
          Ajuma leverages AI to help young graduates, first-time job seekers, and skilled professionals transform their education, skills, and experience into clear, confident profiles for a more focused job search.
        </p>

        <div className="hero-actions hero-actions-lower">
          <button className="button button-primary" type="button" onClick={onSignIn}>
            Get Started
          </button>
          <a className="button button-secondary" href="#how-it-works">
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
          <p>Build clarity before you chase more applications.</p>
        </div>

        <div className="floating-note secondary-note">
          <span className="note-dot" />
          <p>Shape it once. Use it across your search.</p>
        </div>
      </div>
    </section>
  );
}
