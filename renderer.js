const selectDatabaseButton = document.getElementById("selectDatabaseButton");
const selectedPath = document.getElementById("selectedPath");
const tableList = document.getElementById("tableList");
const victoryColumnList = document.getElementById("victoryColumnList");

selectDatabaseButton.addEventListener("click", async () => {
  const filePath = await window.civ5Api.selectDatabase();

  if (!filePath) {
    selectedPath.textContent = "No file selected";
    tableList.innerHTML = "";
    victoryColumnList.innerHTML = "";
    return;
  }

  selectedPath.textContent = filePath;
  tableList.innerHTML = "<li>Reading database...</li>";

  try {
    const info = await window.civ5Api.readDatabaseInfo(filePath);

    tableList.innerHTML = "";

    for (const table of info.tables) {
      const li = document.createElement("li");
      li.textContent = table;
      tableList.appendChild(li);
    }

    victoryColumnList.innerHTML = "";

    for (const column of info.victoryColumns) {
    const li = document.createElement("li");
    li.textContent = `${column.name} (${column.type || "unknown type"})`;
    victoryColumnList.appendChild(li);
}
  } catch (error) {
    tableList.innerHTML = "";

    const li = document.createElement("li");
    li.textContent = `Error: ${error.message}`;
    tableList.appendChild(li);
  }
});