import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Jobs from "./pages/Jobs";
import FavoriteJobs from "./pages/FavoriteJobs";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import StarterCv from "./pages/StarterCv";
import UploadResume from "./pages/UploadResume";

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [appStep, setAppStep] = useState("onboarding");
  const [onboardingData, setOnboardingData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [favoriteJobs, setFavoriteJobs] = useState([]);

  function resetToOnboarding() {
    setResumeData(null);
    setProfile(null);
    setAppStep("onboarding");
  }

  function toggleFavoriteJob(job) {
    setFavoriteJobs((current) => {
      const isFavorite = current.some((favoriteJob) => favoriteJob.id === job.id);

      return isFavorite
        ? current.filter((favoriteJob) => favoriteJob.id !== job.id)
        : [{ ...job, favoritedAt: new Date().toISOString() }, ...current];
    });
  }

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
      setFavoriteJobs([]);
      return;
    }

    const saved = window.localStorage.getItem(`ajuma-flow:${currentUser.uid}`);

    if (!saved) {
      setAppStep("onboarding");
      setOnboardingData(null);
      setResumeData(null);
      setProfile(null);
      setFavoriteJobs([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const restoredOnboarding = parsed.onboardingData || null;
      const restoredResume = parsed.resumeData || null;
      const restoredProfile = parsed.profile || null;
      const restoredFavoriteJobs = Array.isArray(parsed.favoriteJobs)
        ? parsed.favoriteJobs
        : [];

      // Infer the safest next step so returning users can continue quickly.
      const inferredStep = restoredProfile
        ? "jobs"
        : restoredResume
          ? "profile"
          : restoredOnboarding?.hasCv === "yes"
            ? "upload"
            : restoredOnboarding
              ? "starterCv"
              : "onboarding";

      const savedStep = parsed.appStep;
      const shouldUseInferredStep = !savedStep || (
        savedStep === "onboarding" &&
        restoredOnboarding?.hasCv === "yes" &&
        !restoredResume
      );

      setAppStep(shouldUseInferredStep ? inferredStep : savedStep);
      setOnboardingData(restoredOnboarding);
      setResumeData(restoredResume);
      setProfile(restoredProfile);
      setFavoriteJobs(restoredFavoriteJobs);
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
        profile,
        favoriteJobs
      })
    );
  }, [appStep, currentUser, favoriteJobs, onboardingData, profile, resumeData]);

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
      </div>
    );
  }

  return (
    <LandingPage
      currentUser={currentUser}
      showAuth={showAuth}
      onCloseAuth={() => setShowAuth(false)}
      onSignIn={() => setShowAuth(true)}
    />
  );
}
