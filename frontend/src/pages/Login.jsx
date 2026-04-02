// src/pages/Login.jsx
import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    onLogin();
  };

  const signup = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
    onLogin();
  };

  return (
    <div>
      <h2>Ajuma AI Login</h2>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
      <button onClick={signup}>Sign Up</button>
    </div>
  );
}