import heroPortrait from "../../../../abigail.jpeg";
import { websiteStats } from "../../content/homepage";

export default function HeroSection({ onSignIn }) {
  return (
    <section className="hero-layout">
      <div className="hero-copy">
        <p className="trust-pill">
          <span className="trust-icon">★</span>
          A clearer starting point for a smarter job search.
        </p>

        <h1>Turn your experience into a stronger profile and a more focused job search.</h1>

        <p className="hero-text">
          Ajuma AI helps job seekers organize their background, present their strengths
          more clearly, and focus on opportunities that feel more relevant from the start.
        </p>

        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onSignIn}>
            Get Started
          </button>
          <a className="button button-secondary" href="#how-it-works">
            See How It Works
          </a>
        </div>

        <div className="hero-summary">
          {websiteStats.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
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
