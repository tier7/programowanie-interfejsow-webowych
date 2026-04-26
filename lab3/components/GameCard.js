"use client";

import Link from "next/link";
import { getMainImage, PLACEHOLDER_IMAGE } from "@/lib/browserGames";

function getDescriptionText(description) {
  if (!description) {
    return "Brak opisu.";
  }

  if (Array.isArray(description)) {
    return description.join(" ");
  }

  return description;
}

function shortenDescription(description) {
  const descriptionText = getDescriptionText(description);

  if (descriptionText.length > 160) {
    return descriptionText.slice(0, 160) + "...";
  }

  return descriptionText;
}

export default function GameCard({ game, onDelete }) {
  const imageSrc = getMainImage(game);

  return (
    <article className="game-card">
      <img
        className="game-image"
        src={imageSrc}
        alt={game.title}
        onError={function (event) {
          event.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
      />

      <div className="game-content">
        <h2>{game.title}</h2>

        <p className="game-description">
          {shortenDescription(game.description)}
        </p>

        <div className="game-info">
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
            <strong>Czas gry:</strong> {game.avg_play_time_minutes} min
          </p>

          <p>
            <strong>Typ:</strong> {game.type || "brak danych"}
          </p>
        </div>

        <div className="card-actions">
          <Link className="details-link" href={`/games/${game.id}`}>
            Szczegóły
          </Link>

          <Link className="edit-link" href={`/games/${game.id}/edit`}>
            Edytuj
          </Link>

          {onDelete ? (
            <button
              className="delete-game-button"
              type="button"
              onClick={function () {
                const confirmed = window.confirm(
                  "Czy na pewno chcesz usunąć tę grę?"
                );

                if (confirmed) {
                  onDelete(game.id);
                }
              }}
            >
              Usuń
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}