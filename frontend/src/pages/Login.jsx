import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";

const PASSWORD_RESET_CONTINUE_URL = "https://www.ajuma-ai.com/";

function getAuthErrorMessage(error, mode) {
  const code = error?.code || "";

  const messages = {
    "auth/invalid-credential": "The email or password you entered is incorrect. Please check your details and try again.",
    "auth/user-not-found": "No account was found with that email address.",
    "auth/wrong-password": "The email or password you entered is incorrect. Please check your details and try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
    "auth/weak-password": "Please choose a stronger password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment, then try again.",
    "auth/network-request-failed": "We could not reach the sign-in service. Please check your connection and try again."
  };

  return messages[code] || (
    mode === "signin"
      ? "We could not sign you in. Please check your details and try again."
      : "We could not create your account right now. Please check your details and try again."
  );
}

function getPasswordResetErrorMessage(error) {
  const code = error?.code || "";

  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-email": "Enter your email address first, then request a reset link.",
    "auth/too-many-requests": "Too many reset attempts. Please wait a moment, then try again.",
    "auth/network-request-failed": "We could not reach the password reset service. Please check your connection and try again.",
    "auth/unauthorized-continue-uri": "Password reset is not fully configured for this domain yet.",
    "auth/invalid-continue-uri": "Password reset is not fully configured for this domain yet."
  };

  return messages[code] || "We could not send the password reset email right now. Please try again.";
}

export default function Login({ onClose, onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  async function submit() {
    const trimmedEmail = email.trim();

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      }

      onLogin();
    } catch (authError) {
      setError(getAuthErrorMessage(authError, mode));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendPasswordReset() {
    const trimmedEmail = email.trim();

    setError("");
    setNotice("");

    if (!trimmedEmail) {
      setError("Enter your email address first, then request a reset link.");
      return;
    }

    setIsSendingReset(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail, {
        url: PASSWORD_RESET_CONTINUE_URL,
        handleCodeInApp: false
      });
      setNotice("If an account exists for that email, we will send a password reset link.");
    } catch (authError) {
      setError(getPasswordResetErrorMessage(authError));
    } finally {
      setIsSendingReset(false);
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
            onChange={(event) => {
              setEmail(event.target.value);
              setNotice("");
            }}
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
        {notice ? <p className="auth-success">{notice}</p> : null}

        <button className="button button-primary auth-submit" type="button" onClick={submit} disabled={isSubmitting}>
          {isSubmitting
            ? "Working..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>

        {mode === "signin" ? (
          <button
            className="auth-link-button"
            type="button"
            onClick={sendPasswordReset}
            disabled={isSubmitting || isSendingReset}
          >
            {isSendingReset ? "Sending reset link..." : "Forgot password?"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
