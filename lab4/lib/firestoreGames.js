import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  startAfter
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { API_URL } from "@/lib/gameUtils";

const GAMES_COLLECTION = "games";

function assertFirestoreConfig() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error(
      "Firebase nie jest jeszcze skonfigurowany. Uzupełnij plik .env.local danymi projektu."
    );
  }
}

function normalizeDescription(description) {
  if (Array.isArray(description)) {
    return description
      .map(function (line) {
        return String(line).trim();
      })
      .filter(function (line) {
        return line !== "";
      });
  }

  if (typeof description === "string") {
    return description
      .split("\n")
      .map(function (line) {
        return line.trim();
      })
      .filter(function (line) {
        return line !== "";
      });
  }

  return [];
}

function normalizeAuctionPayload(gameData) {
  if (!gameData.auction) {
    return null;
  }

  const rawAuction = gameData.auction;

  const startPrice = Number(
    rawAuction.startPrice ??
      rawAuction.starting_price ??
      rawAuction.startingPrice ??
      rawAuction.start_price ??
      0
  );

  const currentBid = Number(
    rawAuction.currentBid ??
      rawAuction.current_bid ??
      rawAuction.currentPrice ??
      rawAuction.current_price ??
      startPrice
  );

  const currentBidderUid =
    rawAuction.currentBidderUid ??
    rawAuction.current_bidder_uid ??
    rawAuction.highest_bidder_uid ??
    rawAuction.highestBidderUid ??
    null;

  const currentBidderEmail =
    rawAuction.currentBidderEmail ??
    rawAuction.current_bidder_email ??
    rawAuction.highest_bidder_email ??
    rawAuction.highestBidderEmail ??
    "";

  const bidCount = Number(
    rawAuction.bidCount ??
      rawAuction.bid_count ??
      (currentBidderUid ? 1 : 0)
  );

  let endAt =
    rawAuction.endAt ??
    rawAuction.end_at ??
    rawAuction.endDate ??
    rawAuction.end_date ??
    null;

  if (endAt instanceof Date) {
    endAt = endAt.toISOString();
  } else if (typeof endAt === "string" && endAt !== "") {
    const parsed = new Date(endAt);
    endAt = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } else {
    endAt = null;
  }

  if (!Number.isFinite(startPrice) || startPrice <= 0) {
    return null;
  }

  return {
    startPrice,
    currentBid,
    currentBidderUid,
    currentBidderEmail,
    bidCount,
    endAt
  };
}

function normalizeGamePayload(gameData) {
  return {
    title: String(gameData.title || "").trim(),
    images: Array.isArray(gameData.images) ? gameData.images : [],
    description: normalizeDescription(gameData.description),
    min_players: Number(gameData.min_players),
    max_players: Number(gameData.max_players),
    avg_play_time_minutes: Number(gameData.avg_play_time_minutes),
    publisher: String(gameData.publisher || "").trim(),
    is_expansion: Boolean(gameData.is_expansion),
    price_pln: Number(gameData.price_pln),
    auction: normalizeAuctionPayload(gameData),
    type: String(gameData.type || "").trim()
  };
}

function mapGameDocument(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    ...data,
    auction: data?.auction
      ? {
          startPrice: Number(data.auction.startPrice ?? 0),
          currentBid: Number(data.auction.currentBid ?? data.auction.startPrice ?? 0),
          currentBidderUid: data.auction.currentBidderUid ?? null,
          currentBidderEmail: data.auction.currentBidderEmail ?? "",
          bidCount: Number(data.auction.bidCount ?? 0),
          endAt: data.auction.endAt ?? null
        }
      : null
  };
}

export async function fetchGamesPage(pageSize = 9, cursor = null) {
  assertFirestoreConfig();

  let gamesQuery;

  if (cursor) {
    gamesQuery = query(
      collection(db, GAMES_COLLECTION),
      orderBy("title"),
      startAfter(cursor),
      limit(pageSize + 1)
    );
  } else {
    gamesQuery = query(
      collection(db, GAMES_COLLECTION),
      orderBy("title"),
      limit(pageSize + 1)
    );
  }

  const snapshot = await getDocs(gamesQuery);
  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    games: pageDocs.map(function (gameDocument) {
      return mapGameDocument(gameDocument);
    }),
    nextCursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : cursor,
    hasMore
  };
}

export function subscribeToGames(onChange, onError) {
  assertFirestoreConfig();

  const gamesQuery = query(collection(db, GAMES_COLLECTION), orderBy("title"));

  return onSnapshot(
    gamesQuery,
    function (snapshot) {
      const games = snapshot.docs.map(function (gameDocument) {
        return mapGameDocument(gameDocument);
      });

      onChange(games);
    },
    onError
  );
}

export async function getGameById(id) {
  assertFirestoreConfig();

  const gameReference = doc(db, GAMES_COLLECTION, String(id));
  const snapshot = await getDoc(gameReference);

  if (!snapshot.exists()) {
    return null;
  }

  return mapGameDocument(snapshot);
}

export async function createGame(gameData, user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby dodać grę.");
  }

  const payload = normalizeGamePayload(gameData);

  const documentReference = await addDoc(collection(db, GAMES_COLLECTION), {
    ...payload,
    ownerUid: user.uid,
    ownerEmail: user.email || "",
    source: "user",
    isAvailable: true,
    boughtByUid: null,
    boughtByEmail: null,
    boughtAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return documentReference.id;
}

export async function updateGame(id, gameData, user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby edytować grę.");
  }

  const gameReference = doc(db, GAMES_COLLECTION, String(id));
  const snapshot = await getDoc(gameReference);

  if (!snapshot.exists()) {
    throw new Error("Nie znaleziono gry do edycji.");
  }

  const existingGame = snapshot.data();

  if (existingGame.ownerUid !== user.uid) {
    throw new Error("Możesz edytować tylko swoje gry.");
  }

  const payload = normalizeGamePayload(gameData);

  await updateDoc(gameReference, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function deleteGame(id, user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby usunąć grę.");
  }

  const gameReference = doc(db, GAMES_COLLECTION, String(id));
  const snapshot = await getDoc(gameReference);

  if (!snapshot.exists()) {
    throw new Error("Nie znaleziono gry do usunięcia.");
  }

  if (snapshot.data().ownerUid !== user.uid) {
    throw new Error("Możesz usuwać tylko swoje gry.");
  }

  await deleteDoc(gameReference);
}

export async function buyGame(id, user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby kupić grę.");
  }

  const gameReference = doc(db, GAMES_COLLECTION, String(id));

  await runTransaction(db, async function (transaction) {
    const snapshot = await transaction.get(gameReference);

    if (!snapshot.exists()) {
      throw new Error("Ta oferta już nie istnieje.");
    }

    const game = snapshot.data();

    if (!game.isAvailable) {
      throw new Error("Ta oferta została już kupiona.");
    }

    if (game.ownerUid && game.ownerUid === user.uid) {
      throw new Error("Nie możesz kupić własnej gry.");
    }

    transaction.update(gameReference, {
      isAvailable: false,
      boughtByUid: user.uid,
      boughtByEmail: user.email || "",
      boughtAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
}

export async function placeBid(id, bidAmount, user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby licytować.");
  }

  const numericBid = Number(bidAmount);

  if (!Number.isFinite(numericBid) || numericBid <= 0) {
    throw new Error("Podaj poprawną kwotę oferty.");
  }

  const gameReference = doc(db, GAMES_COLLECTION, String(id));

  await runTransaction(db, async function (transaction) {
    const snapshot = await transaction.get(gameReference);

    if (!snapshot.exists()) {
      throw new Error("Ta oferta już nie istnieje.");
    }

    const game = snapshot.data();

    if (!game.isAvailable) {
      throw new Error("Ta oferta nie jest już dostępna.");
    }

    if (!game.auction) {
      throw new Error("Ta oferta nie ma aktywnej licytacji.");
    }

    if (game.ownerUid === user.uid) {
      throw new Error("Nie możesz licytować własnej gry.");
    }

    if (game.auction.endAt && new Date(game.auction.endAt).getTime() <= Date.now()) {
      throw new Error("Ta licytacja jest już zakończona.");
    }

    const currentBid = Number(game.auction.currentBid ?? game.auction.startPrice ?? 0);

    if (numericBid <= currentBid) {
      throw new Error(`Nowa oferta musi być większa niż ${currentBid} zł.`);
    }

    if (numericBid >= Number(game.price_pln)) {
      throw new Error(
        `Oferta licytacji musi być niższa niż cena kup teraz (${game.price_pln} zł).`
      );
    }

    transaction.update(gameReference, {
      auction: {
        ...game.auction,
        currentBid: numericBid,
        currentBidderUid: user.uid,
        currentBidderEmail: user.email || "",
        bidCount: Number(game.auction.bidCount ?? 0) + 1
      },
      updatedAt: serverTimestamp()
    });
  });
}

export async function importSampleGamesToFirestore(user) {
  assertFirestoreConfig();

  if (!user) {
    throw new Error("Musisz być zalogowana, aby zaimportować przykładowe dane.");
  }

  const existingDocuments = await getDocs(
    query(collection(db, GAMES_COLLECTION), limit(1))
  );

  if (!existingDocuments.empty) {
    throw new Error("Kolekcja gier nie jest pusta. Import przykładowych danych został pominięty.");
  }

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać przykładowych danych z API.");
  }

  const data = await response.json();
  const games = Array.isArray(data.board_games) ? data.board_games : [];
  const batch = writeBatch(db);

  games.forEach(function (game) {
    const payload = normalizeGamePayload(game);
    const gameReference = doc(db, GAMES_COLLECTION, `api-${game.id}`);

    batch.set(gameReference, {
      ...payload,
      ownerUid: null,
      ownerEmail: "",
      source: "api",
      isAvailable: true,
      boughtByUid: null,
      boughtByEmail: null,
      boughtAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();

  return games.length;
}