const elements = {
  selectDatabaseButton: document.getElementById("selectDatabaseButton"),
  selectedPath: document.getElementById("selectedPath"),
  victoryTableContainer: document.getElementById("victoryTableContainer"),
  clearFiltersButton: document.getElementById("clearFiltersButton"),
  summaryCards: document.getElementById("summaryCards"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  filters: {
    VictoryType: document.getElementById("victoryFilter"),
    PlayerHandicapType: document.getElementById("difficultyFilter"),
    GameSpeedType: document.getElementById("speedFilter"),
    WorldSizeType: document.getElementById("mapSizeFilter"),
    PlayerCivilizationType: document.getElementById("civilizationFilter"),
    PlayerTeamWon: document.getElementById("resultFilter"),
    IsMultiplayer: document.getElementById("modeFilter")
  }
};

const HIDDEN_COLUMNS = new Set([
  "PlayerLeaderName",
  "PlayerCivilizationName",
  "WinningTeamPrimaryColor",
  "WinningTeamSecondaryColor"
]);

const COLUMN_LABELS = {
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

const VALUE_LABELS = {
  VictoryType: {
    VICTORY_SPACE_RACE: "Science Victory!",
    VICTORY_DOMINATION: "Domination Victory!",
    VICTORY_CULTURAL: "Cultural Victory!",
    VICTORY_DIPLOMATIC: "Diplomatic Victory!",
    VICTORY_TIME: "Time Victory!"
  },
  PlayerHandicapType: {
    HANDICAP_SETTLER: "Settler",
    HANDICAP_CHIEFTAIN: "Chieftain",
    HANDICAP_WARLORD: "Warlord",
    HANDICAP_PRINCE: "Prince",
    HANDICAP_KING: "King",
    HANDICAP_EMPEROR: "Emperor",
    HANDICAP_IMMORTAL: "Immortal",
    HANDICAP_DEITY: "Deity"
  },
  GameSpeedType: {
    GAMESPEED_QUICK: "Quick",
    GAMESPEED_STANDARD: "Standard",
    GAMESPEED_EPIC: "Epic",
    GAMESPEED_MARATHON: "Marathon"
  },
  WorldSizeType: {
    WORLDSIZE_DUEL: "Duel",
    WORLDSIZE_TINY: "Tiny",
    WORLDSIZE_SMALL: "Small",
    WORLDSIZE_STANDARD: "Standard",
    WORLDSIZE_LARGE: "Large",
    WORLDSIZE_HUGE: "Huge"
  },
  StartEraType: {
    ERA_ANCIENT: "Ancient Era",
    ERA_CLASSICAL: "Classical Era",
    ERA_MEDIEVAL: "Medieval Era",
    ERA_RENAISSANCE: "Renaissance Era",
    ERA_INDUSTRIAL: "Industrial Era",
    ERA_MODERN: "Modern Era",
    ERA_POSTMODERN: "Atomic Era",
    ERA_FUTURE: "Information Era"
  }
};

const SORT_ORDERS = {
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

const appState = {
  sortColumn: null,
  sortDirection: "asc",
  victoryColumns: [],
  victoryRows: []
};

elements.selectDatabaseButton.addEventListener("click", selectDatabase);
elements.clearFiltersButton.addEventListener("click", clearFilters);
elements.exportCsvButton.addEventListener("click", exportCurrentTableToCsv);

for (const filter of Object.values(elements.filters)) {
  filter.addEventListener("change", renderCurrentTable);
}

window.addEventListener("DOMContentLoaded", loadDefaultDatabase);

async function loadDefaultDatabase() {
  const defaultPath = await window.civ5Api.getDefaultDatabasePath();

  if (defaultPath) {
    await loadDatabase(defaultPath);
  }
}

async function selectDatabase() {
  const filePath = await window.civ5Api.selectDatabase();

  if (!filePath) {
    elements.selectedPath.textContent = "No file selected";
    clearResults();
    return;
  }

  await loadDatabase(filePath);
}

async function loadDatabase(filePath) {
  elements.selectedPath.textContent = filePath;
  elements.summaryCards.innerHTML = "";
  elements.victoryTableContainer.textContent = "Reading database...";

  try {
    const info = await window.civ5Api.readDatabaseInfo(filePath);
    appState.victoryColumns = info.victoryColumns;
    appState.victoryRows = info.victoryRows;

    populateFilters(appState.victoryRows);
    renderCurrentTable();
  } catch (error) {
    elements.victoryTableContainer.textContent = `Error: ${error.message}`;
  }
}

function clearResults() {
  elements.summaryCards.innerHTML = "";
  elements.victoryTableContainer.innerHTML = "";
}

function clearFilters() {
  for (const filter of Object.values(elements.filters)) {
    filter.value = "";
  }

  renderCurrentTable();
}

function renderCurrentTable() {
  renderVictoryTable(appState.victoryColumns, appState.victoryRows);
}

function renderVictoryTable(columns, rows) {
  const visibleColumns = getVisibleColumns(columns);
  const displayRows = getCurrentDisplayRows(rows);

  renderSummaryCards(displayRows, rows);
  elements.victoryTableContainer.innerHTML = "";

  if (displayRows.length === 0) {
    elements.victoryTableContainer.textContent = "No victory rows found.";
    return;
  }

  const table = document.createElement("table");
  table.appendChild(createTableHead(visibleColumns));
  table.appendChild(createTableBody(visibleColumns, displayRows));
  elements.victoryTableContainer.appendChild(table);
}

function createTableHead(columns) {
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  for (const column of columns) {
    const th = document.createElement("th");
    th.textContent = getSortableHeaderLabel(column.name);
    th.addEventListener("click", () => {
      toggleSort(column.name);
      renderCurrentTable();
    });

    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  return thead;
}

function createTableBody(columns, rows) {
  const tbody = document.createElement("tbody");

  for (const row of rows) {
    const tr = document.createElement("tr");

    for (const column of columns) {
      const td = document.createElement("td");
      td.textContent = formatCiv5Value(column.name, row[column.name]);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  return tbody;
}

function toggleSort(columnName) {
  if (appState.sortColumn === columnName) {
    appState.sortDirection = appState.sortDirection === "asc" ? "desc" : "asc";
    return;
  }

  appState.sortColumn = columnName;
  appState.sortDirection = "asc";
}

function getSortableHeaderLabel(columnName) {
  const label = getHeaderLabel(columnName);

  if (appState.sortColumn !== columnName) {
    return label;
  }

  return `${label} ${appState.sortDirection === "asc" ? "^" : "v"}`;
}

function populateFilters(rows) {
  for (const [columnName, filter] of Object.entries(elements.filters)) {
    populateSelect(filter, rows, columnName);
  }
}

function populateSelect(selectElement, rows, columnName) {
  const currentValue = selectElement.value;

  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  for (const value of getUniqueSortedValues(rows, columnName)) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = formatCiv5Value(columnName, value);
    selectElement.appendChild(option);
  }

  selectElement.value = currentValue;
}

function getCurrentDisplayRows(rows = appState.victoryRows) {
  const sortedRows = [...getFilteredRows(rows)];

  if (!appState.sortColumn) {
    return sortedRows;
  }

  sortedRows.sort((a, b) => {
    const result = compareValues(
      appState.sortColumn,
      a[appState.sortColumn],
      b[appState.sortColumn]
    );

    return appState.sortDirection === "asc" ? result : -result;
  });

  return sortedRows;
}

function getFilteredRows(rows) {
  return rows.filter((row) =>
    Object.entries(elements.filters).every(([columnName, filter]) =>
      matchesFilter(row, columnName, filter.value)
    )
  );
}

function matchesFilter(row, columnName, filterValue) {
  if (!filterValue) {
    return true;
  }

  return String(row[columnName]) === filterValue;
}

function getUniqueSortedValues(rows, columnName) {
  return [...new Set(rows.map((row) => row[columnName]))]
    .filter(hasValue)
    .sort((a, b) => compareValues(columnName, a, b));
}

function getVisibleColumns(columns) {
  return columns.filter((column) => !HIDDEN_COLUMNS.has(column.name));
}

function getHeaderLabel(columnName) {
  return COLUMN_LABELS[columnName] || columnName;
}

function formatCiv5Value(columnName, value) {
  if (!hasValue(value)) {
    return "";
  }

  if (columnName === "GameEndTime") {
    return formatFileTime(value);
  }

  const stringValue = String(value);
  const label = VALUE_LABELS[columnName]?.[stringValue];

  if (label) {
    return label;
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

function formatMapName(value) {
  const fileName = String(value).split("\\").pop().split("/").pop();

  return fileName.replace(".lua", "").replaceAll("_", " ");
}

function cleanEnumValue(value) {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

  return formatCiv5Value(columnName, a).localeCompare(
    formatCiv5Value(columnName, b)
  );
}

function getSortRank(columnName, value) {
  const order = SORT_ORDERS[columnName];

  if (!order) {
    return null;
  }

  const rank = order.map(String).indexOf(String(value));

  return rank === -1 ? null : rank;
}

function renderSummaryCards(filteredRows, allRows) {
  elements.summaryCards.innerHTML = "";

  for (const card of getSummaryCards(filteredRows, allRows)) {
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
    elements.summaryCards.appendChild(cardElement);
  }
}

function getSummaryCards(filteredRows, allRows) {
  const victories = filteredRows.filter(
    (row) => String(row.PlayerTeamWon) === "1"
  );
  const defeats = filteredRows.filter(
    (row) => String(row.PlayerTeamWon) !== "1"
  );
  const fastestWin = getFastestWin(victories);
  const highestScore = getHighestScore(filteredRows);
  const commonVictory = getMostCommonValue(filteredRows, "VictoryType");

  return [
    {
      label: "Records",
      value: `${filteredRows.length} of ${allRows.length}`
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
      value: fastestWin ? `Turn ${fastestWin.WinningTurn}` : "-"
    },
    {
      label: "Highest Score",
      value: highestScore ? highestScore.Score : "-"
    },
    {
      label: "Most Common Victory",
      value: commonVictory ? formatCiv5Value("VictoryType", commonVictory) : "-"
    }
  ];
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

    if (!hasValue(value)) {
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

async function exportCurrentTableToCsv() {
  const visibleColumns = getVisibleColumns(appState.victoryColumns);
  const rows = getCurrentDisplayRows();

  if (rows.length === 0) {
    window.alert("There are no rows to export.");
    return;
  }

  const csvContent = [
    visibleColumns.map((column) => getHeaderLabel(column.name)),
    ...rows.map((row) =>
      visibleColumns.map((column) =>
        formatCiv5Value(column.name, row[column.name])
      )
    )
  ]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

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

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}
