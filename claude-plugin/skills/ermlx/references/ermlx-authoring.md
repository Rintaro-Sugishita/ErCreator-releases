# Writing .ermlx by hand — authoring reference

The subset of the format needed to create and edit models. Full specification:
https://github.com/Rintaro-Sugishita/ErCreator-releases/blob/main/docs/ermlx-spec.en.md

## Rules

- UTF-8 YAML. Keys are PascalCase and **case-sensitive**. Unknown keys are silently ignored.
- Enum values are written by name (`PostgreSQL`, `ZeroOrMore`); flag enums comma-separated
  (`ColumnName, Type, PkText`).
- GUIDs: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, unique within the file.
- Colours: `#AARRGGBB` (e.g. `#FFFFC0CB`), quoted because of `#`. `#00FFFFFF` = no colour.
- Omit anything that equals its default. **Bool defaults: `AllowNull` is `true`**; other
  column/relationship bools are `false`.

## Template

```yaml
Structure:
  DbType: PostgreSQL                 # PostgreSQL | MySQL | SQLServer | Oracle
  Domains:                           # length / precision types, referenced by TypeName
    - TypeName: email
      ParentTypeName: character varying
      Suffix1: 255
    - TypeName: amount
      ParentTypeName: numeric
      Suffix1: 12                    # precision
      Suffix2: 2                     # scale
  Pages:
    - PageName: main                 # unique; pairs with Design.Pages[].PageName
      Entities:
        - EntityName: customer       # physical name (required)
          Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10   # required, unique
          Comment: Customer          # logical name
          Columns:
            - ColumnName: id
              Comment: Customer ID
              TypeName: bigint
              AllowNull: false
              PrimaryKeyNumber: 1    # 1, 2, ... for composite keys; omit on non-key columns
              IsIdentity: true
            - ColumnName: email
              Comment: Email
              TypeName: email        # a domain
              AllowNull: false
            - ColumnName: created_at
              TypeName: timestamp with time zone
              AllowNull: false
              DefaultValue: now()    # SQL expression, as written in DDL
          Indexes:
            - IndexName: customer_email_key
              ColumnNames: [email]
              IsUnique: true
        - EntityName: orders
          Id: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          Comment: Order
          Columns:
            - ColumnName: id
              TypeName: bigint
              AllowNull: false
              PrimaryKeyNumber: 1
              IsIdentity: true
            - ColumnName: customer_id
              TypeName: bigint
              AllowNull: false
            - ColumnName: total
              TypeName: amount
              AllowNull: false
              DefaultValue: "0"
            - ColumnName: status
              TypeName: varchar
              AllowNull: false
          CheckList:
            - "total >= 0"
          Indexes:
            - IndexName: orders_customer_id_idx
              ColumnNames: [customer_id]
      Relationships:
        - Name: orders_customer_id_fkey          # FK constraint name, unique in the schema
          NeedForeignKey: true                   # emit FOREIGN KEY in DDL
          ParentEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          ParentEntityName: customer
          ChildEntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          ChildEntityName: orders
          ParentColumnNames: [id]
          ChildColumnNames: [customer_id]
          ParentCardinality: One                 # default One; ZeroOrOne for a nullable FK
          ChildCardinality: ZeroOrMore           # default ZeroOrMore; OneOrMore | One | ZeroOrOne
Design:
  ColumnType: All                    # required in practice: without it the desktop app shows no columns
  ItemType: ColumnName, Type, PkText
  EntityInfoType: NameAndComment
  Pages:
    - PageName: main
      EntityLayouts:
        - EntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          Left: 40
          Top: 40
        - EntityId: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          Left: 400
          Top: 40
```

`RelationshipLayouts` can be omitted (lines are routed automatically). Never write
`Structure.LastGeneratedData` (app-internal).

## Column keys

| Key | Notes |
|---|---|
| `ColumnName` | Physical name (required). |
| `Comment` | Logical name. |
| `Desctiption` | Description — **this misspelling is the real key**. |
| `TypeName` | Built-in type of `DbType` ([types.md](types.md)), a domain name, or a `CustomBuiltInTypes` name. Exact match. |
| `AllowNull` | Default `true`. Write `false` for NOT NULL. |
| `PrimaryKeyNumber` | Position in the primary key (1-based). There is no `IsPrimaryKey` key. |
| `IsIdentity` | Auto-numbered (IDENTITY / AUTO_INCREMENT). |
| `DefaultValue` | SQL expression (`0`, `'draft'`, `now()`, `gen_random_uuid()`). Quote YAML-special values: `"0"`, `"true"`. |

## Lengths and precision

A type with a length is a **domain** (`Structure.Domains`): `TypeName` (domain name, unique),
`ParentTypeName` (built-in type), `Suffix1` (length / precision), `Suffix2` (scale).
Columns reference the domain by name. Prefer meaningful names (`email`, `code`, `amount`).
A domain's `DefaultValue` is not copied into column DDL — put defaults on the column.
`Structure.FilePolicies.IsCreateDomain: true` emits `CREATE DOMAIN`; by default the column DDL just
uses the parent type with the length (e.g. `character varying(255)`).

## Entity keys

`EntityName` (required), `Id` (required GUID), `Comment`, `Remarks`, `Columns`, `Indexes`
(`IndexName`, `ColumnNames`, `IsUnique`, `WhereSql`), `CheckList` (SQL expressions without the `CHECK` keyword, e.g. `price >= 0`),
`BaseEntityName` (PostgreSQL INHERITS), `Tags` (`Key`/`Value`).

## Relationships

- Parent = referenced side (has the key); child = side with the FK columns.
- `ParentColumnNames` / `ChildColumnNames`: same count and order, existing columns.
- Name convention: `<child>_<fk columns>_fkey`.
- Cardinality values: `One`, `ZeroOrOne`, `ZeroOrMore`, `OneOrMore`.
- A self reference has the same entity as parent and child (e.g. `employees.manager_id → employees.id`).

## Pages and shortcuts

One page for up to ~20 tables; split bigger models by subject area. Each page appears in **both**
`Structure.Pages` and `Design.Pages` with the same `PageName`. A table lives on exactly one page.

A **shortcut** (`PartialEntities`, shown as "ショートカット" in the UI) stands for a table on the
same or another page. Its name, columns and indexes are the real table's; DDL and validation treat
it as the real table.

```yaml
Structure:
  Pages:
    - PageName: sales
      PartialEntities:
        - Id: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a          # the shortcut's own Id
          SourceEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10   # the real table's Id
      Relationships:
        - Name: orders_customer_id_fkey
          NeedForeignKey: true
          ParentEntityId: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a   # shortcut Id
          ParentEntityName: customer                             # real table name
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

Rules:

- **Both ends of a relationship are on the relationship's page.** A relationship normally lives on
  its child's page; if the parent is on another page, put a shortcut of the parent on the child's
  page (one per table and page, shared by all its relationships there) and use its `Id`.
- **Complex pages:** when a table is referenced by many tables on one page (more than ~6), add
  shortcuts of it on that page, each serving up to ~6 children placed below/beside it, and point
  those relationships' `ParentEntityId` at the shortcut. Self references stay on the table.
- Every shortcut needs a `PartialEntityLayouts` entry (same `Id`) on its page.
- A shortcut never points at another shortcut.

## Layout

Sizes are fitted to the content when displayed, so only `Left`/`Top` are needed. Estimate each
entity's height as `26 + 18 × columns` and lay entities out in rows:

- Start at `Left: 40, Top: 40`; step `Left` by 360 (use 420 if names/types are long); 4 per row.
- Next row `Top` = previous row `Top` + tallest entity in that row + 60.
- Put parents (master tables) in earlier rows / further left than their children.
- Shortcuts are small boxes (about 26 px high, `Width` ≈ 9 px per character of the label + 16).
  Place each one directly above the child tables it serves.

## Self-check (when the CLI is not available)

1. Top level has `Structure:` and `Design:` only; no misspelled or lower-case keys.
2. Every entity has `EntityName` and a unique `Id`; no two entities share a name.
3. Every Structure page has a Design page with the same `PageName`, and every entity has one
   `EntityLayouts` entry with its `Id` on that page; no layout points to a missing entity.
4. Every relationship's entity IDs/names exist and its column lists match existing columns
   (same count, same order, compatible types). Both ends are tables or shortcuts on the
   relationship's own page; every shortcut has a `PartialEntityLayouts` entry.
5. Every `TypeName` is a built-in type of `DbType`, a domain, or a custom type — exactly spelled.
6. NOT NULL columns have `AllowNull: false`; every table has `PrimaryKeyNumber` columns.
7. Names of relationships and indexes are unique; colours are `#AARRGGBB`.
8. `Design.ColumnType` and `Design.ItemType` are set.
