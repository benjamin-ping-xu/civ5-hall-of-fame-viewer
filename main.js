const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Database = require("better-sqlite3");

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("select-database", async () => {
  const defaultDbPath = getDefaultDatabasePath();
  const defaultReplayPath = path.dirname(defaultDbPath);

  const result = await dialog.showOpenDialog({
    title: "Select Civilization V Hall of Fame database",
    defaultPath: fs.existsSync(defaultReplayPath)
      ? defaultReplayPath
      : app.getPath("documents"),
    properties: ["openFile"],
    filters: [
      { name: "SQLite database", extensions: ["db", "sqlite", "sqlite3"] },
      { name: "All files", extensions: ["*"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("read-database-info", async (_event, dbPath) => {
  if (!dbPath || !fs.existsSync(dbPath)) {
    throw new Error("Database file not found.");
  }

  const tempPath = path.join(os.tmpdir(), `civ5_hof_${Date.now()}.db`);
  fs.copyFileSync(dbPath, tempPath);

  const db = new Database(tempPath, {
    readonly: true,
    fileMustExist: true
  });

  try {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
      )
      .all()
      .map((row) => row.name);

    let victoryColumns = [];
    let victoryRows = [];

    if (tables.includes("Victories")) {
      victoryColumns = db
        .prepare("PRAGMA table_info(Victories);")
        .all()
        .map((column) => ({
          name: column.name,
          type: column.type
        }));

      victoryRows = db
        .prepare("SELECT * FROM Victories ORDER BY GameEndTime DESC;")
        .all();
    }

    return {
      tables,
      victoryColumns,
      victoryRows
    };
  } finally {
    db.close();
  }
});

ipcMain.handle("get-default-database-path", async () => {
  const defaultPath = getDefaultDatabasePath();

  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  return null;
});

function getDefaultDatabasePath() {
  return path.join(
    app.getPath("documents"),
    "My Games",
    "Sid Meier's Civilization 5",
    "Replays",
    "HallOfFameDatabase.db"
  );
}

ipcMain.handle("save-csv", async (_event, csvContent) => {
  const result = await dialog.showSaveDialog({
    title: "Export Civilization V Hall of Fame",
    defaultPath: path.join(
      app.getPath("documents"),
      "civ5_hall_of_fame_export.csv"
    ),
    buttonLabel: "Export",
    filters: [
      {
        name: "CSV files",
        extensions: ["csv"]
      }
    ]
  });

  if (result.canceled || !result.filePath) {
    return {
      saved: false,
      canceled: true
    };
  }

  await fs.promises.writeFile(result.filePath, csvContent, "utf8");

  return {
    saved: true,
    canceled: false,
    filePath: result.filePath
  };
});
