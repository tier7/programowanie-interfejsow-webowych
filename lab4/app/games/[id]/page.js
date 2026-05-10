"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { buyGame, deleteGame, getGameById, placeBid } from "@/lib/firestoreGames";
import {
  formatAuctionDate,
  getAuctionCurrentBid,
  getDescriptionLines,
  getGameImages,
  hasAuction,
  isAuctionEnded,
  PLACEHOLDER_IMAGE
} from "@/lib/gameUtils";

export default function GameDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(PLACEHOLDER_IMAGE);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  useEffect(
    function () {
      async function loadGame() {
        try {
          const foundGame = await getGameById(params.id);

          if (foundGame) {
            const images = getGameImages(foundGame);
            setSelectedImage(images[0] || PLACEHOLDER_IMAGE);
          }

          setGame(foundGame);
        } catch (error) {
          setErrorMessage(error.message || "Nie udało się pobrać gry.");
        } finally {
          setLoading(false);
        }
      }

      loadGame();
    },
    [params.id]
  );

  async function refreshGame() {
    const refreshed = await getGameById(params.id);
    setGame(refreshed);

    if (refreshed) {
      const images = getGameImages(refreshed);
      setSelectedImage(images[0] || PLACEHOLDER_IMAGE);
    }
  }

  async function handleDeleteGame() {
    if (!user || !game) {
      return;
    }

    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę grę?");

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteGame(game.id, user);
      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć gry.");
      setBusy(false);
    }
  }

  async function handleBuyGame() {
    if (!user || !game) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await buyGame(game.id, user);
      await refreshGame();
      setSuccessMessage("Gra została kupiona.");
    } catch (error) {
      setErrorMessage(error.message || "Zakup nie powiódł się.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePlaceBid(event) {
    event.preventDefault();

    if (!user || !game) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await placeBid(game.id, Number(bidAmount), user);
      setBidAmount("");
      await refreshGame();
      setSuccessMessage("Oferta została złożona.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się złożyć oferty.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <p>Ładowanie gry...</p>
      </main>
    );
  }

  if (errorMessage !== "" && !game) {
    return (
      <main className="page">
        <Link className="back-link" href="/">
          ← Powrót do listy
        </Link>

        <p className="form-error">{errorMessage}</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page">
        <Link className="back-link" href="/">
          ← Powrót do listy
        </Link>

        <p className="empty-text">Nie znaleziono gry.</p>
      </main>
    );
  }

  const descriptions = getDescriptionLines(game.description);
  const images = getGameImages(game);
  const auctionEnabled = hasAuction(game);
  const auctionEnded = isAuctionEnded(game);
  const auctionWinnerExists = Boolean(
    auctionEnabled && auctionEnded && game?.auction?.currentBidderUid
  );
  const isOwner = Boolean(user && game.ownerUid === user.uid);
  const isSold = game.isAvailable === false || auctionWinnerExists;
  const canBuy = Boolean(user && !isOwner && !isSold);
  const currentBid = getAuctionCurrentBid(game);

  return (
    <main className="page">
      <Link className="back-link" href="/">
        ← Powrót do listy
      </Link>

      <section className="details-card">
        <div className="details-gallery">
          <img
            className="details-image"
            src={selectedImage}
            alt={game.title}
            onError={function (event) {
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />

          {images.length > 1 ? (
            <div className="details-thumbnails">
              {images.map(function (imageSrc, index) {
                return (
                  <button
                    key={index}
                    type="button"
                    className={
                      selectedImage === imageSrc
                        ? "thumbnail-button active-thumbnail"
                        : "thumbnail-button"
                    }
                    onClick={function () {
                      setSelectedImage(imageSrc);
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt={game.title + " zdjęcie " + (index + 1)}
                      onError={function (event) {
                        event.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="details-content">
          <h1>{game.title}</h1>

          <div className="details-actions">
            {isOwner ? (
              <>
                <Link className="edit-link" href={`/games/${game.id}/edit`}>
                  Edytuj grę
                </Link>

                <button
                  className="delete-game-button"
                  type="button"
                  onClick={handleDeleteGame}
                  disabled={busy}
                >
                  Usuń grę
                </button>
              </>
            ) : (
              <button
                className={canBuy ? "buy-game-button" : "disabled-action-button"}
                type="button"
                disabled={!canBuy || busy}
                onClick={handleBuyGame}
              >
                {isSold ? "Niedostępne" : user ? `Kup teraz za ${game.price_pln} zł` : "Zaloguj się, aby kupić"}
              </button>
            )}

            <span
              className={
                isSold ? "status-badge sold-badge" : "status-badge available-badge"
              }
            >
              {auctionEnabled
                ? isSold
                  ? "Aukcja zakończona"
                  : "Kup teraz + licytacja"
                : isSold
                  ? "Sprzedane"
                  : "Dostępne"}
            </span>
          </div>

          {errorMessage !== "" ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage !== "" ? <p className="success-text">{successMessage}</p> : null}

          <div className="details-description">
            {descriptions.map(function (paragraph, index) {
              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          <div className="details-info">
            <p>
              <strong>Wydawca:</strong> {game.publisher || "brak danych"}
            </p>

            <p>
              <strong>Cena kup teraz:</strong> {game.price_pln} zł
            </p>

            {auctionEnabled ? (
              <>
                <p>
                  <strong>Cena startowa aukcji:</strong> {Number(game?.auction?.startPrice ?? 0)} zł
                </p>
                <p>
                  <strong>Aktualna oferta:</strong> {currentBid} zł
                </p>
              </>
            ) : null}

            <p>
              <strong>Liczba graczy:</strong> {game.min_players} - {game.max_players}
            </p>

            <p>
              <strong>Średni czas gry:</strong> {game.avg_play_time_minutes} min
            </p>

            <p>
              <strong>Typ gry:</strong> {game.type || "brak danych"}
            </p>

            <p>
              <strong>Dodatek:</strong> {game.is_expansion ? "tak" : "nie"}
            </p>

            <p>
              <strong>Sprzedający:</strong> {game.ownerEmail || "konto systemowe"}
            </p>
          </div>

          <div className="auction-box">
            <h2>Licytacja</h2>

            {!auctionEnabled ? (
              <p>Dla tej oferty nie włączono licytacji.</p>
            ) : (
              <>
                <p>
                  <strong>Cena startowa:</strong> {Number(game?.auction?.startPrice ?? 0)} zł
                </p>

                <p>
                  <strong>Aktualna oferta:</strong> {currentBid} zł
                </p>

                <p>
                  <strong>Liczba ofert:</strong> {Number(game?.auction?.bidCount ?? 0)}
                </p>

                <p>
                  <strong>Koniec licytacji:</strong> {formatAuctionDate(game?.auction?.endAt)}
                </p>

                <p>
                  <strong>Aktualny lider:</strong>{" "}
                  {game?.auction?.currentBidderEmail || "brak ofert"}
                </p>

                {auctionEnded ? (
                  <p className="auction-finished-text">
                    {game?.auction?.currentBidderEmail
                      ? `Licytacja zakończona. Najwyższa oferta: ${game.auction.currentBid} zł (${game.auction.currentBidderEmail}).`
                      : "Licytacja zakończona bez złożonych ofert."}
                  </p>
                ) : !user ? (
                  <p>Aby licytować, musisz się zalogować.</p>
                ) : isOwner ? (
                  <p>To Twoja aukcja — nie możesz składać własnych ofert.</p>
                ) : isSold ? (
                  <p>Ta oferta nie jest już dostępna.</p>
                ) : (
                  <form className="auction-bid-form" onSubmit={handlePlaceBid}>
                    <label>
                      Twoja oferta (PLN)
                      <input
                        type="number"
                        min={currentBid + 1}
                        step="0.01"
                        value={bidAmount}
                        onChange={function (event) {
                          setBidAmount(event.target.value);
                        }}
                        required
                      />
                    </label>

                    <button className="auth-main-button" type="submit" disabled={busy}>
                      {busy ? "Składam ofertę..." : "Złóż ofertę"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}