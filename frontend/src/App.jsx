import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Jobs from "./pages/Jobs";
import FavoriteJobs from "./pages/FavoriteJobs";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import PaymentCallback from "./pages/PaymentCallback";
import Profile from "./pages/Profile";
import StarterCv from "./pages/StarterCv";
import UploadResume from "./pages/UploadResume";
import { fetchSavedFlow, saveFlow } from "./services/flowApi";
import {
  fetchPublicPlans,
  initializePayment
} from "./services/paymentApi";
import {
  formatPlanPrice,
  getPlanCreditsLabel,
  normalizePlanKey
} from "./utils/plans";

function findPlanById(plans, planId) {
  const normalizedPlanId = normalizePlanKey(planId);

  return plans.find((plan) => (
    normalizePlanKey(plan.id) === normalizedPlanId
    || normalizePlanKey(plan.code) === normalizedPlanId
    || normalizePlanKey(plan.name) === normalizedPlanId
  )) || null;
}

function getStoredFlow(userId) {
  const saved = window.localStorage.getItem(`ajuma-flow:${userId}`);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch (_error) {
    window.localStorage.removeItem(`ajuma-flow:${userId}`);
    return null;
  }
}

function hasPostPaymentApplicationsIntent() {
  const searchParams = new URLSearchParams(window.location.search);
  return (
    searchParams.get("workflow") === "applications"
    || window.localStorage.getItem("ajuma-post-payment-intent") === "applications"
  );
}

function clearPostPaymentApplicationsIntent() {
  window.localStorage.removeItem("ajuma-post-payment-intent");

  if (window.location.search.includes("workflow=applications")) {
    const nextUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl || "/");
  }
}

function inferStepFromFlow(flow = {}) {
  const restoredOnboarding = flow.onboardingData || null;
  const restoredResume = flow.resumeData || null;
  const restoredProfile = flow.profile || null;
  const hasUsableResumeText = Boolean(restoredResume?.resumeText);

  return restoredProfile
    ? "jobs"
    : hasUsableResumeText
      ? "profile"
      : restoredResume?.extractionFailed
        ? "starterCv"
        : restoredOnboarding?.hasCv === "yes"
          ? "upload"
          : restoredOnboarding
            ? "starterCv"
            : "onboarding";
}

function inferApplicationsStepFromFlow(flow = {}) {
  const restoredOnboarding = flow.onboardingData || null;
  const restoredResume = flow.resumeData || null;
  const restoredProfile = flow.profile || null;
  const hasUsableResumeText = Boolean(restoredResume?.resumeText);

  return restoredProfile
    ? "jobs"
    : hasUsableResumeText
      ? "profile"
      : restoredResume?.extractionFailed
        ? "starterCv"
        : restoredOnboarding?.hasCv === "yes"
          ? "upload"
          : restoredOnboarding
            ? "starterCv"
            : "onboarding";
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const hasPaymentReference = Boolean(searchParams.get("reference") || searchParams.get("trxref"));
  const isPaymentCallback = window.location.pathname === "/payment/callback" || hasPaymentReference;
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [appStep, setAppStep] = useState("onboarding");
  const [onboardingData, setOnboardingData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [pendingCheckoutPlanId, setPendingCheckoutPlanId] = useState("");
  const [checkoutPlans, setCheckoutPlans] = useState([]);
  const [checkoutError, setCheckoutError] = useState("");
  const [hasRestoredFlow, setHasRestoredFlow] = useState(false);
  const [isLoadingCheckoutPlan, setIsLoadingCheckoutPlan] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const pendingCheckoutPlan = pendingCheckoutPlanId
    ? findPlanById(checkoutPlans, pendingCheckoutPlanId)
    : null;

  function resetToOnboarding() {
    setResumeData(null);
    setProfile(null);
    setAppStep("onboarding");
  }

  function applySavedFlow(flow, options = {}) {
    const restoredOnboarding = flow?.onboardingData || null;
    const restoredResume = flow?.resumeData || null;
    const restoredProfile = flow?.profile || null;
    const restoredFavoriteJobs = Array.isArray(flow?.favoriteJobs)
      ? flow.favoriteJobs
      : [];

    const savedStep = flow?.appStep;
    const inferredStep = inferStepFromFlow(flow);
    const shouldUseInferredStep = !savedStep || (
      savedStep === "onboarding" &&
      restoredOnboarding?.hasCv === "yes" &&
      !restoredResume
    );

    setAppStep(
      options.preferApplications
        ? inferApplicationsStepFromFlow(flow)
        : shouldUseInferredStep
          ? inferredStep
          : savedStep
    );
    setOnboardingData(restoredOnboarding);
    setResumeData(restoredResume);
    setProfile(restoredProfile);
    setFavoriteJobs(restoredFavoriteJobs);
  }

  function toggleFavoriteJob(job) {
    setFavoriteJobs((current) => {
      const isFavorite = current.some((favoriteJob) => favoriteJob.id === job.id);

      return isFavorite
        ? current.filter((favoriteJob) => favoriteJob.id !== job.id)
        : [{ ...job, favoritedAt: new Date().toISOString() }, ...current];
    });
  }

  function handleChoosePlan(plan) {
    if (!plan?.id) {
      return;
    }

    setPendingCheckoutPlanId(plan.id);
    setCheckoutPlans((currentPlans) => {
      const existingPlan = findPlanById(currentPlans, plan.id);

      return existingPlan
        ? currentPlans.map((currentPlan) => (
          normalizePlanKey(currentPlan.id) === normalizePlanKey(plan.id)
            ? { ...currentPlan, ...plan }
            : currentPlan
        ))
        : [...currentPlans, plan];
    });
    setCheckoutError("");

    if (!currentUser) {
      setShowAuth(true);
    }
  }

  function clearPendingCheckout() {
    setPendingCheckoutPlanId("");
    setCheckoutError("");
    setIsStartingCheckout(false);
    setIsLoadingCheckoutPlan(false);
  }

  useEffect(() => {
    if (isPaymentCallback) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, [isPaymentCallback]);

  useEffect(() => {
    if (!currentUser) {
      setAppStep("onboarding");
      setOnboardingData(null);
      setResumeData(null);
      setProfile(null);
      setFavoriteJobs([]);
      setHasRestoredFlow(false);
      return;
    }

    let isMounted = true;
    setHasRestoredFlow(false);

    async function restoreFlow() {
      const localFlow = getStoredFlow(currentUser.uid);
      const shouldContinueToApplications = hasPostPaymentApplicationsIntent();

      if (localFlow && isMounted) {
        applySavedFlow(localFlow, { preferApplications: shouldContinueToApplications });
      }

      try {
        const response = await fetchSavedFlow();
        const remoteFlow = response.flow;

        if (isMounted && remoteFlow) {
          applySavedFlow(remoteFlow, { preferApplications: shouldContinueToApplications });
          window.localStorage.setItem(`ajuma-flow:${currentUser.uid}`, JSON.stringify(remoteFlow));
        }

        if (isMounted && !remoteFlow && !localFlow) {
          setAppStep("onboarding");
          setOnboardingData(null);
          setResumeData(null);
          setProfile(null);
          setFavoriteJobs([]);
        }
      } catch (error) {
        console.error("Saved setup restore failed", error);

        if (isMounted && !localFlow) {
          setAppStep("onboarding");
          setOnboardingData(null);
          setResumeData(null);
          setProfile(null);
          setFavoriteJobs([]);
        }
      } finally {
        if (isMounted) {
          if (shouldContinueToApplications) {
            clearPostPaymentApplicationsIntent();
          }

          setHasRestoredFlow(true);
        }
      }
    }

    restoreFlow();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !hasRestoredFlow) {
      return;
    }

    const flow = {
      appStep,
      onboardingData,
      resumeData,
      profile,
      favoriteJobs
    };

    window.localStorage.setItem(`ajuma-flow:${currentUser.uid}`, JSON.stringify(flow));
    saveFlow(flow).catch((error) => {
      console.error("Saved setup sync failed", error);
    });
  }, [appStep, currentUser, favoriteJobs, hasRestoredFlow, onboardingData, profile, resumeData]);

  useEffect(() => {
    if (!currentUser || !pendingCheckoutPlanId) {
      return undefined;
    }

    let isMounted = true;
    setIsLoadingCheckoutPlan(true);

    async function loadCheckoutPlans() {
      try {
        const response = await fetchPublicPlans();

        if (isMounted) {
          setCheckoutPlans(response.plans || []);
          setCheckoutError("");
        }
      } catch (error) {
        console.error("Checkout plan load failed", error);

        if (isMounted) {
          setCheckoutError("Unable to load the latest plan details.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCheckoutPlan(false);
        }
      }
    }

    loadCheckoutPlans();

    return () => {
      isMounted = false;
    };
  }, [currentUser, pendingCheckoutPlanId]);

  async function startPendingCheckout() {
    if (!pendingCheckoutPlanId) {
      return;
    }

    const email = auth.currentUser?.email || currentUser?.email;

    if (!email) {
      setCheckoutError("We need your account email before starting payment.");
      return;
    }

    setCheckoutError("");
    setIsStartingCheckout(true);

    try {
      const response = await initializePayment(pendingCheckoutPlanId, email);
      const authorizationUrl = response?.payment?.authorizationUrl || response?.paystack?.authorization_url;

      if (!authorizationUrl) {
        throw new Error("Payment link is missing from the Paystack response.");
      }

      window.location.assign(authorizationUrl);
    } catch (error) {
      console.error("Landing checkout failed", error);
      setCheckoutError(error.message || "Unable to start payment right now.");
      setIsStartingCheckout(false);
    }
  }

  if (isPaymentCallback) {
    return <PaymentCallback />;
  }

  if (currentUser) {
    return (
      <div className="app-shell">
        <header className="app-topbar">
          <div>
            <p className="section-label section-label-workflow">Ajuma AI Workflow</p>
            <h1 className="app-shell-title">Welcome back{onboardingData?.fullName ? `, ${onboardingData.fullName}` : ""}.</h1>
          </div>

          <div className="profile-actions">
            <button className="button button-secondary" type="button" onClick={resetToOnboarding}>
              Reset to Onboarding
            </button>
            <button className="button button-secondary" type="button" onClick={() => setAppStep("favorites")}>
              My Favorites ({favoriteJobs.length})
            </button>
            <button className="signin-link" type="button" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
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
              onNeedsManualEntry={(data) => {
                setResumeData(data);
                setProfile(null);
                setAppStep("starterCv");
              }}
            />
          ) : null}

          {appStep === "starterCv" ? (
            <StarterCv
              onboardingData={onboardingData}
              resumeData={resumeData}
              onNext={(data) => {
                setResumeData(data);
                setAppStep("profile");
              }}
            />
          ) : null}

          {appStep === "profile" ? (
            <Profile
              onboardingData={onboardingData}
              profile={profile}
              resumeData={resumeData}
              onProfileGenerated={setProfile}
              onReloadCv={() => {
                setResumeData(null);
                setProfile(null);
                setAppStep(onboardingData?.hasCv === "yes" ? "upload" : "starterCv");
              }}
              onNext={() => setAppStep("jobs")}
            />
          ) : null}

          {appStep === "jobs" ? (
            <Jobs
              favoriteJobs={favoriteJobs}
              profile={profile}
              resumeData={resumeData}
              onboardingData={onboardingData}
              onBack={() => setAppStep("profile")}
              onGoToFavorites={() => setAppStep("favorites")}
              onToggleFavorite={toggleFavoriteJob}
            />
          ) : null}

          {appStep === "favorites" ? (
            <FavoriteJobs
              favoriteJobs={favoriteJobs}
              onApply={(job) => {
                if (job.url) {
                  window.open(job.url, "_blank", "noopener,noreferrer");
                }
              }}
              onBack={() => setAppStep(profile ? "jobs" : "onboarding")}
              onRemoveFavorite={toggleFavoriteJob}
            />
          ) : null}
        </main>

        {pendingCheckoutPlanId ? (
          <div className="auth-overlay" role="presentation" onClick={clearPendingCheckout}>
            <div className="auth-modal checkout-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <p className="section-label section-label-pricing">Confirm Plan</p>
              <h2>Complete payment before CV setup.</h2>

              {isLoadingCheckoutPlan ? (
                <p className="auth-intro">Loading the latest price and credit details...</p>
              ) : pendingCheckoutPlan ? (
                <>
                  <p className="auth-intro">
                    You selected {pendingCheckoutPlan.name}. Confirm the package below, then continue to Paystack.
                  </p>

                  <div className="checkout-summary">
                    <span>{pendingCheckoutPlan.name}</span>
                    <strong>{formatPlanPrice(pendingCheckoutPlan)}</strong>
                    <p>{getPlanCreditsLabel(pendingCheckoutPlan)}</p>
                  </div>
                </>
              ) : (
                <p className="auth-intro">This plan is not available right now.</p>
              )}

              {checkoutError ? <p className="auth-error">{checkoutError}</p> : null}

              <div className="profile-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={clearPendingCheckout}
                  disabled={isStartingCheckout}
                >
                  Choose Later
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={startPendingCheckout}
                  disabled={isLoadingCheckoutPlan || isStartingCheckout || !pendingCheckoutPlan}
                >
                  {isStartingCheckout ? "Redirecting to Paystack..." : "Continue to Paystack"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <LandingPage
      currentUser={currentUser}
      showAuth={showAuth}
      onChoosePlan={handleChoosePlan}
      onCloseAuth={() => {
        setShowAuth(false);
        clearPendingCheckout();
      }}
      onSignIn={() => setShowAuth(true)}
    />
  );
}
