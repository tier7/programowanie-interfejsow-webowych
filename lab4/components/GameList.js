"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GameCard from "./GameCard";
import ImportSampleGamesButton from "./ImportSampleGamesButton";
import { useAuth } from "@/context/AuthContext";
import { buyGame, deleteGame, fetchGamesPage } from "@/lib/firestoreGames";
import { getDescriptionText } from "@/lib/gameUtils";
import { isFirebaseConfigured } from "@/lib/firebase";

function getTypes(games) {
  const types = [];

  for (let i = 0; i < games.length; i += 1) {
    if (games[i].type && !types.includes(games[i].type)) {
      types.push(games[i].type);
    }
  }

  return types;
}

function getPublishers(games) {
  const publishers = [];

  for (let i = 0; i < games.length; i += 1) {
    if (games[i].publisher && !publishers.includes(games[i].publisher)) {
      publishers.push(games[i].publisher);
    }
  }

  return publishers;
}

function gameMatchesSearch(game, searchText) {
  const lowerSearchText = searchText.toLowerCase();
  const title = game.title.toLowerCase();
  const description = getDescriptionText(game.description).toLowerCase();

  return title.includes(lowerSearchText) || description.includes(lowerSearchText);
}

function gameMatchesFilters(
  game,
  searchText,
  selectedType,
  selectedPublisher,
  maxPrice,
  selectedPlayers
) {
  if (searchText !== "" && !gameMatchesSearch(game, searchText)) {
    return false;
  }

  if (selectedType !== "" && game.type !== selectedType) {
    return false;
  }

  if (selectedPublisher !== "" && game.publisher !== selectedPublisher) {
    return false;
  }

  if (maxPrice !== "" && game.price_pln > Number(maxPrice)) {
    return false;
  }

  if (selectedPlayers !== "") {
    const players = Number(selectedPlayers);

    if (players < game.min_players || players > game.max_players) {
      return false;
    }
  }

  return true;
}

export default function GameList() {
  const { user, loading: authLoading } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [loadedGames, setLoadedGames] = useState([]);
  const [loadedPageCount, setLoadedPageCount] = useState(0);
  const [nextCursorByPage, setNextCursorByPage] = useState({});
  const [hasMoreByPage, setHasMoreByPage] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyGameId, setBusyGameId] = useState("");

  const gamesPerPage = 9;

  async function loadPage(pageNumber, cursor = null, replace = false) {
    const firstLoad = pageNumber === 1 && replace;

    if (firstLoad) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }

    setErrorMessage("");

    try {
      const result = await fetchGamesPage(gamesPerPage, cursor);

      setLoadedGames(function (previousGames) {
        if (replace) {
          return result.games;
        }

        const nextGames = [...previousGames];
        const startIndex = (pageNumber - 1) * gamesPerPage;

        for (let i = 0; i < result.games.length; i += 1) {
          nextGames[startIndex + i] = result.games[i];
        }

        return nextGames;
      });

      setLoadedPageCount(function (previousCount) {
        return Math.max(previousCount, pageNumber);
      });

      setNextCursorByPage(function (previousValue) {
        return {
          ...previousValue,
          [pageNumber]: result.nextCursor
        };
      });

      setHasMoreByPage(function (previousValue) {
        return {
          ...previousValue,
          [pageNumber]: result.hasMore
        };
      });
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się pobrać gier z Firestore.");
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }

  async function reloadFromStart() {
    setCurrentPage(1);
    setLoadedGames([]);
    setLoadedPageCount(0);
    setNextCursorByPage({});
    setHasMoreByPage({});
    await loadPage(1, null, true);
  }

  useEffect(function () {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return undefined;
    }

    loadPage(1, null, true);
    return undefined;
  }, []);

  const types = useMemo(
    function () {
      return getTypes(loadedGames);
    },
    [loadedGames]
  );

  const publishers = useMemo(
    function () {
      return getPublishers(loadedGames);
    },
    [loadedGames]
  );

  const filteredGames = loadedGames.filter(function (game) {
    return gameMatchesFilters(
      game,
      searchText,
      selectedType,
      selectedPublisher,
      maxPrice,
      selectedPlayers
    );
  });

  const maxLoadedFilteredPages = Math.max(
    1,
    Math.ceil(filteredGames.length / gamesPerPage)
  );

  useEffect(
    function () {
      if (currentPage > maxLoadedFilteredPages) {
        setCurrentPage(maxLoadedFilteredPages);
      }
    },
    [currentPage, maxLoadedFilteredPages]
  );

  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const visibleGames = filteredGames.slice(startIndex, endIndex);

  function resetFilters() {
    setSearchText("");
    setSelectedType("");
    setSelectedPublisher("");
    setMaxPrice("");
    setSelectedPlayers("");
    setCurrentPage(1);
  }

  async function handleDeleteGame(id) {
    if (!user) {
      setErrorMessage("Musisz być zalogowana, aby usuwać gry.");
      return;
    }

    setBusyGameId(String(id));
    setErrorMessage("");

    try {
      await deleteGame(id, user);
      await reloadFromStart();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć gry.");
    } finally {
      setBusyGameId("");
    }
  }

  async function handleBuyGame(id) {
    if (!user) {
      setErrorMessage("Musisz być zalogowana, aby kupić grę.");
      return;
    }

    setBusyGameId(String(id));
    setErrorMessage("");

    try {
      await buyGame(id, user);
      await reloadFromStart();
    } catch (error) {
      setErrorMessage(error.message || "Zakup nie powiódł się.");
    } finally {
      setBusyGameId("");
    }
  }

  async function handleNextPage() {
    const nextPage = currentPage + 1;

    if (nextPage <= loadedPageCount) {
      setCurrentPage(nextPage);
      return;
    }

    if (hasMoreByPage[currentPage]) {
      await loadPage(nextPage, nextCursorByPage[currentPage], false);
      setCurrentPage(nextPage);
    }
  }

  function handlePreviousPage() {
    setCurrentPage(function (previousPage) {
      return Math.max(1, previousPage - 1);
    });
  }

  const canGoPrevious = currentPage > 1;
  const canGoNext =
    currentPage < loadedPageCount || Boolean(hasMoreByPage[currentPage]);

  if (!isFirebaseConfigured()) {
    return (
      <section className="empty-state-box">
        <p>
          Gdy tylko podłączysz Firebase, tutaj pojawi się lista gier z Firestore.
        </p>
      </section>
    );
  }

  if (isLoading || authLoading) {
    return <p className="empty-text">Ładowanie danych z Firebase...</p>;
  }

  return (
    <>
      {errorMessage !== "" ? <p className="form-error">{errorMessage}</p> : null}

      <section className="filters-box">
        <div className="filter-field">
          <label htmlFor="search-text">Szukaj</label>
          <input
            id="search-text"
            type="text"
            placeholder="Wpisz tytuł albo opis gry"
            value={searchText}
            onChange={function (event) {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="type-filter">Typ gry</label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={function (event) {
              setSelectedType(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Wszystkie typy</option>

            {types.map(function (type) {
              return (
                <option key={type} value={type}>
                  {type}
                </option>
              );
            })}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="publisher-filter">Wydawca</label>
          <select
            id="publisher-filter"
            value={selectedPublisher}
            onChange={function (event) {
              setSelectedPublisher(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Wszyscy wydawcy</option>

            {publishers.map(function (publisher) {
              return (
                <option key={publisher} value={publisher}>
                  {publisher}
                </option>
              );
            })}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="max-price">Maksymalna cena</label>
          <input
            id="max-price"
            type="number"
            min="0"
            placeholder="np. 150"
            value={maxPrice}
            onChange={function (event) {
              setMaxPrice(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="players-filter">Liczba graczy</label>
          <input
            id="players-filter"
            type="number"
            min="1"
            placeholder="np. 4"
            value={selectedPlayers}
            onChange={function (event) {
              setSelectedPlayers(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-actions">
          <button type="button" onClick={resetFilters}>
            Wyczyść filtry
          </button>
        </div>
      </section>

      <div className="results-toolbar">
        <p className="results-count">
          Załadowane gry: {loadedGames.length} | Wyniki po filtrach: {filteredGames.length}
        </p>

        {user ? (
          <Link className="add-game-link" href="/games/new">
            Dodaj nową grę
          </Link>
        ) : (
          <span className="toolbar-hint">Zaloguj się, aby dodać własną ofertę.</span>
        )}
      </div>

      {loadedGames.length === 0 && user ? (
        <ImportSampleGamesButton user={user} onImported={reloadFromStart} />
      ) : null}

      {filteredGames.length === 0 ? (
        <p className="empty-text">
          Brak gier wśród aktualnie pobranych danych.
          {canGoNext ? " Możesz przejść dalej i dociągnąć kolejną stronę z Firestore." : ""}
        </p>
      ) : (
        <>
          <section className="games-grid">
            {visibleGames.map(function (game) {
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  currentUser={user}
                  onDelete={handleDeleteGame}
                  onBuy={handleBuyGame}
                  busy={busyGameId === String(game.id)}
                />
              );
            })}
          </section>

          <div className="pagination">
            <button
              type="button"
              disabled={!canGoPrevious || isPageLoading}
              onClick={handlePreviousPage}
            >
              Poprzednia
            </button>

            <span className="pagination-label">Strona {currentPage}</span>

            <button
              type="button"
              disabled={!canGoNext || isPageLoading}
              onClick={handleNextPage}
            >
              {isPageLoading ? "Ładowanie..." : "Następna"}
            </button>
          </div>
        </>
      )}
    </>
  );
}