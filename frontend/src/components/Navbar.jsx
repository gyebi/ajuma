import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar({ currentUser, onSignIn }) {
  return (
    <header className="topbar">
      <a className="brand" href="#hero">
        <span className="brand-mark">A</span>
        <span>Ajuma AI</span>
      </a>

      <nav className="nav">
        <a href="#how-it-works">How it works</a>
        <a href="#who-its-for">Who it's for</a>
        <a href="#pricing">Pricing</a>
      </nav>

      {currentUser ? (
        <div className="auth-state">
          <span className="auth-user-pill">{currentUser.email}</span>
          <button className="signin-link" type="button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      ) : (
        <button className="signin-link" type="button" onClick={onSignIn}>
          Sign in
        </button>
      )}
    </header>
  );
}
