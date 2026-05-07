import { useEffect, useMemo, useState } from "react";
import { pricingPlans } from "../../content/homepage";
import { fetchPublicPlans } from "../../services/paymentApi";
import {
  buildPlanFeatures,
  formatPlanPrice,
  getPlanCreditsLabel
} from "../../utils/plans";

export default function PricingSection({ onChoosePlan }) {
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPlans() {
      try {
        const response = await fetchPublicPlans();

        if (isMounted) {
          setPlans(response.plans || []);
          setPlansError("");
        }
      } catch (error) {
        console.error("Landing pricing plans failed to load", error);

        if (isMounted) {
          setPlans([]);
          setPlansError("Pricing is temporarily unavailable.");
        }
      }
    }

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayPlans = useMemo(() => pricingPlans.map((plan) => ({
    ...plan,
    displayDescription: plan.description || getPlanCreditsLabel(plan),
    displayFeatures: buildPlanFeatures(plan, plan.features || []),
    displayPrice: formatPlanPrice(plan),
    displayCadence: plan.cadence || "",
    featured: Boolean(plan.featured),
    theme: plan.theme || ""
  })), []);

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-heading">
        <p className="section-label section-label-pricing">Pricing</p>
        <h2>Simple pricing</h2>
        <p className="pricing-intro">
          The goal is to keep Ajuma accessible for job seekers at different stages on their journey.
        </p>
      </div>

      {plansError && plans.length ? (
        <p className="pricing-intro pricing-status-note">{plansError}</p>
      ) : null}

      {displayPlans.length ? (
        <div className="pricing-grid">
          {displayPlans.map((plan) => (
            <article
              className={`pricing-card${plan.featured ? " pricing-card-featured" : ""}${plan.theme === "dark" ? " pricing-card-dark" : ""}`}
              key={plan.id}
            >
              <div className="pricing-card-top">
                <p className="pricing-name">{plan.name}</p>
                <div className="pricing-amount">
                  <strong>{plan.displayPrice}</strong>
                  <span>{plan.displayCadence}</span>
                </div>
                <p className="pricing-description">{plan.displayDescription}</p>
              </div>

              <ul className="pricing-list">
                {plan.displayFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                className={`button pricing-button pricing-button-${plan.code}`}
                type="button"
                onClick={() => onChoosePlan?.(plan)}
              >
                Choose {plan.name}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="pricing-intro">{plansError || "Pricing is temporarily unavailable."}</p>
      )}

      <div className="pricing-note">
      
      </div>
    </section>
  );
}
