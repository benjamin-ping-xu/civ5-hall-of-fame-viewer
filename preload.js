const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("civ5Api", {
  selectDatabase: () => ipcRenderer.invoke("select-database"),
  getDefaultDatabasePath: () => ipcRenderer.invoke("get-default-database-path"),
  readDatabaseInfo: (dbPath) => ipcRenderer.invoke("read-database-info", dbPath)
});
