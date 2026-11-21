# ermlx File Format Specification

This document describes the data structure of **`.ermlx`**, the ErCreator project file.
An `.ermlx` file is plain **YAML** text: people can read and write it, Git can diff and merge it, and you can
**let an AI generate a schema and open it directly in ErCreator**.

- Applies to: ErCreator v2.2 series (including log table definitions and common column templates)
- Encoding: UTF-8
- Extension: `.ermlx`
- 日本語版: [ermlx-spec.md](ermlx-spec.md)

> This specification is written for **producers** of files (people, scripts, AI). ErCreator fills in anything that is not written with default values (see [Omitted values](#omitted-values)).
>
> Loading is lenient: unknown keys are ignored and broken references are silently dropped. Check a file you wrote with the CLI: `ercreator validate --in <file.ermlx>` (unknown keys, missing required keys, duplicate IDs, broken references, unknown types, colour format, plus the same model checks as the app; `--format json` for machine-readable output).

---

## 1. Overview

A file has two parts: **Structure** (the logical model) and **Design** (appearance and placement).
The same pages, entities and relationships appear in both, matched by **page name** and **ID (GUID)**.

```yaml
Structure:            # logical model: DB type, domains, entities, columns, relationships…
  DbType: PostgreSQL
  Domains: [...]
  Sequences: [...]
  CustomBuiltInTypes: [...]
  LogTemplate: {...}  # project-wide template for log tables (optional)
  CommonColumnTemplates: [...]  # common column templates (optional)
  Pages:
    - PageName: main
      Entities: [...]
      Relationships: [...]
      PartialEntities: [...]
Design:               # appearance: display mode, page size, position and color of each shape
  ColumnType: All
  ItemType: ColumnName, Type, PkText
  EntityInfoType: NameAndComment
  Pages:
    - PageName: main  # matched with Structure.Pages by name
      EntityLayouts: [...]
      RelationshipLayouts: [...]
      PartialEntityLayouts: [...]
      TextBoxes: [...]
```

### Conventions

| Item | Rule |
|---|---|
| Keys | The property name itself (PascalCase). Case-sensitive |
| Enums | Written by name (e.g. `PostgreSQL`, `ZeroOrMore`). Flag enums are comma-separated, e.g. `ColumnName, Type` |
| GUID | `8b3c1d2e-4f5a-4b6c-9d7e-0f1a2b3c4d5e` format (36 characters with hyphens). Any value works as long as it is unique within the file |
| Colors | `#AARRGGBB` (e.g. `#FFFFC0CB`). `#00FFFFFF` is transparent, i.e. no color |
| Unknown keys | Ignored (they do not cause a load error) |
| Defaults | Values equal to their default are omitted when saving. Producers may omit them too |

---

## 2. Structure

| Key | Type | Description |
|---|---|---|
| `DbType` | enum | Target database. `PostgreSQL` (default) / `Oracle` / `MySQL` / `SQLServer`. Used to resolve built-in types |
| `FilePolicies` | object | File-level settings ([2.1](#21-filepolicies)) |
| `Domains` | array | Domains (user-defined types) ([2.2](#22-domains)) |
| `Sequences` | array | Sequences ([2.3](#23-sequences)) |
| `CustomBuiltInTypes` | array | Types that are not built into the database type ([2.4](#24-custombuiltintypes)) |
| `LogTemplate` | object | Project-wide template for log tables (optional) ([2.8](#28-logtemplate)) |
| `CommonColumnTemplates` | array | Common column templates (optional) ([2.10](#210-commoncolumntemplates)) |
| `LastGeneratedData` | object | Snapshot taken when DDL was last generated. **Used internally by the app — producers should omit it** |
| `Pages` | array | Pages ([2.5](#25-pages)) |

### 2.1 FilePolicies

| Key | Type | Default | Description |
|---|---|---|---|
| `IsCreateDomain` | bool | false | Whether DDL outputs domains (CREATE DOMAIN etc.) |
| `DefaultTextboxBackColor` | color | none | Background color of new text boxes |
| `DefaultTextboxBorderColor` | color | none | Border color of new text boxes |

### 2.2 Domains

User-defined types that columns can use. A column refers to a domain by writing its name in `TypeName`.

| Key | Type | Default | Description |
|---|---|---|---|
| `TypeName` | string | — | **Domain name (required, unique)** |
| `ParentTypeName` | string | — | Parent type: a built-in type name (e.g. `numeric`) or another domain name |
| `Suffix1` | integer | none | Length / precision (the 50 in `varchar(50)`, the 10 in `numeric(10,2)`) |
| `Suffix2` | integer | none | Scale (the 2 in `numeric(10,2)`) |
| `DefaultValue` | string | empty | Default value as an SQL expression (e.g. `0`, `'none'`, `now()`) |
| `DefaultName` | string | empty | Default physical name for columns using this domain (optional) |
| `Remarks` | string | empty | Remarks |

```yaml
Domains:
  - TypeName: amount
    ParentTypeName: numeric
    Suffix1: 10
    Suffix2: 2
    DefaultValue: "0"
```

### 2.3 Sequences

| Key | Type | Description |
|---|---|---|
| `Name` | string | Sequence name |
| `StartWith` / `Increment` / `MinValue` / `MaxValue` | number | Start, increment, minimum, maximum (optional) |
| `IsCycle` | bool | Whether it cycles (default false) |
| `TableName` / `ColumnName` | string | Owning table and column (optional) |

### 2.4 CustomBuiltInTypes

Registers type names that the `DbType` does not provide (extension types etc.). Usually not needed.

| Key | Type | Description |
|---|---|---|
| `TypeName` | string | Type name |
| `IsBuiltInType` | bool | Set to `true` |
| `DbType` | enum | Target database |
| `MermaidTypeName` | string | Type name used for Mermaid output (optional) |

### 2.5 Pages

| Key | Type | Description |
|---|---|---|
| `PageName` | string | **Page name (unique)**. Matched with the Design page of the same name |
| `Entities` | array | Entities (tables) ([2.6](#26-entities)) |
| `Relationships` | array | Relationships ([2.7](#27-relationships)) |
| `PartialEntities` | array | Shortcuts (references to an entity that lives on another page) ([2.9](#29-partialentities)) |

### 2.6 Entities

| Key | Type | Default | Description |
|---|---|---|---|
| `EntityName` | string | — | **Physical name (required)**. With a schema: `sales.customer` |
| `Id` | GUID | — | **Entity ID (required, unique)**. Referenced by layouts, relationships and shortcuts |
| `Comment` | string | empty | Logical name (e.g. Customer) |
| `Remarks` | string | empty | Remarks |
| `BaseEntityName` | string | none | Physical name of the parent entity (PostgreSQL INHERITS) |
| `Tags` | array | none | Tags (`Key` / `Value`) |
| `Columns` | array | none | Columns ([2.6.1](#261-columns)) |
| `Indexes` | array | none | Indexes ([2.6.2](#262-indexes)) |
| `CheckList` | string array | none | CHECK constraints (SQL expressions, e.g. `price >= 0`). DDL emits them as named constraints `{table}_{expression hash}_check` |
| `Log` | object | none | Log table setting ([2.6.3](#263-log)) |
| `CommonTemplateId` | GUID | none | `Id` of the common column template the table uses ([2.10](#210-commoncolumntemplates)). At most one per table |

#### 2.6.1 Columns

| Key | Type | Default | Description |
|---|---|---|---|
| `Id` | GUID | generated | Column ID, used by DDL diffs to detect renames. May be omitted for new columns |
| `ColumnName` | string | — | **Physical name (required)** |
| `Comment` | string | empty | Logical name |
| `Desctiption` | string | empty | Description (**spelled `Desctiption`** for compatibility) |
| `TypeName` | string | — | **Type**: a built-in type name (e.g. `integer`, `character varying`, `text`, `timestamp without time zone`), a domain name, or a `CustomBuiltInTypes` name |
| `AllowNull` | bool | **true** | Whether NULL is allowed. Write `false` for NOT NULL |
| `PrimaryKeyNumber` | integer | none | Position in the primary key (1, 2, …). Omit for non-key columns |
| `IsIdentity` | bool | false | IDENTITY (auto-numbered) column |
| `DefaultValue` | string | empty | Default value (SQL expression) |
| `BackgroundColor` | color | empty | Row background color |
| `Tags` | array | none | Tags (`Key` / `Value`) |
| `ExcludeFromLog` | bool | false | Not copied into the log table (body only) |
| `LogColumnName` | string | none | Physical name on the log side (defaults to `ColumnName`) |
| `LogComment` | string | none | Logical name on the log side (defaults to `Comment`) |
| `CommonColumnId` | GUID | none | For a column materialized from a common column template, the template column's `Id` ([2.10](#210-commoncolumntemplates)) |

> For types with a length (`varchar(50)` etc.), define a domain with the length and refer to it.

#### 2.6.2 Indexes

| Key | Type | Default | Description |
|---|---|---|---|
| `IndexName` | string | — | Index name (unique within the schema) |
| `ColumnNames` | string array | — | Physical names of the indexed columns, in order |
| `IsUnique` | bool | false | UNIQUE index |
| `WhereSql` | string | empty | Partial index condition (e.g. `deleted_at IS NULL`) |

#### 2.6.3 Log

Defines a **log table** that has almost the same columns as the entity, without creating a separate entity.
The log table is not stored in the file; it is built every time DDL, diffs or code are generated:

- Log-only columns first (from the template or specific to this table)
- Then the entity's columns (except `ExcludeFromLog: true`; renamed by `LogColumnName` / `LogComment`)
- Copied columns **lose PK, IDENTITY and DEFAULT**; NOT NULL and the type are kept
- The entity's indexes, foreign keys and CHECK constraints are not copied

| Key | Type | Default | Description |
|---|---|---|---|
| `IsEnabled` | bool | **true** | Whether the log table is generated. The setting is kept when `false` |
| `PhysicalName` | string | — | Physical name of the log table (e.g. `customer_log`) |
| `LogicalName` | string | empty | Logical name of the log table |
| `UseTemplate` | bool | **true** | Use the log-only columns and indexes of `Structure.LogTemplate` |
| `Columns` | array | none | Log-only columns of this table (used when `UseTemplate: false`; same format as [Columns](#261-columns)) |
| `Indexes` | array | none | Indexes of the log table (same format as [Indexes](#262-indexes); column names are log-side names) |

```yaml
- EntityName: customer
  Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
  Comment: Customer
  Columns:
    - ColumnName: id
      TypeName: integer
      AllowNull: false
      PrimaryKeyNumber: 1
      IsIdentity: true
      LogColumnName: customer_id   # renamed on the log side so it does not clash with the log ID
    - ColumnName: name
      Comment: Name
      TypeName: text
      AllowNull: false
    - ColumnName: version
      TypeName: integer
      ExcludeFromLog: true         # not in the log
  Log:
    PhysicalName: customer_log
    LogicalName: Customer history
    Indexes:
      - IndexName: customer_log_cid_idx
        ColumnNames: [customer_id, logged_at]
```

### 2.7 Relationships

| Key | Type | Default | Description |
|---|---|---|---|
| `Name` | string | — | Relationship name (FK constraint name, unique within the schema) |
| `ParentEntityId` / `ChildEntityId` | GUID | — | Entity IDs of the parent (referenced) and the child (holds the FK) |
| `ParentEntityName` / `ChildEntityName` | string | — | Physical names of parent / child (fallback when the ID is not found) |
| `ParentColumnNames` / `ChildColumnNames` | string array | — | Matching column names (same order, same count) |
| `ParentCardinality` | enum | `One` | Cardinality on the parent side |
| `ChildCardinality` | enum | `ZeroOrMore` | Cardinality on the child side |
| `NeedForeignKey` | bool | false | Whether DDL outputs a FOREIGN KEY constraint |
| `IsParentChildrenRelation` | bool | false | Identifying relationship (A5:SQL Mk-2 "Dependence"), mainly for A5 conversion |
| `IsInheritRelationship` | bool | false | Inheritance (not a foreign key) |

Cardinality: `None` / `Zero` / `One` / `More` / `ZeroOrOne` / `ZeroOrMore` / `OneOrMore`

```yaml
Relationships:
  - Name: fk_orders_customer
    NeedForeignKey: true
    ParentEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
    ParentEntityName: customer
    ChildEntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
    ChildEntityName: orders
    ParentColumnNames: [id]
    ChildColumnNames: [customer_id]
```

### 2.8 LogTemplate

Project-wide template for log tables, used by entities with `Log.UseTemplate: true`.

| Key | Type | Default | Description |
|---|---|---|---|
| `PhysicalNamePattern` | string | `{name}_log` | Naming rule for the physical name of new logs |
| `LogicalNamePattern` | string | `{comment}履歴` | Naming rule for the logical name of new logs |
| `Columns` | array | none | Log-only columns (include the log-side primary key). Same format as [Columns](#261-columns) |
| `Indexes` | array | none | Indexes (table below) |

Template indexes:

| Key | Type | Description |
|---|---|---|
| `NamePattern` | string | Index name rule (e.g. `{log}_logged_at_idx`) |
| `ColumnNames` | string array | Indexed columns (log-side names) |
| `IsUnique` | bool | UNIQUE index |
| `WhereSql` | string | Partial index condition |

Placeholders: `{name}` entity physical name / `{comment}` entity logical name (the physical name when empty) / `{log}` log physical name (without schema)

```yaml
LogTemplate:
  Columns:
    - ColumnName: log_id
      Comment: Log ID
      TypeName: bigint
      AllowNull: false
      PrimaryKeyNumber: 1
      IsIdentity: true
    - ColumnName: logged_at
      Comment: Logged at
      TypeName: timestamp without time zone
      AllowNull: false
      DefaultValue: now()
  Indexes:
    - NamePattern: "{log}_logged_at_idx"
      ColumnNames: [logged_at]
```

### 2.9 PartialEntities

A reference (shortcut) that shows an entity living on another page on this page.

| Key | Type | Description |
|---|---|---|
| `Id` | GUID | ID of the shortcut itself (unique) |
| `SourceEntityId` | GUID | ID of the referenced (real) entity |
| `NickName` | string | Display name (optional) |

The UI calls these "shortcuts". Name, columns, indexes etc. come from the real entity, and DDL, validation and code generation treat a shortcut as its real entity (a shortcut is not a table of its own).

**Relationships and shortcuts**

- Both ends of a relationship are entities or shortcuts on the relationship's own page. **To connect a table on another page, put a shortcut of that table on the relationship's page** and write the shortcut's `Id` in `ParentEntityId` (or `ChildEntityId`). `ParentEntityName` keeps the real table's physical name.
- Even within one page, a table referenced by many others (users, masters, …) can get several shortcuts, splitting its relationships among them to avoid crowded or crossing lines.
- Shortcut positions go in `Design.Pages[].PartialEntityLayouts` (matched by `Id`).

```yaml
Structure:
  Pages:
    - PageName: master
      Entities:
        - EntityName: customer
          Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          # ...
    - PageName: sales
      Entities:
        - EntityName: orders
          Id: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          # ...
      PartialEntities:
        - Id: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a          # shortcut of customer
          SourceEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
      Relationships:
        - Name: orders_customer_id_fkey
          NeedForeignKey: true
          ParentEntityId: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a   # the shortcut's Id
          ParentEntityName: customer                             # physical name of the real table
          ChildEntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          ChildEntityName: orders
          ParentColumnNames: [id]
          ChildColumnNames: [customer_id]
Design:
  Pages:
    - PageName: sales
      PartialEntityLayouts:
        - Id: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a
          Left: 40
          Top: 40
```

### 2.10 CommonColumnTemplates

Templates for columns shared by many tables (surrogate key `id`, audit columns `created_at` / `created_by`, …).
A table picks one template with `CommonTemplateId`.

- Template columns become **real columns** in the table's `Columns` (linked to the template column by `CommonColumnId`). They can be referenced by foreign keys from other tables and indexed
- The definition (`ColumnName`, `Comment`, `Desctiption`, `TypeName`, `AllowNull`, `PrimaryKeyNumber`, `IsIdentity`, `DefaultValue`) **comes from the template** and is overwritten from it on load
- Table-specific values (`BackgroundColor`, `Tags`, `ExcludeFromLog`, `LogColumnName`, `LogComment`) are not overwritten
- Columns are ordered: leading common columns → the table's own columns → trailing common columns
- When writing by hand you do not need to list common columns in the table's `Columns`: setting `CommonTemplateId` adds them on load (an existing column with the same name is linked instead)

| Key | Type | Default | Description |
|---|---|---|---|
| `Id` | GUID | — | **Template ID (required, unique)** |
| `Name` | string | — | Template name (unique) |
| `Columns` | array | none | Common columns: the [Columns](#261-columns) format plus `Position` |
| `Relationships` | array | none | Foreign keys from common columns (table below). Not drawn on the canvas |

`Columns[].Position`: `Head` (leading, default) / `Tail` (trailing)

Common column relationships (`Relationships`):

| Key | Type | Default | Description |
|---|---|---|---|
| `NamePattern` | string | — | FK constraint name rule. `{name}` table physical name / `{comment}` table logical name (e.g. `{name}_created_by_fk`) |
| `ColumnNames` | string array | — | Child side: physical names of the common columns |
| `ParentEntityId` | GUID | none | `Id` of the referenced table |
| `ParentEntityName` | string | empty | Physical name of the referenced table (fallback when the ID is not found) |
| `ParentColumnNames` | string array | — | Referenced column names |
| `NeedForeignKey` | bool | **true** | Whether DDL outputs a FOREIGN KEY constraint |

```yaml
CommonColumnTemplates:
  - Id: 7a1d3c55-0b2e-4f61-9c8a-2d4e6f8a0b1c
    Name: Standard
    Columns:
      - ColumnName: id
        Comment: ID
        TypeName: bigint
        AllowNull: false
        PrimaryKeyNumber: 1
        IsIdentity: true
        Position: Head
      - ColumnName: created_at
        Comment: Created at
        TypeName: timestamp without time zone
        AllowNull: false
        DefaultValue: now()
        Position: Tail
      - ColumnName: created_by
        Comment: Created by
        TypeName: bigint
        Position: Tail
    Relationships:
      - NamePattern: "{name}_created_by_fk"
        ColumnNames: [created_by]
        ParentEntityName: users
        ParentColumnNames: [id]
```

---

## 3. Design

| Key | Type | Default | Description |
|---|---|---|---|
| `ColumnType` | enum | `None` | Which columns entities show. **Normally `All`** |
| `ItemType` | flag enum | `None` | Items shown per column. **Normally `ColumnName, Type, PkText`** |
| `EntityInfoType` | enum | `NameOnly` | Entity title: `NameOnly` / `NameAndComment` / `CommentOnly` |
| `Margin` | number | 30 | Spacing between shapes |
| `ShowTailCommonColumns` | bool | **true** | Show trailing common columns on the canvas (drawn dimmed when shown) |
| `Pages` | array | none | Per-page placement ([3.1](#31-pages)) |

- `ColumnType`: `None` / `All` / `PkOnly` / `PkAndFkOnly` / `HugeEntityName` / `PkAndUkOnly` / `PkAndUkAndFkOnly`
- `ItemType` (combinable): `ColumnName` / `Comment` / `Type` / `Type2` / `PkText` / `Description` / `UkText`

> If `ColumnType` and `ItemType` are omitted, no columns are shown. Write them explicitly in new files.

### 3.1 Pages

| Key | Type | Default | Description |
|---|---|---|---|
| `PageName` | string | — | Same value as the Structure page name |
| `PageWidth` / `PageHeight` | number | 1191 / 670 | Page size (guide for printing / image export) |
| `BackgroundColor` | color | `#FFFFFFFF` | Page background |
| `EntityLayouts` | array | none | Entity placement (table below) |
| `RelationshipLayouts` | array | none | Relationship line shapes ([3.2](#32-relationshiplayouts)) |
| `PartialEntityLayouts` | array | none | Shortcut placement (same fields as `EntityLayouts`, keyed by `Id` instead of `EntityId`; default size 80×20) |
| `TextBoxes` | array | none | Text boxes ([3.3](#33-textboxes)) |

Entity placement (`EntityLayouts`):

| Key | Type | Default | Description |
|---|---|---|---|
| `EntityId` | GUID | — | Entity `Id` on the Structure side |
| `Left` / `Top` | number | 0 | Top-left position (px) |
| `Width` / `Height` | number | 90 / 50 | Size (px). Fitted to the content when displayed |
| `BackgroundColor` | color | `#00FFFFFF` | Header background |
| `IsIgnoreMermaid` | bool | false | Exclude from Mermaid output |

> Entities without a layout all stack at (0, 0). If you cannot choose positions, offset entities by about 240px horizontally and 200px vertically.

### 3.2 RelationshipLayouts

Relationship line shapes. **When omitted, lines are routed automatically**, so you normally do not write them.

| Key | Type | Default | Description |
|---|---|---|---|
| `ParentEntityId` / `ChildEntityId` | GUID | — | Parent / child IDs of the matching relationship |
| `Name` | string | — | Relationship name (fallback when the IDs do not match) |
| `ParentAttachedPosition` / `ChildAttachedPosition` | enum | `None` | Side the line attaches to: `None` (automatic) / `Top` / `Left` / `Right` / `Bottom` |
| `ParentAttachedX` / `ParentAttachedY` / `ChildAttachedX` / `ChildAttachedY` | number | 0 | Attachment offset on the side |
| `Control1X` … `Control3Y` | number | 0 | Bend points |
| `RelationColor` | color | `#FF000000` | Line color |
| `Visibility` | bool | **false** | Whether the line is shown. **If you write this entry, set `true` explicitly** (omitted means hidden) |

### 3.3 TextBoxes

| Key | Type | Description |
|---|---|---|
| `InnerText` | string | Text |
| `Left` / `Top` / `Width` / `Height` | number | Position and size |
| `BackgroundColor` / `BorderColor` | color | Background / border color |
| `BorderWidth` / `FontSize` | number | Border width / font size |
| `FontFamily` | string | Font name |

---

## 4. References

| Reference | Rule |
|---|---|
| Structure ↔ Design pages | Same `PageName` |
| Entity ↔ layout | `Entities[].Id` = `EntityLayouts[].EntityId` |
| Relationship → entity | By `ParentEntityId` / `ChildEntityId` (may be the `Id` of a shortcut on the same page); if not found, by `ParentEntityName` / `ChildEntityName` |
| Relationship → columns | Physical names in `ParentColumnNames` / `ChildColumnNames` |
| Column → type | `TypeName` matched exactly against built-in types (depends on `DbType`), `CustomBuiltInTypes` and `Domains` |
| Inheritance | `BaseEntityName` = parent `EntityName` |
| Shortcut → entity | `SourceEntityId` = entity `Id` |
| Index → columns | Physical names in `ColumnNames` |
| Table → common column template | `CommonTemplateId` = template `Id` |
| Common column → template column | `CommonColumnId` = template column `Id` |
| Common column relationship → referenced table | By `ParentEntityId`; if not found, by `ParentEntityName` |

- IDs may be any value as long as they are unique within the file. Assign any UUID (v4 etc.) to new objects.
- To show the same entity on several pages, put the entity on one page and `PartialEntities` references on the others. Relationships to a table on another page also go through such a shortcut ([2.9](#29-partialentities)).

## Omitted values

- Keys that are not written take their default value (the "Default" column of each table).
- Watch the bool defaults: **`AllowNull`, `Log.IsEnabled`, `Log.UseTemplate`, `NeedForeignKey` of common column relationships and `Design.ShowTailCommonColumns` default to `true`**. Every other bool defaults to `false`.
- An empty string is `""`; an empty array is the same as omitting it.

## 5. Views, functions, triggers (external SQL files)

Views, stored functions and triggers are not stored in the `.ermlx` file. Put them as SQL files, one definition per
file, in these subfolders next to the `.ermlx` file (ErCreator loads them and orders them by dependency for DDL).

| Folder | Content |
|---|---|
| `Views/` | `CREATE VIEW ... AS ...;` |
| `Functions/` | `CREATE FUNCTION` / `CREATE PROCEDURE` |
| `Triggers/` | `CREATE TRIGGER ... ON table ...` |

---

## 6. Minimal example

Two tables and one relationship. Opens in ErCreator as is.

```yaml
Structure:
  DbType: PostgreSQL
  Pages:
    - PageName: main
      Entities:
        - EntityName: customer
          Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          Comment: Customer
          Columns:
            - ColumnName: id
              Comment: Customer ID
              TypeName: integer
              AllowNull: false
              PrimaryKeyNumber: 1
              IsIdentity: true
            - ColumnName: name
              Comment: Name
              TypeName: text
              AllowNull: false
        - EntityName: orders
          Id: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          Comment: Order
          Columns:
            - ColumnName: id
              TypeName: integer
              AllowNull: false
              PrimaryKeyNumber: 1
            - ColumnName: customer_id
              Comment: Customer ID
              TypeName: integer
              AllowNull: false
            - ColumnName: ordered_at
              Comment: Ordered at
              TypeName: timestamp without time zone
              AllowNull: false
              DefaultValue: now()
          Indexes:
            - IndexName: orders_customer_id_idx
              ColumnNames: [customer_id]
      Relationships:
        - Name: fk_orders_customer
          NeedForeignKey: true
          ParentEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          ParentEntityName: customer
          ChildEntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          ChildEntityName: orders
          ParentColumnNames: [id]
          ChildColumnNames: [customer_id]
Design:
  ColumnType: All
  ItemType: ColumnName, Type, PkText
  EntityInfoType: NameAndComment
  Pages:
    - PageName: main
      EntityLayouts:
        - EntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          Left: 40
          Top: 40
        - EntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          Left: 320
          Top: 40
```

## 7. Tips for generating files with AI

Adding instructions like these makes the output much more likely to open as is.

```text
Output the ER diagram in ErCreator's .ermlx (YAML) format, following docs/ermlx-spec.en.md.
- Split it into Structure and Design; give every entity a unique UUID in Id and use the same value in Design.EntityLayouts.EntityId
- Write AllowNull: false for NOT NULL columns (omitting it means NULL is allowed)
- Mark primary keys with PrimaryKeyNumber: 1, 2, …
- Use the built-in type names of the DbType (PostgreSQL). Define domains for types with a length and refer to them
- Put foreign keys in Relationships, matching ParentEntityId/ChildEntityId and column names, with NeedForeignKey: true
- In Design use ColumnType: All / ItemType: "ColumnName, Type, PkText" / EntityInfoType: NameAndComment,
  and give entities Left/Top about 280px apart horizontally and 220px vertically so they do not overlap
- For a relationship to a table on another page, put a shortcut (PartialEntities) of that table on the relationship's page and reference its Id
- Do not output RelationshipLayouts or LastGeneratedData
```

ErCreator can also import **Mermaid erDiagram** (laid out automatically) and **A5:SQL Mk-2** files. See [Import / export](import-export.md) (Japanese) for the supported formats.
