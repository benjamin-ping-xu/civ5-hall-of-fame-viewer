# Civ V Hall of Fame Viewer

A small Electron app for viewing your Civilization V Hall of Fame database with clearer columns, filters, sorting, summary stats, and CSV export.

The app reads the local `HallOfFameDatabase.db` file created by Civilization V. It looks for the default Windows location automatically, but you can also choose the database file manually.

## Download

Get the latest portable Windows ZIP from the [Releases](https://github.com/benjamin-ping-xu/civ5-hall-of-fame-viewer/releases) page.

Unzip it, then run the app inside the extracted folder. 

## Features

- View Civ V Hall of Fame records in a sortable table
- Filter by victory type, difficulty, speed, map size, civilization, result, and game mode
- See quick summary stats like fastest win and highest score
- Export the current filtered table to CSV

## For Nerds

These steps are only needed if you want to run the app from source.

Install dependencies:

```sh
npm install
```

Run the app:

```sh
npm start
```

Check code style:

```sh
npm run lint
npm run format:check
```

Apply formatting:

```sh
npm run format
```

## Notes

This project does not upload or modify your Civ V data. It copies the selected database to a temporary file and reads from that copy.

The default Civ V Hall of Fame database path on Windows is:

```text
Documents\My Games\Sid Meier's Civilization 5\Replays\HallOfFameDatabase.db
```
