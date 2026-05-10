"use client";

import { useState } from "react";
import { importSampleGamesToFirestore } from "@/lib/firestoreGames";

export default function ImportSampleGamesButton({ user, onImported }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleImport() {
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const importedCount = await importSampleGamesToFirestore(user);
      setMessage(`Zaimportowano ${importedCount} przykładowych gier do Firestore.`);

      if (onImported) {
        await onImported();
      }
    } catch (error) {
      setErrorMessage(error.message || "Import danych nie powiódł się.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="empty-state-box">
      <p>
        Kolekcja Firestore jest pusta. Możesz jednym kliknięciem zaimportować
        przykładowe dane z laboratorium.
      </p>

      <button type="button" onClick={handleImport} disabled={busy}>
        {busy ? "Importuję dane..." : "Wczytaj przykładowe gry"}
      </button>

      {message !== "" ? <p className="success-text">{message}</p> : null}
      {errorMessage !== "" ? <p className="form-error">{errorMessage}</p> : null}
    </section>
  );
}