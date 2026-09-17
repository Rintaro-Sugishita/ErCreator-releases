# ErCreator
This program is a tool for creating ER diagrams.

**▶ Try it in your browser (no install): https://rintaro-sugishita.github.io/ErCreator-releases/canvas**

The web version runs entirely in your browser (Blazor WebAssembly) — create ER diagrams, save/reuse them, and generate DDL. Live-database reverse engineering, Git versioning, and AI-assisted design/review are available in the desktop app ([download the latest release](https://github.com/Rintaro-Sugishita/ErCreator-releases/releases/latest)).

## Function Overview
In addition to the basic ER diagram creation function, it has the following distinctive functions.
- Import Excel DB definitions
- Export to Excel DB definitions
- Read table definitions from PostgreSQL
- Generate DDL
- Generate differential DDL from past commit logs when managing with Git
- Data structure in yaml format that is easy to reuse and can be merged with Git
- Paste ranges of table format data into grid elements
- Various ways to display attributes
- Extensible code generator (C# by default)
- Diagrams that can be switched between multiple tabs

## Installation
- **Web**: nothing to install — open https://rintaro-sugishita.github.io/ErCreator-releases/
- **Desktop (Windows)**: download the ZIP from the [latest release](https://github.com/Rintaro-Sugishita/ErCreator-releases/releases/latest), unzip, and run `ErCreator.exe`. The build is self-contained (single file), so no separate .NET runtime install is required.

## Usage
1. **Open the canvas** — on the web, click **Open ER Canvas** on the landing page.
2. **Add an entity (table)** — click **+ Entity**, then enter its name and columns.
3. **Edit an entity** — select it and edit its columns (name, type, PK/FK/UK, comments) in the side panel.
4. **Connect entities** — click **+ Relation** and drag between two entities to create a foreign-key relationship.
5. **Inspect / export** — use **Show ermlx** to view the model, and the **DDL Playground** to generate DDL.

The UI is available in Japanese and English — switch with the **JA / EN** toggle.

## History
