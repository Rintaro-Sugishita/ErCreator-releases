# AiSchema JSON (input of `ercreator convert --from-aischema`)

A compact, layout-free description of a schema. The CLI turns it into an `.ermlx` with
entity IDs, length domains, relationship names, pages, shortcuts and an automatic layout.

```json
{
  "Entities": [
    {
      "Name": "users",
      "Comment": "User",
      "Columns": [
        { "Name": "id",         "Type": "bigint",       "IsPrimaryKey": true, "IsNullable": false, "IsIdentity": true, "Comment": "User ID" },
        { "Name": "email",      "Type": "varchar(255)", "IsNullable": false, "Comment": "Email" },
        { "Name": "created_at", "Type": "timestamp with time zone", "IsNullable": false, "DefaultValue": "now()", "Comment": "Created at" }
      ],
      "Indexes": [
        { "Columns": ["email"], "IsUnique": true }
      ]
    },
    {
      "Name": "posts",
      "Comment": "Post",
      "Columns": [
        { "Name": "id",        "Type": "bigint",  "IsPrimaryKey": true, "IsNullable": false, "IsIdentity": true, "Comment": "Post ID" },
        { "Name": "user_id",   "Type": "bigint",  "IsNullable": false, "Comment": "Author" },
        { "Name": "parent_id", "Type": "bigint",  "IsNullable": true,  "Comment": "Reply to" },
        { "Name": "body",      "Type": "text",    "IsNullable": false, "Comment": "Body", "Description": "Markdown" },
        { "Name": "likes",     "Type": "integer", "IsNullable": false, "DefaultValue": "0", "Comment": "Likes" }
      ],
      "Indexes": [
        { "Columns": ["user_id"] }
      ],
      "CheckList": ["likes >= 0"]
    }
  ],
  "Relationships": [
    {
      "ParentEntity": "users",
      "ChildEntity": "posts",
      "ParentColumns": ["id"],
      "ChildColumns": ["user_id"],
      "ParentCardinality": "One",
      "ChildCardinality": "ZeroOrMore"
    },
    {
      "ParentEntity": "posts",
      "ChildEntity": "posts",
      "ChildColumns": ["parent_id"],
      "ParentCardinality": "ZeroOrOne"
    }
  ]
}
```

## Fields

| Field | Notes |
|---|---|
| `Entities[].Name` | Physical table name (unique). `schema.table` is allowed. |
| `Entities[].Comment` | Logical (display) name. |
| `Entities[].Group` | Subject area. When the model has more tables than `--per-page` (default 20), each group becomes a page; relationships between pages get shortcuts automatically. Ignored for smaller models (one page named `--page-name`). |
| `Entities[].Indexes` | `Columns` (required), `IsUnique`, `Name` (default `{table}_{cols}_key` for unique, `_idx` otherwise), `Where` (partial index condition). |
| `Entities[].CheckList` | CHECK constraints as SQL expressions. |
| `Entities[].Remarks` | Free-form remarks. |
| `Columns[].Name` | Physical column name. |
| `Columns[].Type` | Built-in type of the target DB ([types.md](types.md)), optionally with length/precision: `varchar(255)`, `numeric(10,2)` become domains `varchar_255`, `numeric_10_2`. A few generic aliases are accepted (`int`, `string`, `bool`, `datetime`, `uuid`, `decimal` …). Unknown names become custom types and the CLI prints a warning. |
| `Columns[].IsPrimaryKey` | PK columns are numbered in the order they appear (composite keys keep that order) and forced NOT NULL. |
| `Columns[].IsNullable` | **Write it on every column.** Omitted = `false` = NOT NULL. |
| `Columns[].IsIdentity` | Auto-numbered (IDENTITY / AUTO_INCREMENT). |
| `Columns[].DefaultValue` | SQL expression: `"0"`, `"'draft'"`, `"now()"`. |
| `Columns[].Comment` / `Description` | Logical name / longer description. |
| `Relationships[].ParentEntity` | Referenced (PK side) table name. |
| `Relationships[].ChildEntity` | Referencing (FK side) table name. May equal `ParentEntity` (self reference). |
| `ChildColumns` | FK columns in the child table. |
| `ParentColumns` | Referenced columns, same count and order. Omitted = the parent's primary key. |
| `ParentCardinality` | `One` (default) or `ZeroOrOne` (nullable FK). |
| `ChildCardinality` | `ZeroOrMore` (default), `Many` (= one or more), `One`, `ZeroOrOne`. |
| `Name` | FK constraint name. Omitted = `{child}_{cols}_fkey`. |
| `NeedForeignKey` | Emit FOREIGN KEY in DDL (default `true`). |

`Assumptions` and `OpenQuestions` arrays may be present; the converter ignores them.

## After converting

Optional touch-ups in the YAML ([ermlx-authoring.md](ermlx-authoring.md)): rename generated
domains to meaningful names (and the columns' `TypeName`), colours, text boxes.
