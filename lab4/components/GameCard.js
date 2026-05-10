"use client";

import Link from "next/link";
import {
  formatAuctionDate,
  getAuctionCurrentBid,
  getMainImage,
  hasAuction,
  isAuctionEnded,
  PLACEHOLDER_IMAGE,
  shortenDescription
} from "@/lib/gameUtils";

export default function GameCard({ game, currentUser, onDelete, busy }) {
  const imageSrc = getMainImage(game);
  const auctionEnabled = hasAuction(game);
  const auctionEnded = isAuctionEnded(game);
  const auctionWinnerExists = Boolean(
    auctionEnabled && auctionEnded && game?.auction?.currentBidderUid
  );
  const isOwner = Boolean(currentUser && game.ownerUid === currentUser.uid);
  const isSold = game.isAvailable === false || auctionWinnerExists;
  const currentBid = getAuctionCurrentBid(game);

  return (
    <article className={isSold ? "game-card sold-card" : "game-card"}>
      <img
        className="game-image"
        src={imageSrc}
        alt={game.title}
        onError={function (event) {
          event.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
      />

      <div className="game-content">
        <div className="card-top-line">
          <h2>{game.title}</h2>

          <div className="card-badges">
            <span
              className={
                isSold ? "status-badge sold-badge" : "status-badge available-badge"
              }
            >
              {isSold ? "Sprzedane" : "Dostępne"}
            </span>

            {auctionEnabled ? (
              <span className="status-badge available-badge">Licytacja</span>
            ) : null}
          </div>
        </div>

        <p className="game-description">{shortenDescription(game.description)}</p>

        <div className="game-info">
          <p>
            <strong>Wydawca:</strong> {game.publisher || "brak danych"}
          </p>

          <p>
            <strong>Kup teraz:</strong> {game.price_pln} zł
          </p>

          {auctionEnabled ? (
            <>
              <p>
                <strong>Aktualna oferta:</strong> {currentBid} zł
              </p>
              <p>
                <strong>Liczba ofert:</strong> {Number(game?.auction?.bidCount ?? 0)}
              </p>
              <p>
                <strong>Koniec licytacji:</strong> {formatAuctionDate(game?.auction?.endAt)}
              </p>
            </>
          ) : null}

          <p>
            <strong>Liczba graczy:</strong> {game.min_players} - {game.max_players}
          </p>

          <p>
            <strong>Czas gry:</strong> {game.avg_play_time_minutes} min
          </p>

          <p>
            <strong>Typ:</strong> {game.type || "brak danych"}
          </p>

          <p>
            <strong>Wystawił:</strong> {game.ownerEmail || "konto systemowe"}
          </p>
        </div>

        <div className="card-actions">
          <Link className="details-link" href={`/games/${game.id}`}>
            Szczegóły
          </Link>

          {isOwner ? (
            <>
              <Link className="edit-link" href={`/games/${game.id}/edit`}>
                Edytuj
              </Link>

              <button
                className="delete-game-button"
                type="button"
                disabled={busy}
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
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}