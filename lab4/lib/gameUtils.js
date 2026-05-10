export const API_URL = "https://szandala.github.io/piwo-api/board-games.json";
export const IMAGE_BASE_URL = "https://szandala.github.io/piwo-api/images/board-games/";
export const PLACEHOLDER_IMAGE = "/placeholder.png";

export function getDescriptionText(description) {
  if (!description) {
    return "";
  }

  if (Array.isArray(description)) {
    return description.join(" ");
  }

  return description;
}

export function getDescriptionLines(description) {
  if (!description) {
    return ["Brak opisu."];
  }

  if (Array.isArray(description) && description.length > 0) {
    return description;
  }

  if (Array.isArray(description)) {
    return ["Brak opisu."];
  }

  return [description];
}

export function shortenDescription(description) {
  const descriptionText = getDescriptionText(description);

  if (descriptionText === "") {
    return "Brak opisu.";
  }

  if (descriptionText.length > 160) {
    return descriptionText.slice(0, 160) + "...";
  }

  return descriptionText;
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
  if (!game || !game.images || game.images.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }

  return game.images.map(function (imagePath) {
    return getImageUrl(imagePath);
  });
}

export function getMainImage(game) {
  return getGameImages(game)[0];
}

export function hasAuction(game) {
  return Boolean(game?.auction);
}

export function isAuctionEnded(game) {
  if (!hasAuction(game) || !game?.auction?.endAt) {
    return false;
  }

  return new Date(game.auction.endAt).getTime() <= Date.now();
}

export function getAuctionCurrentBid(game) {
  if (!hasAuction(game)) {
    return 0;
  }

  return Number(game?.auction?.currentBid ?? game?.auction?.startPrice ?? 0);
}

export function formatAuctionDate(dateString) {
  if (!dateString) {
    return "brak daty";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "brak daty";
  }

  return date.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}