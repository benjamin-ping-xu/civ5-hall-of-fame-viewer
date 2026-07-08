const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("civ5Api", {
  selectDatabase: () => ipcRenderer.invoke("select-database")
});