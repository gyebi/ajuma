export default function CTASection({ onSignIn }) {
  return (
    <section className="cta-section">
      <div className="cta-card">
        <p className="section-label section-label-workflow">Next</p>
        <h2>Start with a stronger profile, then build the rest of your search with it.</h2>
        <p className="cta-text">
          Ajuma is designed to help you get clearer on who you are professionally,
          where you fit, and how to move forward with less guesswork.
        </p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onSignIn}>
            Get Started
          </button>
          <a className="button button-secondary" href="#hero">
            Back to top
          </a>
        </div>
      </div>
    </section>
  );
}
