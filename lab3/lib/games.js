export async function getGames() {
    const response = await fetch("https://szandala.github.io/piwo-api/board-games.json");
    const data = await response.json();
  
    return data.board_games;
  }
  
  export async function getGameById(id) {
    const games = await getGames();
  
    return games.find(function (game) {
      return String(game.id) === String(id);
    });
  }