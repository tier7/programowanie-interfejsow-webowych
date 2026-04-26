import { getGames } from "@/lib/games";
import GameList from "@/components/GameList";

export default async function Home() {
  const games = await getGames();

  return (
    <main className="page">
      <h1>PLANSZÓWKARNIA</h1>

      <GameList games={games} />
    </main>
  );
}