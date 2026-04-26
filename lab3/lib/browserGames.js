export const API_URL = "https://szandala.github.io/piwo-api/board-games.json";
export const IMAGE_BASE_URL = "https://szandala.github.io/piwo-api/images/board-games/";
export const PLACEHOLDER_IMAGE = "/placeholder.png";

function getStoredArray(key) {
  if (typeof window === "undefined") {
    return [];
  }

  const savedValue = localStorage.getItem(key);

  if (!savedValue) {
    return [];
  }

  try {
    return JSON.parse(savedValue);
  } catch {
    return [];
  }
}

function setStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fetchApiGames() {
  const response = await fetch(API_URL);
  const data = await response.json();

  return data.board_games;
}

export function getCustomGames() {
  return getStoredArray("customBoardGames");
}

export function getEditedGames() {
  return getStoredArray("editedBoardGames");
}

export function getDeletedGameIds() {
  return getStoredArray("deletedBoardGameIds").map(function (id) {
    return String(id);
  });
}

export function buildGamesList(apiGames) {
  const customGames = getCustomGames();
  const editedGames = getEditedGames();
  const deletedIds = getDeletedGameIds();

  const visibleApiGames = apiGames.filter(function (game) {
    return !deletedIds.includes(String(game.id));
  });

  const visibleCustomGames = customGames.filter(function (game) {
    return !deletedIds.includes(String(game.id));
  });

  const baseGames = visibleApiGames.concat(visibleCustomGames);

  return baseGames.map(function (game) {
    const editedGame = editedGames.find(function (edited) {
      return String(edited.id) === String(game.id);
    });

    if (editedGame) {
      return editedGame;
    }

    return game;
  });
}

export function saveCustomGame(game) {
  const customGames = getCustomGames();

  customGames.push(game);

  setStoredArray("customBoardGames", customGames);
}

export function saveEditedGame(game) {
  const editedGames = getEditedGames();

  const editedIndex = editedGames.findIndex(function (edited) {
    return String(edited.id) === String(game.id);
  });

  if (editedIndex >= 0) {
    editedGames[editedIndex] = game;
  } else {
    editedGames.push(game);
  }

  setStoredArray("editedBoardGames", editedGames);

  const customGames = getCustomGames();

  const customIndex = customGames.findIndex(function (customGame) {
    return String(customGame.id) === String(game.id);
  });

  if (customIndex >= 0) {
    customGames[customIndex] = game;
    setStoredArray("customBoardGames", customGames);
  }
}

export function deleteGame(id) {
  const idAsText = String(id);

  const customGames = getCustomGames();
  const editedGames = getEditedGames();
  const deletedIds = getDeletedGameIds();

  const newCustomGames = customGames.filter(function (game) {
    return String(game.id) !== idAsText;
  });

  const newEditedGames = editedGames.filter(function (game) {
    return String(game.id) !== idAsText;
  });

  const wasCustomGame = customGames.length !== newCustomGames.length;

  if (!wasCustomGame && !deletedIds.includes(idAsText)) {
    deletedIds.push(idAsText);
  }

  setStoredArray("customBoardGames", newCustomGames);
  setStoredArray("editedBoardGames", newEditedGames);
  setStoredArray("deletedBoardGameIds", deletedIds);
}

export function getGameById(games, id) {
  return games.find(function (game) {
    return String(game.id) === String(id);
  });
}

export function getImageUrl(imagePath) {
  if (!imagePath) {
    return PLACEHOLDER_IMAGE;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const fileName = imagePath.split("/").pop();

  return IMAGE_BASE_URL + fileName;
}

export function getGameImages(game) {
  if (!game.images || game.images.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }

  return game.images.map(function (imagePath) {
    return getImageUrl(imagePath);
  });
}

export function getMainImage(game) {
  return getGameImages(game)[0];
}