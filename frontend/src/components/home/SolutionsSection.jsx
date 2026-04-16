import { solutionCards } from "../../content/homepage";

export default function SolutionsSection() {
  return (
    <section className="solutions-section" id="who-its-for">
      <div className="solutions-heading">
        <p className="section-label section-label-solutions">Who It's For</p>
        <h2>Built for real job-search situations, not just ideal ones.</h2>
        <p className="solutions-intro">
          Whether someone is starting out, changing direction, or actively applying,
          Ajuma is built to reduce confusion and help them move with more confidence.
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
  );
}
