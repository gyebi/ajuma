import { useState } from "react";
import Login from "./pages/Login";
import UploadResume from "./pages/UploadResume";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";

export default function App() {
  const [step, setStep] = useState("login");
  const [resumeData, setResumeData] = useState(null);
  const [profile, setProfile] = useState(null);

  if (step === "login") {
    return <Login onLogin={() => setStep("upload")} />;
  }

  if (step === "upload") {
    return (
      <UploadResume
        onNext={(nextResumeData) => {
          setResumeData(nextResumeData);
          setStep("profile");
        }}
      />
    );
  }

  if (step === "profile") {
    return (
      <Profile
        profile={profile}
        resumeData={resumeData}
        onProfileGenerated={setProfile}
        onNext={() => setStep("jobs")}
      />
    );
  }

  if (step === "jobs") {
    return <Jobs profile={profile} resumeData={resumeData} />;
  }

  return null;
}
