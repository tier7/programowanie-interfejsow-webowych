import AuthPanel from "@/components/AuthPanel";
import GameList from "@/components/GameList";

export default function Home() {
  return (
    <main className="page">
      <h1>PLANSZÓWKARNIA</h1>
      <AuthPanel />
      <GameList />
    </main>
  );
}