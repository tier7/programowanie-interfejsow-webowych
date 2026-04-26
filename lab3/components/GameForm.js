"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCustomGame, saveEditedGame } from "@/lib/browserGames";

function getDescriptionArray(descriptionText) {
  if (descriptionText.trim() === "") {
    return [];
  }

  return descriptionText
    .split("\n")
    .map(function (line) {
      return line.trim();
    })
    .filter(function (line) {
      return line !== "";
    });
}

function getDescriptionText(description) {
  if (!description) {
    return "";
  }

  if (Array.isArray(description)) {
    return description.join("\n");
  }

  return description;
}

function validateGameForm(
  title,
  publisher,
  type,
  price,
  minPlayers,
  maxPlayers,
  avgPlayTime
) {
  if (title.trim() === "") {
    return "Tytuł gry jest wymagany.";
  }

  if (publisher.trim() === "") {
    return "Wydawca jest wymagany.";
  }

  if (type.trim() === "") {
    return "Typ gry jest wymagany.";
  }

  if (price === "" || Number(price) <= 0) {
    return "Cena musi być większa od 0.";
  }

  if (minPlayers === "" || Number(minPlayers) <= 0) {
    return "Minimalna liczba graczy musi być większa od 0.";
  }

  if (maxPlayers === "" || Number(maxPlayers) <= 0) {
    return "Maksymalna liczba graczy musi być większa od 0.";
  }

  if (Number(minPlayers) > Number(maxPlayers)) {
    return "Minimalna liczba graczy nie może być większa od maksymalnej.";
  }

  if (avgPlayTime === "" || Number(avgPlayTime) <= 0) {
    return "Średni czas gry musi być większy od 0.";
  }

  return "";
}

export default function GameForm({ initialGame, mode }) {
  const router = useRouter();

  const isEditMode = mode === "edit";

  const [title, setTitle] = useState(initialGame ? initialGame.title : "");
  const [publisher, setPublisher] = useState(
    initialGame ? initialGame.publisher : ""
  );
  const [type, setType] = useState(initialGame ? initialGame.type : "");
  const [price, setPrice] = useState(
    initialGame ? String(initialGame.price_pln) : ""
  );
  const [minPlayers, setMinPlayers] = useState(
    initialGame ? String(initialGame.min_players) : ""
  );
  const [maxPlayers, setMaxPlayers] = useState(
    initialGame ? String(initialGame.max_players) : ""
  );
  const [avgPlayTime, setAvgPlayTime] = useState(
    initialGame ? String(initialGame.avg_play_time_minutes) : ""
  );
  const [description, setDescription] = useState(
    initialGame ? getDescriptionText(initialGame.description) : ""
  );
  const [isExpansion, setIsExpansion] = useState(
    initialGame ? initialGame.is_expansion : false
  );
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateGameForm(
      title,
      publisher,
      type,
      price,
      minPlayers,
      maxPlayers,
      avgPlayTime
    );

    if (validationError !== "") {
      setErrorMessage(validationError);
      return;
    }

    const game = {
      id: initialGame ? initialGame.id : Date.now(),
      title: title.trim(),
      images: initialGame ? initialGame.images : [],
      description: getDescriptionArray(description),
      min_players: Number(minPlayers),
      max_players: Number(maxPlayers),
      avg_play_time_minutes: Number(avgPlayTime),
      publisher: publisher.trim(),
      is_expansion: isExpansion,
      price_pln: Number(price),
      auction: initialGame ? initialGame.auction : null,
      type: type.trim()
    };

    if (isEditMode) {
      saveEditedGame(game);
    } else {
      saveCustomGame(game);
    }

    router.push(`/games/${game.id}`);
  }

  return (
    <form className="game-form" onSubmit={handleSubmit}>
      {errorMessage !== "" ? (
        <p className="form-error">{errorMessage}</p>
      ) : null}

      <div className="form-field">
        <label htmlFor="title">Tytuł gry</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={function (event) {
            setTitle(event.target.value);
            setErrorMessage("");
          }}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="publisher">Wydawca</label>
        <input
          id="publisher"
          type="text"
          value={publisher}
          onChange={function (event) {
            setPublisher(event.target.value);
            setErrorMessage("");
          }}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="type">Typ gry</label>
        <input
          id="type"
          type="text"
          placeholder="np. ekonomiczna"
          value={type}
          onChange={function (event) {
            setType(event.target.value);
            setErrorMessage("");
          }}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="price">Cena</label>
          <input
            id="price"
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={function (event) {
              setPrice(event.target.value);
              setErrorMessage("");
            }}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="avg-play-time">Średni czas gry</label>
          <input
            id="avg-play-time"
            type="number"
            min="1"
            value={avgPlayTime}
            onChange={function (event) {
              setAvgPlayTime(event.target.value);
              setErrorMessage("");
            }}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="min-players">Minimalna liczba graczy</label>
          <input
            id="min-players"
            type="number"
            min="1"
            value={minPlayers}
            onChange={function (event) {
              setMinPlayers(event.target.value);
              setErrorMessage("");
            }}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="max-players">Maksymalna liczba graczy</label>
          <input
            id="max-players"
            type="number"
            min="1"
            value={maxPlayers}
            onChange={function (event) {
              setMaxPlayers(event.target.value);
              setErrorMessage("");
            }}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="description">Opis</label>
        <textarea
          id="description"
          rows="6"
          placeholder="Każdy akapit możesz wpisać w nowej linii"
          value={description}
          onChange={function (event) {
            setDescription(event.target.value);
          }}
        />
      </div>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={isExpansion}
          onChange={function (event) {
            setIsExpansion(event.target.checked);
          }}
        />
        To jest dodatek do gry
      </label>

      <div className="form-buttons">
        <button type="submit">
          {isEditMode ? "Zapisz zmiany" : "Dodaj grę"}
        </button>
      </div>
    </form>
  );
}