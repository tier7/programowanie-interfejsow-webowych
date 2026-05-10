"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, updateGame } from "@/lib/firestoreGames";
import { useAuth } from "@/context/AuthContext";

function toDatetimeLocalValue(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function mapGameToFormValues(initialData) {
  if (!initialData) {
    return {
      title: "",
      publisher: "",
      type: "",
      price_pln: "",
      min_players: "",
      max_players: "",
      avg_play_time_minutes: "",
      description: "",
      images: "",
      is_expansion: false,
      auctionEnabled: false,
      auctionStartPrice: "",
      auctionEndAt: ""
    };
  }

  return {
    title: initialData.title || "",
    publisher: initialData.publisher || "",
    type: initialData.type || "",
    price_pln: initialData.price_pln ?? "",
    min_players: initialData.min_players ?? "",
    max_players: initialData.max_players ?? "",
    avg_play_time_minutes: initialData.avg_play_time_minutes ?? "",
    description: Array.isArray(initialData.description)
      ? initialData.description.join("\n")
      : initialData.description || "",
    images: Array.isArray(initialData.images) ? initialData.images.join("\n") : "",
    is_expansion: Boolean(initialData.is_expansion),
    auctionEnabled: Boolean(initialData.auction),
    auctionStartPrice: initialData.auction ? Number(initialData.auction.startPrice ?? 0) : "",
    auctionEndAt: initialData.auction ? toDatetimeLocalValue(initialData.auction.endAt) : ""
  };
}

export default function GameForm({ initialData = null, mode = "create" }) {
  const router = useRouter();
  const { user } = useAuth();
  const [formValues, setFormValues] = useState(mapGameToFormValues(initialData));
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditMode = useMemo(function () {
    return mode === "edit";
  }, [mode]);

  const existingAuctionHasBids = Boolean(
    initialData?.auction && Number(initialData?.auction?.bidCount ?? 0) > 0
  );

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormValues(function (previousValues) {
      return {
        ...previousValues,
        [name]: type === "checkbox" ? checked : value
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Musisz być zalogowana, aby zapisać grę.");
      return;
    }

    const buyNowPrice = Number(formValues.price_pln);

    if (!Number.isFinite(buyNowPrice) || buyNowPrice <= 0) {
      setErrorMessage("Cena kup teraz musi być większa od 0.");
      return;
    }

    if (formValues.auctionEnabled) {
      const auctionStartPrice = Number(formValues.auctionStartPrice);

      if (!Number.isFinite(auctionStartPrice) || auctionStartPrice <= 0) {
        setErrorMessage("Cena startowa aukcji musi być większa od 0.");
        return;
      }

      if (auctionStartPrice >= buyNowPrice) {
        setErrorMessage("Cena startowa aukcji musi być niższa niż cena kup teraz.");
        return;
      }

      if (formValues.auctionEndAt === "") {
        setErrorMessage("Podaj datę zakończenia licytacji.");
        return;
      }

      const endAtDate = new Date(formValues.auctionEndAt);

      if (Number.isNaN(endAtDate.getTime()) || endAtDate.getTime() <= Date.now()) {
        setErrorMessage("Data zakończenia aukcji musi być w przyszłości.");
        return;
      }

      if (existingAuctionHasBids) {
        const currentBid = Number(initialData?.auction?.currentBid ?? 0);

        if (buyNowPrice <= currentBid) {
          setErrorMessage("Cena kup teraz musi być wyższa niż aktualna oferta w licytacji.");
          return;
        }
      }
    }

    setBusy(true);

    try {
      const payload = {
        title: formValues.title,
        publisher: formValues.publisher,
        type: formValues.type,
        price_pln: buyNowPrice,
        min_players: Number(formValues.min_players),
        max_players: Number(formValues.max_players),
        avg_play_time_minutes: Number(formValues.avg_play_time_minutes),
        description: formValues.description,
        images: formValues.images
          .split("\n")
          .map(function (line) {
            return line.trim();
          })
          .filter(function (line) {
            return line !== "";
          }),
        is_expansion: formValues.is_expansion,
        auction: formValues.auctionEnabled
          ? {
              startPrice: Number(formValues.auctionStartPrice),
              currentBid: existingAuctionHasBids
                ? Number(initialData?.auction?.currentBid ?? formValues.auctionStartPrice)
                : Number(formValues.auctionStartPrice),
              currentBidderUid: existingAuctionHasBids
                ? initialData?.auction?.currentBidderUid ?? null
                : null,
              currentBidderEmail: existingAuctionHasBids
                ? initialData?.auction?.currentBidderEmail ?? null
                : null,
              bidCount: existingAuctionHasBids
                ? Number(initialData?.auction?.bidCount ?? 0)
                : 0,
              endAt: new Date(formValues.auctionEndAt).toISOString()
            }
          : null
      };

      if (isEditMode && initialData?.id) {
        await updateGame(initialData.id, payload, user);
        router.push(`/games/${initialData.id}`);
      } else {
        const createdId = await createGame(payload, user);
        router.push(`/games/${createdId}`);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zapisać gry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="form-shell">
        <div className="form-shell-header">
          <p className="form-shell-label">Oferta gry</p>
          <h1>{isEditMode ? "Edytuj grę" : "Dodaj nową grę"}</h1>
          <p className="form-shell-subtitle">
            Możesz ustawić cenę kup teraz oraz opcjonalnie włączyć licytację.
          </p>
        </div>

        {errorMessage !== "" ? <p className="form-error">{errorMessage}</p> : null}

        <form className="game-form" onSubmit={handleSubmit}>
          <div className="game-form-grid">
            <label>
              Tytuł
              <input
                name="title"
                value={formValues.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Wydawca
              <input
                name="publisher"
                value={formValues.publisher}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Typ gry
              <input
                name="type"
                value={formValues.type}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Cena kup teraz (PLN)
              <input
                name="price_pln"
                type="number"
                min="1"
                value={formValues.price_pln}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Minimalna liczba graczy
              <input
                name="min_players"
                type="number"
                min="1"
                value={formValues.min_players}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Maksymalna liczba graczy
              <input
                name="max_players"
                type="number"
                min="1"
                value={formValues.max_players}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Średni czas gry (min)
              <input
                name="avg_play_time_minutes"
                type="number"
                min="1"
                value={formValues.avg_play_time_minutes}
                onChange={handleChange}
                required
              />
            </label>

            <label className="checkbox-tile">
              <span>Czy to jest dodatek?</span>
              <div className="checkbox-inline">
                <input
                  name="is_expansion"
                  type="checkbox"
                  checked={formValues.is_expansion}
                  onChange={handleChange}
                />
                <span>Tak, to dodatek</span>
              </div>
            </label>

            <label className="checkbox-tile">
              <span>Licytacja</span>
              <div className="checkbox-inline">
                <input
                  name="auctionEnabled"
                  type="checkbox"
                  checked={formValues.auctionEnabled}
                  onChange={handleChange}
                  disabled={existingAuctionHasBids}
                />
                <span>Włącz dodatkową licytację</span>
              </div>
            </label>

            {formValues.auctionEnabled ? (
              <>
                <label>
                  Cena startowa aukcji
                  <input
                    name="auctionStartPrice"
                    type="number"
                    min="1"
                    value={formValues.auctionStartPrice}
                    onChange={handleChange}
                    required
                    disabled={existingAuctionHasBids}
                  />
                </label>

                <label>
                  Koniec licytacji
                  <input
                    name="auctionEndAt"
                    type="datetime-local"
                    value={formValues.auctionEndAt}
                    onChange={handleChange}
                    required
                  />
                </label>
              </>
            ) : null}
          </div>

          <label className="full-width-field">
            Opis
            <textarea
              name="description"
              rows="7"
              value={formValues.description}
              onChange={handleChange}
              required
            />
          </label>

          <label className="full-width-field">
            Obrazy (jeden link lub ścieżka w osobnej linii)
            <textarea
              name="images"
              rows="5"
              value={formValues.images}
              onChange={handleChange}
            />
          </label>

          <div className="form-actions">
            <button className="auth-main-button" type="submit" disabled={busy}>
              {busy ? "Zapisuję..." : isEditMode ? "Zapisz zmiany" : "Dodaj grę"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}