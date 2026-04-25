// src/pages/Jobs.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { pricingPlans as homepagePricingPlans } from "../content/homepage";
import { apiFetch } from "../services/api";
import { auth } from "../firebase";
import {
  consumeMyCredit,
  fetchMyEntitlement,
  fetchPlans,
  initializePayment
} from "../services/paymentApi";

function formatPostedAge(job) {
  if (typeof job.ageInDays !== "number") {
    return "Posted date unavailable";
  }

  if (job.ageInDays === 0) {
    return "Posted today";
  }

  if (job.ageInDays === 1) {
    return "Posted 1 day ago";
  }

  return `Posted ${job.ageInDays} days ago`;
}

function normalizePlanKey(value = "") {
  return String(value).trim().toLowerCase();
}

const homepagePlanLookup = new Map(
  homepagePricingPlans.map((plan) => [normalizePlanKey(plan.name), plan])
);

export default function Jobs({
  favoriteJobs,
  onBack,
  onGoToFavorites,
  onToggleFavorite,
  profile,
  resumeData,
  onboardingData
}) {
  const [jobs, setJobs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [hasLoadedBillingOnce, setHasLoadedBillingOnce] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const hasAutoFetchedRef = useRef(false);
  const favoriteJobIds = new Set(favoriteJobs.map((job) => job.id));
  const availableCredits = entitlement?.availableCredits;
  const hasUnlockedApplications = Number(availableCredits ?? 0) > 0;

  const loadBillingState = useCallback(async () => {
    setIsLoadingBilling(true);

    try {
      const [plansResponse, entitlementResponse] = await Promise.all([
        fetchPlans(),
        fetchMyEntitlement()
      ]);

      const nextPlans = plansResponse.plans || [];
      setPlans(nextPlans);
      setEntitlement(entitlementResponse.entitlement || null);
      setHasLoadedBillingOnce(true);

      if (!selectedPlanId && nextPlans.length) {
        const featuredPlan = nextPlans.find((plan) => plan.featured) || nextPlans[0];
        setSelectedPlanId(featuredPlan.id);
      }
    } catch (billingError) {
      console.error("Billing state load failed", {
        error: billingError
      });
      setError(billingError.message);
      setHasLoadedBillingOnce(true);
    } finally {
      setIsLoadingBilling(false);
    }
  }, [selectedPlanId]);

  const fetchJobs = useCallback(async () => {
    setError("");
    setIsLoading(true);

    console.info("Starting jobs fetch");

    try {
      await apiFetch("/jobs/sync", {
        method: "POST",
        body: JSON.stringify({
          profile,
          resumeText: resumeData?.resumeText || "",
          onboarding: onboardingData || {}
        })
      });

      const res = await apiFetch("/jobs", { method: "GET" });
      setJobs(res.jobs || []);
      console.info("Jobs fetch succeeded", {
        jobsCount: res.jobs?.length || 0
      });
    } catch (fetchError) {
      console.error("Jobs fetch failed", {
        error: fetchError
      });
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, profile, resumeData]);

  const applyToJob = async (job) => {
    if (!hasUnlockedApplications) {
      setIsPricingOpen(true);
      return;
    }

    if (!job.url) {
      setError("This job does not have an application link yet.");
      return;
    }

    setError("");

    try {
      const response = await consumeMyCredit();
      setEntitlement(response.entitlement || null);
      setHasLoadedBillingOnce(true);
      window.open(job.url, "_blank", "noopener,noreferrer");
    } catch (applyError) {
      console.error("Credit consumption failed", {
        error: applyError
      });
      setError(applyError.message);
    }
  };

  const startPlanCheckout = useCallback(async () => {
    console.log("Paystack button clicked", {
      selectedPlanId,
      currentUserEmail: auth.currentUser?.email || null,
      onboardingEmail: onboardingData?.email || null
    });

    if (!selectedPlanId) {
      console.error("Paystack init blocked: no selected plan");
      setError("Choose a plan to continue.");
      return;
    }

    const email = auth.currentUser?.email || onboardingData?.email;
    console.log("About to initialize payment", {
      planId: selectedPlanId,
      email
    });

    if (!email) {
      console.error("Paystack init blocked: missing email");
      setError("We need your account email before starting payment.");
      return;
    }

    setError("");
    setIsPaying(true);

    try {
      const response = await initializePayment(selectedPlanId, email);
      console.log("Initialize response:", response);
      const authorizationUrl = response?.payment?.authorizationUrl || response?.paystack?.authorization_url;

      if (!authorizationUrl) {
        console.error("Paystack init failed: missing authorizationUrl", response);
        throw new Error("Payment link is missing from the Paystack response.");
      }

      console.log("Redirecting to Paystack:", authorizationUrl);
      window.location.assign(authorizationUrl);
    } catch (paymentError) {
      console.error("Paystack init error:", paymentError);
      setError(paymentError.message);
    } finally {
      setIsPaying(false);
    }
  }, [onboardingData?.email, selectedPlanId]);

  useEffect(() => {
    if (hasAutoFetchedRef.current) {
      return;
    }

    hasAutoFetchedRef.current = true;
    fetchJobs();
    loadBillingState();
  }, [fetchJobs, loadBillingState]);

  const entitlementStatusText = !hasLoadedBillingOnce && isLoadingBilling
    ? "Checking your application credits..."
    : hasUnlockedApplications
      ? `You can apply to jobs now with ${availableCredits ?? 0} credits available.`
      : "Choose a plan to unlock job applications.";

  const entitlementBannerCopy = !hasLoadedBillingOnce && isLoadingBilling
    ? "We are syncing your latest billing status so your unlock state stays accurate."
    : hasUnlockedApplications
      ? "Your Paystack payment has unlocked your entitlement. Use your available credits to start applying."
      : "The jobs are visible immediately, but applications stay locked until a payment is verified and your entitlement is granted.";

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-jobs">Matched Jobs</p>
        <h1 className="app-title">Review roles aligned to your profile.</h1>
        <p className="app-subtitle">
          Your profile is ready. Ajuma is pulling matching opportunities for
          you now.
        </p>
      </div>

      <div className={`entitlement-banner${hasUnlockedApplications ? " entitlement-banner-active" : ""}`}>
        <div>
          <p className="section-label section-label-pricing">
            {!hasLoadedBillingOnce && isLoadingBilling
              ? "Checking Applications"
              : hasUnlockedApplications
                ? "Applications Unlocked"
                : "Applications Locked"}
          </p>
          <h2 className="entitlement-title">
            {entitlementStatusText}
          </h2>
          <p className="entitlement-copy">{entitlementBannerCopy}</p>
        </div>

        <div className="entitlement-actions">
          <div className="entitlement-stat">
            <span>Available Credits</span>
            <strong>{!hasLoadedBillingOnce && isLoadingBilling ? "..." : entitlement?.availableCredits ?? 0}</strong>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => setIsPricingOpen(true)}
            disabled={isLoadingBilling}
          >
            {hasUnlockedApplications ? "View Plans" : "Unlock Applications"}
          </button>
        </div>
      </div>

      <div className="jobs-summary">
        {resumeData?.filename ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Resume</span>
            <strong>{resumeData.filename}</strong>
          </div>
        ) : null}

        {profile?.summary ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Profile Summary</span>
            <strong>{profile.summary}</strong>
          </div>
        ) : null}
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button button-secondary" type="button" onClick={onGoToFavorites}>
          My Favorites ({favoriteJobs.length})
        </button>
        <button className="button button-primary" type="button" onClick={fetchJobs} disabled={isLoading}>
          {isLoading ? "Loading Jobs..." : "Refresh Jobs"}
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.length ? (
          jobs.map((job) => {
            const isFavorite = favoriteJobIds.has(job.id);

            return (
              <article className="job-card" key={job.id}>
                <div className="job-card-header">
                  <span className="profile-meta-label">Matched Role</span>
                  <button
                    className={`favorite-button${isFavorite ? " favorite-button-active" : ""}`}
                    type="button"
                    onClick={() => onToggleFavorite(job)}
                    aria-label={`${isFavorite ? "Remove" : "Add"} ${job.title} ${isFavorite ? "from" : "to"} favorites`}
                  >
                    <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
                  </button>
                </div>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
                {job.freshnessLabel ? (
                  <div className="job-freshness-row">
                    <span className={`job-freshness-badge job-freshness-${job.freshnessLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                      {job.freshnessLabel}
                    </span>
                    <span className="job-freshness-meta">{formatPostedAge(job)}</span>
                  </div>
                ) : null}
                {typeof job.matchScore === "number" ? (
                  <p><strong>Match Score:</strong> {job.matchScore}/100</p>
                ) : null}
                {Array.isArray(job.matchReasons) && job.matchReasons.length ? (
                  <p>{job.matchReasons.join(" • ")}</p>
                ) : null}
                <div className="job-card-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => onToggleFavorite(job)}
                  >
                    {isFavorite ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    className={`button ${hasUnlockedApplications ? "button-primary" : "button-secondary button-locked"}`}
                    type="button"
                    onClick={() => applyToJob(job)}
                  >
                    {hasUnlockedApplications ? "Apply" : "Unlock to Apply"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="job-card job-card-empty">
            <span className="profile-meta-label">Next Step</span>
            <h3>{isLoading ? "Finding matching jobs..." : "No strong matches yet."}</h3>
            <p>
              {isLoading
                ? "Ajuma is searching for roles that fit your profile and preferences."
                : "Try refreshing jobs after adjusting your profile, target role, or preferences."}
            </p>
          </div>
        )}
      </div>

      {isPricingOpen ? (
        <div className="auth-overlay" role="presentation" onClick={() => setIsPricingOpen(false)}>
          <div className="auth-modal pricing-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="auth-close" type="button" onClick={() => setIsPricingOpen(false)} aria-label="Close pricing modal">
              ×
            </button>

            <div className="pricing-heading">
              <p className="section-label section-label-pricing">Unlock Applications</p>
              <h2>Choose a plan to activate Apply.</h2>
              <p className="pricing-intro">
                Your jobs are already matched. Once payment is verified, your entitlement unlocks and the Apply button becomes active.
              </p>
            </div>

            <div className="pricing-grid pricing-grid-modal">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const marketingPlan = (
                  homepagePlanLookup.get(normalizePlanKey(plan.name))
                  || homepagePlanLookup.get(normalizePlanKey(plan.code))
                  || homepagePlanLookup.get(normalizePlanKey(plan.id))
                );
                const amount = plan.amount ?? plan.price ?? plan.priceAmount ?? plan.priceValue ?? "";
                const credits = plan.credits ?? plan.creditAmount ?? plan.creditCount ?? 0;
                const displayPrice = marketingPlan?.price || `${amount}`;
                const displayCadence = marketingPlan?.cadence || "";
                const displayDescription = marketingPlan?.description || plan.description || `${credits} application credits`;
                const displayFeatures = marketingPlan?.features || [
                  `${credits} application credits`,
                  plan.active === false ? "Currently unavailable" : "Instant unlock after payment"
                ];

                return (
                  <button
                    className={`pricing-card pricing-select-card${isSelected ? " pricing-select-card-active" : ""}`}
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="pricing-card-top">
                      <p className="pricing-name">{plan.name || plan.code || "Plan"}</p>
                      <div className="pricing-amount">
                        <strong>{displayPrice}</strong>
                        <span>{displayCadence || plan.currency || "GHS"}</span>
                      </div>
                      <p className="pricing-description">
                        {displayDescription}
                      </p>
                    </div>

                    <ul className="pricing-list">
                      {displayFeatures.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="profile-actions">
              <button className="button button-secondary" type="button" onClick={() => setIsPricingOpen(false)}>
                Not now
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={startPlanCheckout}
                disabled={isPaying || isLoadingBilling || !plans.length}
              >
                {isPaying ? "Redirecting to Paystack..." : "Continue to Paystack"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
