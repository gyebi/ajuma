import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function Login({ onClose, onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      onLogin();
    } catch (authError) {
      setError(authError.message || "Unable to continue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in dialog">
          ×
        </button>

        <p className="section-label section-label-account">Account Access</p>
        <h2 id="auth-title">
          {mode === "signin" ? "Sign in to Ajuma AI" : "Create your Ajuma AI account"}
        </h2>
        <p className="auth-intro">
          {mode === "signin"
            ? "Continue your job search workflow, profile generation, and saved opportunities."
            : "Create an account to start building your profile and discovering better job matches."}
        </p>

        <div className="auth-switch">
          <button
            className={`auth-switch-button${mode === "signin" ? " auth-switch-active" : ""}`}
            type="button"
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            className={`auth-switch-button${mode === "signup" ? " auth-switch-active" : ""}`}
            type="button"
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="button button-primary auth-submit" type="button" onClick={submit} disabled={isSubmitting}>
          {isSubmitting
            ? "Working..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </div>
    </div>
  );
}
