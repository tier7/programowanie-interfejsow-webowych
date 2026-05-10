"use client";

import Link from "next/link";
import GameForm from "@/components/GameForm";
import { useAuth } from "@/context/AuthContext";

export default function NewGamePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="empty-text">Sprawdzam logowanie...</p>;
  }

  if (!user) {
    return (
      <section className="empty-state-box">
        <p>Musisz być zalogowana, aby dodać nową grę.</p>
        <Link href="/">Wróć na stronę główną</Link>
      </section>
    );
  }

  return <GameForm mode="create" />;
}