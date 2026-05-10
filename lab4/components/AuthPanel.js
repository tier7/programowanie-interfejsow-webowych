"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  signInWithGoogle
} from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function AuthPanel() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleEmailAuth(event) {
    event.preventDefault();
    setErrorMessage("");
    setBusy(true);

    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }

      setEmail("");
      setPassword("");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zalogować.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setErrorMessage("");
    setBusy(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error.message || "Logowanie Google nie powiodło się.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setErrorMessage("");
    setBusy(true);

    try {
      await logoutUser();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się wylogować.");
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <section className="auth-panel auth-panel-warning">
        <h2>Firebase nie jest jeszcze podłączony</h2>
        <p>Uzupełnij plik .env.local i skonfiguruj Authentication oraz Firestore.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="auth-panel auth-panel-loading">
        <p>Sprawdzam stan logowania...</p>
      </section>
    );
  }

  if (user) {
  return (
    <section className="auth-corner-box">
      <div className="auth-corner-text">
        <p className="auth-corner-label">Zalogowano jako</p>
        <p className="auth-corner-email">{user.email || "Konto bez adresu e-mail"}</p>
      </div>

      <button
        className="auth-main-button"
        type="button"
        onClick={handleLogout}
        disabled={busy}
      >
        {busy ? "Trwa..." : "Wyloguj"}
      </button>
    </section>
  );
}

  return (
    <section className="auth-panel">
      <div className="auth-panel-top">
        <div>
          <p className="auth-panel-label">Konto użytkownika</p>
          <h2 className="auth-panel-title">
            {isRegisterMode ? "Załóż konto" : "Zaloguj się"}
          </h2>
        </div>

        <button
          className="auth-toggle-button"
          type="button"
          onClick={function () {
            setIsRegisterMode(!isRegisterMode);
            setErrorMessage("");
          }}
        >
          {isRegisterMode ? "Mam już konto" : "Chcę się zarejestrować"}
        </button>
      </div>

      <p className="auth-panel-hint">
        Musisz być zalogowana, aby dodawać, edytować, usuwać i kupować gry.
      </p>

      {errorMessage !== "" ? <p className="form-error">{errorMessage}</p> : null}

      <form className="auth-form" onSubmit={handleEmailAuth}>
        <div className="auth-form-grid">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={function (event) {
                setEmail(event.target.value);
              }}
              required
            />
          </label>

          <label>
            Hasło
            <input
              type="password"
              value={password}
              onChange={function (event) {
                setPassword(event.target.value);
              }}
              minLength="6"
              required
            />
          </label>
        </div>

        <div className="auth-actions">
          <button className="auth-main-button" type="submit" disabled={busy}>
            {busy ? "Trwa..." : isRegisterMode ? "Zarejestruj" : "Zaloguj"}
          </button>

          <button
            className="auth-google-button"
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
          >
            Zaloguj przez Google
          </button>
        </div>
      </form>
    </section>
  );
}