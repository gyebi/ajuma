import { pricingPlans } from "../../content/homepage";

export default function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-heading">
        <p className="section-label section-label-pricing">Pricing</p>
        <h2>Simple pricing</h2>
        <p className="pricing-intro">
          The goal is to keep Ajuma accessible for job seekers at different stages on their journey.
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
      
      </div>
    </section>
  );
}
