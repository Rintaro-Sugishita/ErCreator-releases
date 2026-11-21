---
name: ermlx
description: Create, edit and validate ErCreator ER-diagram model files (.ermlx). Use when the user wants an ER diagram, ERD, table design or database schema as an ErCreator / .ermlx file, wants to turn a feature description, DDL, Mermaid erDiagram or existing code models into an .ermlx, or wants to change or check an existing .ermlx.
---

# ErCreator .ermlx authoring

`.ermlx` is the YAML project file of ErCreator, a free ER-diagram tool (desktop + web).
A file is split into `Structure` (tables, columns, relationships) and `Design` (layout),
linked by page names and entity GUIDs.

ErCreator **loads leniently**: unknown keys are ignored and broken references are silently
dropped, so a wrong file still opens but loses data. Always finish with a validation pass.

Reply to the user in their language. Table / column physical names follow the user's
conventions (default: `snake_case`, plural or singular as the user prefers); put the
human-readable (logical) name in `Comment`.

## Step 0 — Pick the path

Run `ercreator --help`.

- **It works → Path A** (recommended: the CLI assigns IDs, lays out the diagram and validates).
- **Not found, but `dotnet --version` reports 10 or later** → ask the user whether to install
  the CLI with `dotnet tool install -g ErCreator.Cli`, then use Path A. Do not install without asking.
- **Otherwise → Path B** (write the YAML directly).

Editing an existing `.ermlx` → see "Editing an existing file" below (either path).

## Step 1 — Design first

Decide before writing any file:

- Target database: PostgreSQL (default), MySQL, SQLServer or Oracle.
- Tables, columns, types (with lengths), primary keys, NOT NULL, defaults, identity columns.
- Foreign keys: which child columns reference which parent key, and cardinality.
- Unique / secondary indexes and CHECK constraints.
- Pages: one page up to ~20 tables; above that, one page per subject area.

### Shortcuts (partial entities)

A shortcut (`PartialEntities`, "ショートカット" in the UI) shows a table from elsewhere; DDL,
validation and code generation treat it as the real table. Use them:

- **Across pages (required):** both ends of a relationship must be on the relationship's page.
  To reference a table on another page, put a shortcut of that table on the relationship's
  (child's) page and point `ParentEntityId` at the shortcut's `Id`.
- **Within a page, when relationships get too complex:** a table referenced by many others
  (users, tenants, masters, audit `created_by` …) gets extra shortcuts on the same page, each
  serving a few child tables placed near it, so lines don't crowd or cross.

Ask the user only about choices that change the model substantially; otherwise state your
assumptions in the final report. Every table should have a primary key.
Use type names from [references/types.md](references/types.md) for the target database.

## Path A — CLI

1. **Write an AiSchema JSON** (format: [references/aischema.md](references/aischema.md)) to a
   temporary/scratch location, not next to the user's code unless asked.
   - Types may carry lengths (`varchar(255)`, `numeric(10,2)`): the converter turns them into
     domains (`varchar_255`, `numeric_10_2`).
   - Always write `IsNullable` explicitly (omitted means NOT NULL). Add `DefaultValue`,
     `IsIdentity`, `Description`, `Indexes` and `CheckList` where the design needs them.
   - Every relationship lists `ChildColumns` (FK columns that exist in the child); `ParentColumns`
     defaults to the parent's primary key. Self references are fine.
   - For more than ~20 tables set `Group` (subject area) on every entity: each group becomes a page.

2. **Convert**:
   ```sh
   ercreator convert --from-aischema model.json --out model.ermlx --db postgres \
     --layout hierarchical --page-name main --max-fanout 6
   ```
   - `--db` is `postgres | mysql | sqlserver | oracle`.
   - Up to `--per-page` tables (default 20) go on one page named `--page-name`; larger models are
     split by `Group`. Relationships between pages automatically get shortcuts.
   - `--max-fanout 6` moves the 7th and later relationships of a heavily referenced table to
     shortcuts of it on the same page (6 per shortcut). Use 0 (omit) to disable.

   If it prints `warning: リレーションを取り込めませんでした` (relationship not imported), a table
   name in the relationship is wrong — fix the JSON. If it prints
   `warning: 組み込み型にない型をカスタム型として登録しました: ...` (type not built in, registered
   as a custom type), the listed types are not built-in types of that database — usually a typo.
   Fix the JSON and convert again.

3. **Refine the YAML only if needed** ([references/ermlx-authoring.md](references/ermlx-authoring.md)):
   e.g. rename generated domains to meaningful names (`varchar_255` → `email`, update the columns'
   `TypeName`), or add colours. Keep every `Id`, `EntityId` and the layout as generated.

4. **Validate** and fix until clean:
   ```sh
   ercreator validate --in model.ermlx --format json
   ```
   Exit code 0 = no errors. Fix every `critical` and `warning` issue (each has `code`, `message`,
   `path`, `line`). `information` issues are advice: `NotNullNoDefault` can be ignored; consider the rest.

## Path B — Write the YAML directly

Follow [references/ermlx-authoring.md](references/ermlx-authoring.md), which has a complete
template. The essentials:

- Top level has exactly `Structure:` and `Design:`; keys are PascalCase and case-sensitive.
- Every entity has a unique `Id` (GUID, generate with `python3 -c "import uuid; print(uuid.uuid4())"`,
  `uuidgen`, or write distinct well-formed GUIDs yourself) and a matching `EntityLayouts` entry
  (`EntityId`) on the Design page with the **same `PageName`**.
- Relationships reference entities by `ParentEntityId`/`ChildEntityId` **and** name, and list
  `ParentColumnNames`/`ChildColumnNames` that exist in those entities. Both ends must be on the
  relationship's page — use a shortcut for a table on another page (see "Shortcuts").
- `Design` has `ColumnType: All` and `ItemType: ColumnName, Type, PkText`, otherwise the desktop
  app shows no columns.
- Lay entities out on a grid so they don't overlap (formula in the reference).

Then run through the self-check list at the end of the reference. If the CLI becomes
available, run `ercreator validate` as well.

## Editing an existing file

- Read the whole file first. Never change existing `Id` / `EntityId` values: layouts,
  relationships and DDL diffs depend on them.
- Adding a table: add it under `Structure.Pages[n].Entities` **and** an `EntityLayouts`
  entry on the same Design page, placed in free space (right of or below the existing shapes).
- Adding a relationship to a table on another page: add a shortcut of that table on this page
  (`PartialEntities` + `PartialEntityLayouts`), or reuse an existing one on this page.
- A page whose lines have become hard to follow: add shortcuts of the most-referenced table near
  groups of its children and repoint those relationships' `ParentEntityId` to them.
- Keep existing `PartialEntities` and their layouts as they are.
- Renaming a table: update `ParentEntityName`/`ChildEntityName` in its relationships too.
- Renaming a column: update relationship column lists and `Indexes.ColumnNames`.
- Leave `Structure.LastGeneratedData` untouched if present (the app uses it for DDL diffs);
  never add it to a new file.
- Validate afterwards (Path A step 4, or the Path B self-check).

## Mermaid input

`ercreator convert --from-mermaid diagram.md --out model.ermlx --db postgres` accepts a Mermaid
`erDiagram`, but it treats each relationship **label as the child FK column names**
(`users ||--o{ posts : "user_id"`). Rewrite verb labels such as `: has` to FK column names first,
or translate the diagram to AiSchema JSON (Path A) to keep NULL-ability, defaults and comments,
which Mermaid cannot express.

## Final report

Tell the user:

- The path of the `.ermlx` file and the validation result.
- The tables, with a short note on the key relationships.
- Assumptions you made and open questions.
- How to open it: the ErCreator desktop app (open the file), or the web version at
  https://rintaro-sugishita.github.io/ErCreator-releases/canvas ("Show ermlx" → drop the file
  onto the dialog). The web version runs entirely in the browser; nothing is uploaded.
