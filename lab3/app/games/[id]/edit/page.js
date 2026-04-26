"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GameForm from "@/components/GameForm";
import {
  buildGamesList,
  fetchApiGames,
  getGameById
} from "@/lib/browserGames";

export default function EditGamePage() {
  const params = useParams();
  const id = params.id;

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    function () {
      async function loadGame() {
        const apiGames = await fetchApiGames();
        const allGames = buildGamesList(apiGames);
        const foundGame = getGameById(allGames, id);

        setGame(foundGame);
        setLoading(false);
      }

      loadGame();
    },
    [id]
  );

  if (loading) {
    return (
      <main className="page">
        <p>Ładowanie formularza...</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page">
        <Link className="back-link" href="/">
          ← Powrót do listy
        </Link>

        <p className="empty-text">Nie znaleziono gry do edycji.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <Link className="back-link" href={`/games/${game.id}`}>
        ← Powrót do szczegółów
      </Link>

      <section className="form-card">
        <h1>Edytuj grę</h1>
        <GameForm initialGame={game} mode="edit" />
      </section>
    </main>
  );
}