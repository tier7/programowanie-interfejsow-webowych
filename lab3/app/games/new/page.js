import Link from "next/link";
import GameForm from "@/components/GameForm";

export default function NewGamePage() {
  return (
    <main className="page">
      <Link className="back-link" href="/">
        ← Powrót do listy
      </Link>

      <section className="form-card">
        <h1>Dodaj nową grę</h1>
        <GameForm mode="add" />
      </section>
    </main>
  );
}