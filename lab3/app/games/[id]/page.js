"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  buildGamesList,
  deleteGame,
  fetchApiGames,
  getGameById,
  getGameImages,
  PLACEHOLDER_IMAGE
} from "@/lib/browserGames";

function getDescriptionText(description) {
  if (!description) {
    return ["Brak opisu."];
  }

  if (Array.isArray(description)) {
    return description;
  }

  return [description];
}

export default function GameDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(PLACEHOLDER_IMAGE);

  useEffect(
    function () {
      async function loadGame() {
        const apiGames = await fetchApiGames();
        const allGames = buildGamesList(apiGames);
        const foundGame = getGameById(allGames, id);

        if (foundGame) {
          const images = getGameImages(foundGame);
          setSelectedImage(images[0]);
        }

        setGame(foundGame);
        setLoading(false);
      }

      loadGame();
    },
    [id]
  );

  function handleDeleteGame() {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę grę?");

    if (!confirmed) {
      return;
    }

    deleteGame(game.id);
    router.push("/");
  }

  if (loading) {
    return (
      <main className="page">
        <p>Ładowanie gry...</p>
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

  const descriptions = getDescriptionText(game.description);
  const images = getGameImages(game);

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
            <Link className="edit-link" href={`/games/${game.id}/edit`}>
              Edytuj grę
            </Link>

            <button
              className="delete-game-button"
              type="button"
              onClick={handleDeleteGame}
            >
              Usuń grę
            </button>
          </div>

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
              <strong>Cena:</strong> {game.price_pln} zł
            </p>

            <p>
              <strong>Liczba graczy:</strong>{" "}
              {game.min_players} - {game.max_players}
            </p>

            <p>
              <strong>Średni czas gry:</strong>{" "}
              {game.avg_play_time_minutes} min
            </p>

            <p>
              <strong>Typ gry:</strong> {game.type || "brak danych"}
            </p>

            <p>
              <strong>Dodatek:</strong>{" "}
              {game.is_expansion ? "tak" : "nie"}
            </p>
          </div>

          {game.auction ? (
            <div className="auction-box">
              <h2>Aukcja</h2>

              <p>
                <strong>Cena początkowa:</strong>{" "}
                {game.auction.starting_price} zł
              </p>

              <p>
                <strong>Aktualna oferta:</strong>{" "}
                {game.auction.current_bid} zł
              </p>

              <p>
                <strong>Najwyższy licytujący:</strong>{" "}
                {game.auction.highest_bidder_uid}
              </p>
            </div>
          ) : (
            <div className="auction-box">
              <h2>Aukcja</h2>
              <p>Ta gra nie jest aktualnie wystawiona na aukcji.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}