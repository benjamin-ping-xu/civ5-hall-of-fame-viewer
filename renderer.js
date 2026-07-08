const selectDatabaseButton = document.getElementById("selectDatabaseButton");
const selectedPath = document.getElementById("selectedPath");

selectDatabaseButton.addEventListener("click", async () => {
  const filePath = await window.civ5Api.selectDatabase();

  if (filePath) {
    selectedPath.textContent = filePath;
  } else {
    selectedPath.textContent = "No file selected";
  }
});