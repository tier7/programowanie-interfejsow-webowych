"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GameForm from "@/components/GameForm";
import { getGameById } from "@/lib/firestoreGames";
import { useAuth } from "@/context/AuthContext";

export default function EditGamePage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(
    function () {
      async function loadGame() {
        try {
          const loadedGame = await getGameById(params.id);

          if (!loadedGame) {
            setErrorMessage("Nie znaleziono gry do edycji.");
          } else {
            setGame(loadedGame);
          }
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

  if (authLoading || loading) {
    return <p className="empty-text">Ładowanie formularza...</p>;
  }

  if (!user) {
    return (
      <section className="empty-state-box">
        <p>Musisz być zalogowana, aby edytować grę.</p>
        <Link href="/">Wróć na stronę główną</Link>
      </section>
    );
  }

  if (errorMessage !== "") {
    return <p className="form-error">{errorMessage}</p>;
  }

  if (!game) {
    return <p className="empty-text">Brak danych gry.</p>;
  }

  if (game.ownerUid !== user.uid) {
    return (
      <section className="empty-state-box">
        <p>Możesz edytować tylko własne gry.</p>
        <Link href={`/games/${params.id}`}>Wróć do szczegółów</Link>
      </section>
    );
  }

  return <GameForm mode="edit" initialData={game} />;
}