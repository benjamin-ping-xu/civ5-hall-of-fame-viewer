const selectDatabaseButton = document.getElementById("selectDatabaseButton");
const selectedPath = document.getElementById("selectedPath");
const victoryTableContainer = document.getElementById("victoryTableContainer");
const victoryFilter = document.getElementById("victoryFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const speedFilter = document.getElementById("speedFilter");
const mapSizeFilter = document.getElementById("mapSizeFilter");
const civilizationFilter = document.getElementById("civilizationFilter");
const resultFilter = document.getElementById("resultFilter");
const modeFilter = document.getElementById("modeFilter");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const summaryCards = document.getElementById("summaryCards");
const exportCsvButton = document.getElementById("exportCsvButton");

let currentSortColumn = null;
let currentSortDirection = "asc";
let currentVictoryColumns = [];
let currentVictoryRows = [];

selectDatabaseButton.addEventListener("click", async () => {
  const filePath = await window.civ5Api.selectDatabase();

  if (!filePath) {
    selectedPath.textContent = "No file selected";
    victoryTableContainer.innerHTML = "";
    return;
  }

  await loadDatabase(filePath);
});

window.addEventListener("DOMContentLoaded", async () => {
  const defaultPath = await window.civ5Api.getDefaultDatabasePath();

  if (defaultPath) {
    await loadDatabase(defaultPath);
  }
});

victoryFilter.addEventListener("change", renderCurrentTable);
difficultyFilter.addEventListener("change", renderCurrentTable);
speedFilter.addEventListener("change", renderCurrentTable);
mapSizeFilter.addEventListener("change", renderCurrentTable);
civilizationFilter.addEventListener("change", renderCurrentTable);
resultFilter.addEventListener("change", renderCurrentTable);
modeFilter.addEventListener("change", renderCurrentTable);
exportCsvButton.addEventListener("click", exportCurrentTableToCsv);

clearFiltersButton.addEventListener("click", () => {
  victoryFilter.value = "";
  difficultyFilter.value = "";
  speedFilter.value = "";
  mapSizeFilter.value = "";
  civilizationFilter.value = "";
  resultFilter.value = "";
  modeFilter.value = "";
  renderCurrentTable();
});

function renderVictoryTable(columns, rows) {
  const visibleColumns = getVisibleColumns(columns);
  const displayRows = getCurrentDisplayRows(rows);

  renderSummaryCards(displayRows, rows);

  victoryTableContainer.innerHTML = "";

  if (displayRows.length === 0) {
    victoryTableContainer.textContent = "No victory rows found.";
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");

  for (const column of visibleColumns) {
    const th = document.createElement("th");
    th.textContent = getHeaderLabel(column.name);

    if (currentSortColumn === column.name) {
      th.textContent += currentSortDirection === "asc" ? " ▲" : " ▼";
    }

    th.addEventListener("click", () => {
      if (currentSortColumn === column.name) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortColumn = column.name;
        currentSortDirection = "asc";
      }

      renderCurrentTable();
    });

    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);

  for (const row of displayRows) {
    const tr = document.createElement("tr");

    for (const column of visibleColumns) {
      const td = document.createElement("td");
      td.textContent = formatCiv5Value(column.name, row[column.name]);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  victoryTableContainer.appendChild(table);
}

function formatCiv5Value(columnName, value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (columnName === "GameEndTime") {
    return formatFileTime(value);
  }

  const stringValue = String(value);

  const victoryLabels = {
    VICTORY_SPACE_RACE: "Science Victory!",
    VICTORY_DOMINATION: "Domination Victory!",
    VICTORY_CULTURAL: "Cultural Victory!",
    VICTORY_DIPLOMATIC: "Diplomatic Victory!",
    VICTORY_TIME: "Time Victory!"
  };

  const difficultyLabels = {
    HANDICAP_SETTLER: "Settler",
    HANDICAP_CHIEFTAIN: "Chieftain",
    HANDICAP_WARLORD: "Warlord",
    HANDICAP_PRINCE: "Prince",
    HANDICAP_KING: "King",
    HANDICAP_EMPEROR: "Emperor",
    HANDICAP_IMMORTAL: "Immortal",
    HANDICAP_DEITY: "Deity"
  };

  const speedLabels = {
    GAMESPEED_QUICK: "Quick",
    GAMESPEED_STANDARD: "Standard",
    GAMESPEED_EPIC: "Epic",
    GAMESPEED_MARATHON: "Marathon"
  };

  const worldSizeLabels = {
    WORLDSIZE_DUEL: "Duel",
    WORLDSIZE_TINY: "Tiny",
    WORLDSIZE_SMALL: "Small",
    WORLDSIZE_STANDARD: "Standard",
    WORLDSIZE_LARGE: "Large",
    WORLDSIZE_HUGE: "Huge"
  };

  const eraLabels = {
    ERA_ANCIENT: "Ancient Era",
    ERA_CLASSICAL: "Classical Era",
    ERA_MEDIEVAL: "Medieval Era",
    ERA_RENAISSANCE: "Renaissance Era",
    ERA_INDUSTRIAL: "Industrial Era",
    ERA_MODERN: "Modern Era",
    ERA_POSTMODERN: "Atomic Era",
    ERA_FUTURE: "Information Era"
  };

  if (columnName === "VictoryType") {
    return victoryLabels[stringValue] || cleanEnumValue(stringValue);
  }

  if (columnName === "PlayerHandicapType") {
    return difficultyLabels[stringValue] || cleanEnumValue(stringValue);
  }

  if (columnName === "GameSpeedType") {
    return speedLabels[stringValue] || cleanEnumValue(stringValue);
  }

  if (columnName === "WorldSizeType") {
    return worldSizeLabels[stringValue] || cleanEnumValue(stringValue);
  }

  if (columnName === "StartEraType") {
    return eraLabels[stringValue] || cleanEnumValue(stringValue);
  }

  if (
    columnName === "PlayerCivilizationType" ||
    columnName === "WinningTeamLeaderCivilizationType"
  ) {
    return cleanEnumValue(stringValue.replace("CIVILIZATION_", ""));
  }

  if (columnName === "MapName") {
    return formatMapName(stringValue);
  }

  if (columnName === "IsMultiplayer") {
    return stringValue === "1" ? "Multiplayer" : "Single Player";
  }

  if (columnName === "PlayerTeamWon") {
    return stringValue === "1" ? "Victory!" : "Defeat";
  }

  return stringValue;
}

function cleanEnumValue(value) {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMapName(value) {
  const fileName = String(value).split("\\").pop().split("/").pop();

  return fileName.replace(".lua", "").replaceAll("_", " ");
}

function getVisibleColumns(columns) {
  const hiddenColumns = new Set([
    "PlayerLeaderName",
    "PlayerCivilizationName",
    "WinningTeamPrimaryColor",
    "WinningTeamSecondaryColor"
  ]);

  return columns.filter((column) => !hiddenColumns.has(column.name));
}

function formatFileTime(value) {
  const fileTime = Number(value);

  if (!Number.isFinite(fileTime) || fileTime <= 0) {
    return "";
  }

  const unixMilliseconds = fileTime / 10000 - 11644473600000;
  const date = new Date(unixMilliseconds);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getHeaderLabel(columnName) {
  const labels = {
    VictoryType: "Victory",
    Score: "Score",
    WinningTurn: "Turns",
    IsMultiplayer: "Mode",
    PlayerTeamWon: "Result",
    PlayerCivilizationType: "Civilization",
    PlayerHandicapType: "Difficulty",
    GameEndTime: "Date",
    WinningTeamLeaderCivilizationType: "Winning Civ",
    StartEraType: "Era",
    MapName: "Map",
    WorldSizeType: "Map Size",
    GameSpeedType: "Speed",
    WinningTeamPrimaryColor: "Primary Color",
    WinningTeamSecondaryColor: "Secondary Color"
  };

  return labels[columnName] || columnName;
}

async function loadDatabase(filePath) {
  selectedPath.textContent = filePath;
  victoryTableContainer.textContent = "Reading database...";

  try {
    const info = await window.civ5Api.readDatabaseInfo(filePath);
    currentVictoryColumns = info.victoryColumns;
    currentVictoryRows = info.victoryRows;
    populateFilters(currentVictoryRows);

    renderVictoryTable(currentVictoryColumns, currentVictoryRows);
  } catch (error) {
    victoryTableContainer.textContent = `Error: ${error.message}`;
  }
}

function compareValues(columnName, a, b) {
  const rankA = getSortRank(columnName, a);
  const rankB = getSortRank(columnName, b);

  if (rankA !== null && rankB !== null) {
    return rankA - rankB;
  }

  if (rankA !== null) {
    return -1;
  }

  if (rankB !== null) {
    return 1;
  }

  const numberA = Number(a);
  const numberB = Number(b);

  if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
    return numberA - numberB;
  }

  const textA = formatCiv5Value(columnName, a);
  const textB = formatCiv5Value(columnName, b);

  return textA.localeCompare(textB);
}

function renderCurrentTable() {
  renderVictoryTable(currentVictoryColumns, currentVictoryRows);
}

function populateFilters(rows) {
  populateSelect(victoryFilter, rows, "VictoryType");
  populateSelect(difficultyFilter, rows, "PlayerHandicapType");
  populateSelect(speedFilter, rows, "GameSpeedType");
  populateSelect(mapSizeFilter, rows, "WorldSizeType");
  populateSelect(civilizationFilter, rows, "PlayerCivilizationType");
  populateSelect(resultFilter, rows, "PlayerTeamWon");
  populateSelect(modeFilter, rows, "IsMultiplayer");
}

function populateSelect(selectElement, rows, columnName) {
  const currentValue = selectElement.value;

  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  const values = [...new Set(rows.map((row) => row[columnName]))]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .sort((a, b) => {
      const rankA = getSortRank(columnName, a);
      const rankB = getSortRank(columnName, b);

      if (rankA !== null && rankB !== null) {
        return rankA - rankB;
      }

      if (rankA !== null) {
        return -1;
      }

      if (rankB !== null) {
        return 1;
      }

      return formatCiv5Value(columnName, a).localeCompare(
        formatCiv5Value(columnName, b)
      );
    });

  for (const value of values) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = formatCiv5Value(columnName, value);
    selectElement.appendChild(option);
  }

  selectElement.value = currentValue;
}

function getFilteredRows(rows) {
  return rows.filter((row) => {
    if (victoryFilter.value && row.VictoryType !== victoryFilter.value) {
      return false;
    }

    if (
      difficultyFilter.value &&
      row.PlayerHandicapType !== difficultyFilter.value
    ) {
      return false;
    }

    if (speedFilter.value && row.GameSpeedType !== speedFilter.value) {
      return false;
    }

    if (mapSizeFilter.value && row.WorldSizeType !== mapSizeFilter.value) {
      return false;
    }

    if (
      civilizationFilter.value &&
      row.PlayerCivilizationType !== civilizationFilter.value
    ) {
      return false;
    }

    if (
      resultFilter.value &&
      String(row.PlayerTeamWon) !== resultFilter.value
    ) {
      return false;
    }

    if (modeFilter.value && String(row.IsMultiplayer) !== modeFilter.value) {
      return false;
    }

    return true;
  });
}

function renderSummaryCards(filteredRows, allRows) {
  summaryCards.innerHTML = "";

  const totalRecords = allRows.length;
  const shownRecords = filteredRows.length;
  const victories = filteredRows.filter(
    (row) => String(row.PlayerTeamWon) === "1"
  );
  const defeats = filteredRows.filter(
    (row) => String(row.PlayerTeamWon) !== "1"
  );

  const fastestWin = getFastestWin(victories);
  const highestScore = getHighestScore(filteredRows);
  const commonVictory = getMostCommonValue(filteredRows, "VictoryType");

  const cards = [
    {
      label: "Records",
      value: `${shownRecords} of ${totalRecords}`
    },
    {
      label: "Victories",
      value: victories.length
    },
    {
      label: "Defeats",
      value: defeats.length
    },
    {
      label: "Fastest Win",
      value: fastestWin ? `Turn ${fastestWin.WinningTurn}` : "—"
    },
    {
      label: "Highest Score",
      value: highestScore ? highestScore.Score : "—"
    },
    {
      label: "Most Common Victory",
      value: commonVictory ? formatCiv5Value("VictoryType", commonVictory) : "—"
    }
  ];

  for (const card of cards) {
    const cardElement = document.createElement("article");
    cardElement.className = "summary-card";

    const labelElement = document.createElement("div");
    labelElement.className = "summary-card-label";
    labelElement.textContent = card.label;

    const valueElement = document.createElement("div");
    valueElement.className = "summary-card-value";
    valueElement.textContent = card.value;

    cardElement.appendChild(labelElement);
    cardElement.appendChild(valueElement);
    summaryCards.appendChild(cardElement);
  }
}

function getFastestWin(rows) {
  const validRows = rows.filter((row) =>
    Number.isFinite(Number(row.WinningTurn))
  );

  if (validRows.length === 0) {
    return null;
  }

  return validRows.reduce((best, row) =>
    Number(row.WinningTurn) < Number(best.WinningTurn) ? row : best
  );
}

function getHighestScore(rows) {
  const validRows = rows.filter((row) => Number.isFinite(Number(row.Score)));

  if (validRows.length === 0) {
    return null;
  }

  return validRows.reduce((best, row) =>
    Number(row.Score) > Number(best.Score) ? row : best
  );
}

function getMostCommonValue(rows, columnName) {
  const counts = new Map();

  for (const row of rows) {
    const value = row[columnName];

    if (value === null || value === undefined || value === "") {
      continue;
    }

    counts.set(value, (counts.get(value) || 0) + 1);
  }

  let bestValue = null;
  let bestCount = 0;

  for (const [value, count] of counts.entries()) {
    if (count > bestCount) {
      bestValue = value;
      bestCount = count;
    }
  }

  return bestValue;
}

function getSortRank(columnName, value) {
  const orders = {
    PlayerHandicapType: [
      "HANDICAP_SETTLER",
      "HANDICAP_CHIEFTAIN",
      "HANDICAP_WARLORD",
      "HANDICAP_PRINCE",
      "HANDICAP_KING",
      "HANDICAP_EMPEROR",
      "HANDICAP_IMMORTAL",
      "HANDICAP_DEITY"
    ],

    GameSpeedType: [
      "GAMESPEED_QUICK",
      "GAMESPEED_STANDARD",
      "GAMESPEED_EPIC",
      "GAMESPEED_MARATHON"
    ],

    WorldSizeType: [
      "WORLDSIZE_DUEL",
      "WORLDSIZE_TINY",
      "WORLDSIZE_SMALL",
      "WORLDSIZE_STANDARD",
      "WORLDSIZE_LARGE",
      "WORLDSIZE_HUGE"
    ],

    StartEraType: [
      "ERA_ANCIENT",
      "ERA_CLASSICAL",
      "ERA_MEDIEVAL",
      "ERA_RENAISSANCE",
      "ERA_INDUSTRIAL",
      "ERA_MODERN",
      "ERA_POSTMODERN",
      "ERA_FUTURE"
    ],

    IsMultiplayer: [0, 1],

    PlayerTeamWon: [0, 1]
  };

  const order = orders[columnName];

  if (!order) {
    return null;
  }

  const rank = order.map(String).indexOf(String(value));

  return rank === -1 ? null : rank;
}

function getCurrentDisplayRows(rows = currentVictoryRows) {
  const filteredRows = getFilteredRows(rows);
  const sortedRows = [...filteredRows];

  if (currentSortColumn) {
    sortedRows.sort((a, b) => {
      const result = compareValues(
        currentSortColumn,
        a[currentSortColumn],
        b[currentSortColumn]
      );

      return currentSortDirection === "asc" ? result : -result;
    });
  }

  return sortedRows;
}

async function exportCurrentTableToCsv() {
  const visibleColumns = getVisibleColumns(currentVictoryColumns);
  const rows = getCurrentDisplayRows();

  if (rows.length === 0) {
    window.alert("There are no rows to export.");
    return;
  }

  const headerRow = visibleColumns
    .map((column) => getHeaderLabel(column.name))
    .map(escapeCsvValue)
    .join(",");

  const dataRows = rows.map((row) =>
    visibleColumns
      .map((column) => formatCiv5Value(column.name, row[column.name]))
      .map(escapeCsvValue)
      .join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");

  try {
    const result = await window.civ5Api.saveCsv(csvContent);

    if (result.saved) {
      window.alert(`CSV exported to:\n${result.filePath}`);
    }
  } catch (error) {
    window.alert(`Could not export CSV:\n${error.message}`);
  }
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}
