"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameCard from "./GameCard";
import { buildGamesList, deleteGame } from "@/lib/browserGames";

function getDescriptionText(description) {
  if (!description) {
    return "";
  }

  if (Array.isArray(description)) {
    return description.join(" ");
  }

  return description;
}

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

export default function GameList({ games }) {
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allGames, setAllGames] = useState(games);

  const gamesPerPage = 9;

  useEffect(
    function () {
      setAllGames(buildGamesList(games));
    },
    [games]
  );

  const types = getTypes(allGames);
  const publishers = getPublishers(allGames);

  const filteredGames = allGames.filter(function (game) {
    return gameMatchesFilters(
      game,
      searchText,
      selectedType,
      selectedPublisher,
      maxPrice,
      selectedPlayers
    );
  });

  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);

  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;

  const visibleGames = filteredGames.slice(startIndex, endIndex);

  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i += 1) {
    pageNumbers.push(i);
  }

  function resetFilters() {
    setSearchText("");
    setSelectedType("");
    setSelectedPublisher("");
    setMaxPrice("");
    setSelectedPlayers("");
    setCurrentPage(1);
  }

  function handleDeleteGame(id) {
    deleteGame(id);
    setAllGames(buildGamesList(games));
    setCurrentPage(1);
  }

  return (
    <>
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
            Liczba znalezionych gier: {filteredGames.length}
        </p>

        <Link className="add-game-link" href="/games/new">
            Dodaj nową grę
        </Link>
    </div>

      {filteredGames.length === 0 ? (
        <p className="empty-text">Brak gier spełniających podane kryteria.</p>
      ) : (
        <>
          <section className="games-grid">
            {visibleGames.map(function (game) {
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  onDelete={handleDeleteGame}
                />
              );
            })}
          </section>

          <div className="pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={function () {
                setCurrentPage(currentPage - 1);
              }}
            >
              Poprzednia
            </button>

            {pageNumbers.map(function (pageNumber) {
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={currentPage === pageNumber ? "active-page" : ""}
                  onClick={function () {
                    setCurrentPage(pageNumber);
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={function () {
                setCurrentPage(currentPage + 1);
              }}
            >
              Następna
            </button>
          </div>
        </>
      )}
    </>
  );
}