# ermlx ファイル仕様

ErCreator のプロジェクトファイル **`.ermlx`** のデータ構造を説明します。
`.ermlx` は **YAML** のテキストファイルです。人が読み書きでき、Git で差分・マージしやすく、
**AI にスキーマを生成させてそのまま ErCreator で開く**用途にも使えます。

- 対象バージョン: ErCreator v2.2 系（ログテーブル定義・共通列テンプレートを含む）
- 文字コード: UTF-8
- 拡張子: `.ermlx`
- English: [ermlx-spec.en.md](ermlx-spec.en.md)

> 本書はファイルを**書く側**（人・スクリプト・AI）向けの仕様です。ErCreator は書かれていない項目を既定値で補って読み込みます（[省略時の扱い](#省略時の扱い)）。
>
> 読み込みは寛容で、未知のキーは無視され、参照切れは黙って失われます。書いたファイルは CLI の `ercreator validate --in <file.ermlx>` で検証できます（未知のキー・必須キーの欠落・ID 重複・参照切れ・未知の型・色の書式と、アプリと同じモデル検証。`--format json` で機械可読な出力）。

---

## 1. 全体像

ファイルは **Structure（論理構造）** と **Design（見た目・配置）** の2つに分かれます。
同じページ・エンティティ・リレーションが両方に現れ、**ページ名**と **ID（GUID）** で対応付けられます。

```yaml
Structure:            # 論理構造: DB 種別・ドメイン・エンティティ・カラム・リレーション…
  DbType: PostgreSQL
  Domains: [...]
  Sequences: [...]
  CustomBuiltInTypes: [...]
  LogTemplate: {...}  # ログテーブルの共通テンプレート（任意）
  CommonColumnTemplates: [...]  # 共通列テンプレート（任意）
  Pages:
    - PageName: main
      Entities: [...]
      Relationships: [...]
      PartialEntities: [...]
Design:               # 見た目: 表示モード・ページサイズ・各図形の座標と色
  ColumnType: All
  ItemType: ColumnName, Type, PkText
  EntityInfoType: NameAndComment
  Pages:
    - PageName: main  # Structure.Pages と同じ名前で対応
      EntityLayouts: [...]
      RelationshipLayouts: [...]
      PartialEntityLayouts: [...]
      TextBoxes: [...]
```

### 書式の約束

| 項目 | 内容 |
|---|---|
| キー名 | プロパティ名そのもの（PascalCase）。大文字小文字を区別します |
| 列挙値 | 名前で書きます（例: `PostgreSQL`, `ZeroOrMore`）。フラグ型は `ColumnName, Type` のようにカンマ区切り |
| GUID | `8b3c1d2e-4f5a-4b6c-9d7e-0f1a2b3c4d5e` 形式（ハイフン区切り36文字）。値は任意で、ファイル内で一意であればよい |
| 色 | `#AARRGGBB`（例: `#FFFFC0CB`）。`#00FFFFFF` は透明＝色なし |
| 未知のキー | 無視されます（読み込みエラーにはなりません） |
| 既定値 | 既定値と同じ値は保存時に省略されます。書く側も省略できます |

---

## 2. Structure

| キー | 型 | 説明 |
|---|---|---|
| `DbType` | 列挙 | 対象 DB。`PostgreSQL`（既定）/ `Oracle` / `MySQL` / `SQLServer`。組み込み型の解決に使います |
| `FilePolicies` | オブジェクト | ファイル単位の設定（[2.1](#21-filepolicies)） |
| `Domains` | 配列 | ドメイン（ユーザー定義型）（[2.2](#22-domains)） |
| `Sequences` | 配列 | シーケンス（[2.3](#23-sequences)） |
| `CustomBuiltInTypes` | 配列 | 組み込み型にない型を登録したもの（[2.4](#24-custombuiltintypes)） |
| `LogTemplate` | オブジェクト | ログテーブルの共通テンプレート（任意）（[2.8](#28-logtemplate)） |
| `CommonColumnTemplates` | 配列 | 共通列テンプレート（任意）（[2.10](#210-commoncolumntemplates)） |
| `LastGeneratedData` | オブジェクト | 前回 DDL 生成時のスナップショット。**アプリが内部で使う値なので、書く側は省略してください** |
| `Pages` | 配列 | ページ（[2.5](#25-pages)） |

### 2.1 FilePolicies

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `IsCreateDomain` | bool | false | DDL でドメイン（CREATE DOMAIN 等）を出力するか |
| `DefaultTextboxBackColor` | 色 | なし | 新規テキストボックスの背景色 |
| `DefaultTextboxBorderColor` | 色 | なし | 新規テキストボックスの枠色 |

### 2.2 Domains

カラムの型として使えるユーザー定義型です。カラムの `TypeName` にドメイン名を書くと参照します。

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `TypeName` | 文字列 | — | **ドメイン名（必須・一意）** |
| `ParentTypeName` | 文字列 | — | 親の型。組み込み型名（例: `numeric`）か、別のドメイン名 |
| `Suffix1` | 整数 | なし | 桁数（例: `varchar(50)` の 50、`numeric(10,2)` の 10） |
| `Suffix2` | 整数 | なし | 小数部桁数（`numeric(10,2)` の 2） |
| `DefaultValue` | 文字列 | 空 | 既定値（SQL 式のまま。例: `0`, `'none'`, `now()`） |
| `DefaultName` | 文字列 | 空 | このドメインを使う列の既定物理名（任意） |
| `Remarks` | 文字列 | 空 | 備考 |

```yaml
Domains:
  - TypeName: 金額
    ParentTypeName: numeric
    Suffix1: 10
    Suffix2: 2
    DefaultValue: "0"
```

### 2.3 Sequences

| キー | 型 | 説明 |
|---|---|---|
| `Name` | 文字列 | シーケンス名 |
| `StartWith` / `Increment` / `MinValue` / `MaxValue` | 数値 | 開始値・増分・最小値・最大値（省略可） |
| `IsCycle` | bool | 循環するか（既定 false） |
| `TableName` / `ColumnName` | 文字列 | 所有するテーブル・カラム（任意） |

### 2.4 CustomBuiltInTypes

`DbType` の組み込み型にない型名（拡張型など）を登録します。通常は不要です。

| キー | 型 | 説明 |
|---|---|---|
| `TypeName` | 文字列 | 型名 |
| `IsBuiltInType` | bool | `true` を指定 |
| `DbType` | 列挙 | 対象 DB |
| `MermaidTypeName` | 文字列 | Mermaid 出力時の型名（任意） |

### 2.5 Pages

| キー | 型 | 説明 |
|---|---|---|
| `PageName` | 文字列 | **ページ名（一意）**。Design 側の同名ページと対応します |
| `Entities` | 配列 | エンティティ（テーブル）（[2.6](#26-entities)） |
| `Relationships` | 配列 | リレーション（[2.7](#27-relationships)） |
| `PartialEntities` | 配列 | ショートカット（別ページにある実体の参照）（[2.9](#29-partialentities)） |

### 2.6 Entities

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `EntityName` | 文字列 | — | **物理名（必須）**。スキーマ付きは `sales.customer` |
| `Id` | GUID | — | **エンティティ ID（必須・一意）**。配置・リレーション・ショートカットの参照に使います |
| `Comment` | 文字列 | 空 | 論理名（例: 顧客） |
| `Remarks` | 文字列 | 空 | 備考 |
| `BaseEntityName` | 文字列 | なし | 継承元エンティティの物理名（PostgreSQL の INHERITS） |
| `Tags` | 配列 | なし | タグ（`Key` / `Value`） |
| `Columns` | 配列 | なし | カラム（[2.6.1](#261-columns)） |
| `Indexes` | 配列 | なし | インデックス（[2.6.2](#262-indexes)） |
| `CheckList` | 文字列配列 | なし | CHECK 制約（SQL 式。例: `price >= 0`）。DDL では `{テーブル名}_{式のハッシュ}_check` という名前付き制約になります |
| `Log` | オブジェクト | なし | ログテーブル設定（[2.6.3](#263-log)） |
| `CommonTemplateId` | GUID | なし | 使う共通列テンプレートの `Id`（[2.10](#210-commoncolumntemplates)）。1テーブルに1つまで |

#### 2.6.1 Columns

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `Id` | GUID | 自動 | カラム ID。DDL 差分でリネームを判定するのに使います。新規作成時は省略可 |
| `ColumnName` | 文字列 | — | **物理名（必須）** |
| `Comment` | 文字列 | 空 | 論理名 |
| `Desctiption` | 文字列 | 空 | 説明（**綴りは `Desctiption`**。互換のためこの綴りです） |
| `TypeName` | 文字列 | — | **型**。組み込み型名（例: `integer`, `character varying`, `text`, `timestamp without time zone`）、ドメイン名、`CustomBuiltInTypes` の型名のいずれか |
| `AllowNull` | bool | **true** | NULL を許可するか。NOT NULL は `false` を明記 |
| `PrimaryKeyNumber` | 整数 | なし | 主キーの順番（1, 2, …）。主キーでない列は省略 |
| `IsIdentity` | bool | false | IDENTITY（自動採番）か |
| `DefaultValue` | 文字列 | 空 | 既定値（SQL 式） |
| `BackgroundColor` | 色 | 空 | 行の背景色 |
| `Tags` | 配列 | なし | タグ（`Key` / `Value`） |
| `ExcludeFromLog` | bool | false | ログテーブルに含めない（本体専用） |
| `LogColumnName` | 文字列 | なし | ログテーブル側の物理名（省略時は `ColumnName`） |
| `LogComment` | 文字列 | なし | ログテーブル側の論理名（省略時は `Comment`） |
| `CommonColumnId` | GUID | なし | 共通列テンプレートから実体化した列なら、テンプレート列の `Id`（[2.10](#210-commoncolumntemplates)） |

> 桁数付きの型（`varchar(50)` など）は、桁数を持つドメインを定義してそれを参照します。

#### 2.6.2 Indexes

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `IndexName` | 文字列 | — | インデックス名（スキーマ内で一意） |
| `ColumnNames` | 文字列配列 | — | 対象カラムの物理名（順番どおり） |
| `IsUnique` | bool | false | UNIQUE か |
| `WhereSql` | 文字列 | 空 | 部分インデックスの条件（例: `deleted_at IS NULL`） |

#### 2.6.3 Log

本体とほぼ同じ列を持つ**ログテーブル**を、別エンティティを作らずに定義します。
ログテーブルはファイルに保存されず、DDL・差分・コード生成のたびに次の規則で組み立てられます。

- 先頭にログ専用列（テンプレートまたはこのテーブル専用の列）
- 続いて本体の列（`ExcludeFromLog: true` の列は除く。`LogColumnName` / `LogComment` で改名）
- 本体からコピーした列は **PK・IDENTITY・既定値を外し**、NOT NULL と型は維持
- 本体のインデックス・FK・CHECK 制約はコピーしない

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `IsEnabled` | bool | **true** | ログテーブルを作るか。`false` でも設定は保持されます |
| `PhysicalName` | 文字列 | — | ログテーブルの物理名（例: `customer_log`） |
| `LogicalName` | 文字列 | 空 | ログテーブルの論理名 |
| `UseTemplate` | bool | **true** | `Structure.LogTemplate` のログ専用列・インデックスを使うか |
| `Columns` | 配列 | なし | このテーブル専用のログ専用列（`UseTemplate: false` のとき使用。形式は [Columns](#261-columns) と同じ） |
| `Indexes` | 配列 | なし | ログテーブルのインデックス（形式は [Indexes](#262-indexes) と同じ。列名はログ側の名前） |

```yaml
- EntityName: customer
  Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
  Comment: 顧客
  Columns:
    - ColumnName: id
      TypeName: integer
      AllowNull: false
      PrimaryKeyNumber: 1
      IsIdentity: true
      LogColumnName: customer_id   # ログ側ではログ ID と衝突しないよう改名
    - ColumnName: name
      Comment: 氏名
      TypeName: text
      AllowNull: false
    - ColumnName: version
      TypeName: integer
      ExcludeFromLog: true         # ログには含めない
  Log:
    PhysicalName: customer_log
    LogicalName: 顧客履歴
    Indexes:
      - IndexName: customer_log_cid_idx
        ColumnNames: [customer_id, logged_at]
```

### 2.7 Relationships

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `Name` | 文字列 | — | リレーション名（FK 制約名。スキーマ内で一意） |
| `ParentEntityId` / `ChildEntityId` | GUID | — | 親（参照される側）・子（FK を持つ側）のエンティティ ID |
| `ParentEntityName` / `ChildEntityName` | 文字列 | — | 親・子の物理名（ID で見つからないときの予備） |
| `ParentColumnNames` / `ChildColumnNames` | 文字列配列 | — | 対応するカラム名（同じ順番・同じ数） |
| `ParentCardinality` | 列挙 | `One` | 親側の多重度 |
| `ChildCardinality` | 列挙 | `ZeroOrMore` | 子側の多重度 |
| `NeedForeignKey` | bool | false | DDL で FOREIGN KEY 制約を出力するか |
| `IsParentChildrenRelation` | bool | false | 依存リレーション（A5:SQL Mk-2 の Dependence）か。主に A5 との相互変換用 |
| `IsInheritRelationship` | bool | false | 継承関係か（FK ではない） |

多重度（`Cardinality`）: `None` / `Zero` / `One` / `More` / `ZeroOrOne` / `ZeroOrMore` / `OneOrMore`

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

ログテーブルの共通テンプレートです。`Log.UseTemplate: true` のエンティティが参照します。

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `PhysicalNamePattern` | 文字列 | `{name}_log` | 新しいログの物理名の命名規則 |
| `LogicalNamePattern` | 文字列 | `{comment}履歴` | 新しいログの論理名の命名規則 |
| `Columns` | 配列 | なし | ログ専用列（ログ側の主キーを含める）。形式は [Columns](#261-columns) と同じ |
| `Indexes` | 配列 | なし | インデックス（下表） |

テンプレートのインデックス:

| キー | 型 | 説明 |
|---|---|---|
| `NamePattern` | 文字列 | インデックス名の命名規則（例: `{log}_logged_at_idx`） |
| `ColumnNames` | 文字列配列 | 対象カラム（ログ側の名前） |
| `IsUnique` | bool | UNIQUE か |
| `WhereSql` | 文字列 | 部分インデックスの条件 |

置換できる記号: `{name}` 本体の物理名 / `{comment}` 本体の論理名（空なら物理名）/ `{log}` ログの物理名（スキーマなし）

```yaml
LogTemplate:
  Columns:
    - ColumnName: log_id
      Comment: ログID
      TypeName: bigint
      AllowNull: false
      PrimaryKeyNumber: 1
      IsIdentity: true
    - ColumnName: logged_at
      Comment: 記録日時
      TypeName: timestamp without time zone
      AllowNull: false
      DefaultValue: now()
  Indexes:
    - NamePattern: "{log}_logged_at_idx"
      ColumnNames: [logged_at]
```

### 2.9 PartialEntities

別ページにある実体エンティティを、このページに表示するための参照（ショートカット）です。

| キー | 型 | 説明 |
|---|---|---|
| `Id` | GUID | ショートカット自身の ID（一意） |
| `SourceEntityId` | GUID | 参照先（実体）エンティティの ID |
| `NickName` | 文字列 | 表示名（任意） |

UI では「ショートカット」と表示されます。名前・カラム・インデックスなどは実体のものが使われ、DDL・検証・コード生成でも実体として扱われます（ショートカット自体はテーブルになりません）。

**リレーションとショートカットの規則**

- リレーションの両端は、そのリレーションと同じページにあるエンティティかショートカットにします。**別ページのテーブルとつなぐときは、そのテーブルのショートカットをリレーションのページに置き**、`ParentEntityId`（または `ChildEntityId`）にショートカットの `Id` を書きます。`ParentEntityName` には実体の物理名を書きます。
- 同じページの中でも、多くのテーブルから参照されるテーブル（ユーザー・各種マスタなど）は、ショートカットを複数置いてリレーションを分けると、線の集中や交差を避けられます。
- ショートカットの配置は `Design.Pages[].PartialEntityLayouts`（`Id` で対応）に書きます。

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
        - Id: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a          # customer のショートカット
          SourceEntityId: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
      Relationships:
        - Name: orders_customer_id_fkey
          NeedForeignKey: true
          ParentEntityId: 7c4e2b19-8a3f-4d5e-9b6a-1f2e3d4c5b6a   # ショートカットの Id
          ParentEntityName: customer                             # 実体の物理名
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

多くのテーブルに共通する列（サロゲートキー `id`、監査列 `created_at` / `created_by` など）のテンプレートです。
テーブルは `CommonTemplateId` で1つのテンプレートを選びます。

- テンプレートの列はテーブルの `Columns` に**実際の列として**入ります（`CommonColumnId` でテンプレート列と紐付け）。他テーブルからの FK の参照先にも、インデックスの対象にもできます
- 定義（`ColumnName`・`Comment`・`Desctiption`・`TypeName`・`AllowNull`・`PrimaryKeyNumber`・`IsIdentity`・`DefaultValue`）は**テンプレートが正**です。読み込み時にテンプレートの内容で上書きされます
- テーブル固有の値（`BackgroundColor`・`Tags`・`ExcludeFromLog`・`LogColumnName`・`LogComment`）は上書きされません
- 列の並びは「先頭の共通列 → テーブル固有の列 → 末尾の共通列」に整えられます
- 手で書く場合、テーブルの `Columns` に共通列を書く必要はありません。`CommonTemplateId` を指定すれば読み込み時に追加されます（同名の列があればそれを紐付けます）

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `Id` | GUID | — | **テンプレート ID（必須・一意）** |
| `Name` | 文字列 | — | テンプレート名（一意） |
| `Columns` | 配列 | なし | 共通列。形式は [Columns](#261-columns) に `Position` を加えたもの |
| `Relationships` | 配列 | なし | 共通列からの外部キー（下表）。キャンバスには描かれません |

`Columns[].Position`: `Head`（先頭・既定）/ `Tail`（末尾）

共通列のリレーション（`Relationships`）:

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `NamePattern` | 文字列 | — | FK 制約名の命名規則。`{name}` テーブルの物理名 / `{comment}` テーブルの論理名（例: `{name}_created_by_fk`） |
| `ColumnNames` | 文字列配列 | — | 子側＝共通列の物理名 |
| `ParentEntityId` | GUID | なし | 参照先テーブルの `Id` |
| `ParentEntityName` | 文字列 | 空 | 参照先テーブルの物理名（ID で見つからないときの予備） |
| `ParentColumnNames` | 文字列配列 | — | 参照先のカラム名 |
| `NeedForeignKey` | bool | **true** | DDL で FOREIGN KEY 制約を出力するか |

```yaml
CommonColumnTemplates:
  - Id: 7a1d3c55-0b2e-4f61-9c8a-2d4e6f8a0b1c
    Name: 標準
    Columns:
      - ColumnName: id
        Comment: ID
        TypeName: bigint
        AllowNull: false
        PrimaryKeyNumber: 1
        IsIdentity: true
        Position: Head
      - ColumnName: created_at
        Comment: 作成日時
        TypeName: timestamp without time zone
        AllowNull: false
        DefaultValue: now()
        Position: Tail
      - ColumnName: created_by
        Comment: 作成者
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

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `ColumnType` | 列挙 | `None` | エンティティに表示する列。**通常は `All`** |
| `ItemType` | フラグ列挙 | `None` | 列の表示項目。**通常は `ColumnName, Type, PkText`** |
| `EntityInfoType` | 列挙 | `NameOnly` | エンティティ名の表示。`NameOnly` / `NameAndComment` / `CommentOnly` |
| `Margin` | 数値 | 30 | 図形間の余白 |
| `ShowTailCommonColumns` | bool | **true** | 末尾の共通列をキャンバスに表示するか（表示する場合は薄く表示） |
| `Pages` | 配列 | なし | ページごとの配置（[3.1](#31-pages)） |

- `ColumnType`: `None` / `All` / `PkOnly` / `PkAndFkOnly` / `HugeEntityName` / `PkAndUkOnly` / `PkAndUkAndFkOnly`
- `ItemType`（組み合わせ可）: `ColumnName` / `Comment` / `Type` / `Type2` / `PkText` / `Description` / `UkText`

> `ColumnType` と `ItemType` を省略すると列が表示されません。新規に書くときは明記してください。

### 3.1 Pages

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `PageName` | 文字列 | — | Structure 側のページ名と同じ値 |
| `PageWidth` / `PageHeight` | 数値 | 1191 / 670 | ページサイズ（印刷・画像出力の目安） |
| `BackgroundColor` | 色 | `#FFFFFFFF` | ページの背景色 |
| `EntityLayouts` | 配列 | なし | エンティティの配置（下表） |
| `RelationshipLayouts` | 配列 | なし | リレーション線の形（[3.2](#32-relationshiplayouts)） |
| `PartialEntityLayouts` | 配列 | なし | ショートカットの配置（`EntityLayouts` と同じ項目。キーは `EntityId` ではなく `Id`、既定サイズは 80×20） |
| `TextBoxes` | 配列 | なし | テキストボックス（[3.3](#33-textboxes)） |

エンティティの配置（`EntityLayouts`）:

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `EntityId` | GUID | — | `Structure` 側のエンティティ `Id` |
| `Left` / `Top` | 数値 | 0 | 左上座標（px） |
| `Width` / `Height` | 数値 | 90 / 50 | 大きさ（px）。表示時に内容へ自動で合わせます |
| `BackgroundColor` | 色 | `#00FFFFFF` | ヘッダーの背景色 |
| `IsIgnoreMermaid` | bool | false | Mermaid 出力の対象外にするか |

> 配置のないエンティティはすべて (0, 0) に重なります。座標を決められない場合は、エンティティを横に 240px、縦に 200px 程度ずつずらして並べてください。

### 3.2 RelationshipLayouts

リレーション線の形です。**省略すると自動で引かれる**ので、通常は書かなくて構いません。

| キー | 型 | 既定 | 説明 |
|---|---|---|---|
| `ParentEntityId` / `ChildEntityId` | GUID | — | 対応するリレーションの親子 ID |
| `Name` | 文字列 | — | リレーション名（ID で対応が取れないときの予備） |
| `ParentAttachedPosition` / `ChildAttachedPosition` | 列挙 | `None` | 線の付く辺。`None`（自動）/ `Top` / `Left` / `Right` / `Bottom` |
| `ParentAttachedX` / `ParentAttachedY` / `ChildAttachedX` / `ChildAttachedY` | 数値 | 0 | 辺上の付け根位置 |
| `Control1X` … `Control3Y` | 数値 | 0 | 折れ線の中間点 |
| `RelationColor` | 色 | `#FF000000` | 線の色 |
| `Visibility` | bool | **false** | 線を表示するか。**この項目を書く場合は `true` を明記**（省略すると非表示扱い） |

### 3.3 TextBoxes

| キー | 型 | 説明 |
|---|---|---|
| `InnerText` | 文字列 | 本文 |
| `Left` / `Top` / `Width` / `Height` | 数値 | 位置と大きさ |
| `BackgroundColor` / `BorderColor` | 色 | 背景色・枠色 |
| `BorderWidth` / `FontSize` | 数値 | 枠の太さ・文字サイズ |
| `FontFamily` | 文字列 | フォント名 |

---

## 4. 参照と対応付けの規則

| 参照 | 規則 |
|---|---|
| Structure ↔ Design のページ | `PageName` が同じもの |
| エンティティ ↔ 配置 | `Entities[].Id` = `EntityLayouts[].EntityId` |
| リレーション → エンティティ | `ParentEntityId` / `ChildEntityId` で探し（同じページのショートカットの `Id` も可）、見つからなければ `ParentEntityName` / `ChildEntityName` で探す |
| リレーション → カラム | `ParentColumnNames` / `ChildColumnNames` の物理名 |
| カラム → 型 | `TypeName` を組み込み型（`DbType` 依存）・`CustomBuiltInTypes`・`Domains` の名前と完全一致で照合 |
| 継承 | `BaseEntityName` = 継承元の `EntityName` |
| ショートカット → 実体 | `SourceEntityId` = 実体の `Id` |
| インデックス → カラム | `ColumnNames` の物理名 |
| テーブル → 共通列テンプレート | `CommonTemplateId` = テンプレートの `Id` |
| 共通列 → テンプレート列 | `CommonColumnId` = テンプレート列の `Id` |
| 共通列リレーション → 参照先 | `ParentEntityId` で探し、見つからなければ `ParentEntityName` |

- ID はファイル内で一意であれば値は自由です。新しく作るときは任意の UUID（v4 など）を割り当ててください。
- 同じエンティティを複数ページに置きたいときは、実体を1つのページに置き、他のページには `PartialEntities` で参照を置きます。別ページのテーブルとのリレーションも、このショートカットを経由して書きます（[2.9](#29-partialentities)）。

## 省略時の扱い

- 書かれていないキーは既定値になります（各表の「既定」列）。
- bool の既定値に注意してください。**`AllowNull`・`Log.IsEnabled`・`Log.UseTemplate`・共通列リレーションの `NeedForeignKey`・`Design.ShowTailCommonColumns` の既定は `true`** です。それ以外の bool は `false` です。
- 文字列の空は `""`、配列の空は省略と同じです。

## 5. ビュー・関数・トリガー（外部 SQL ファイル）

ビュー・ストアド関数・トリガーは `.ermlx` には含めず、`.ermlx` と同じフォルダの次のサブフォルダに
1ファイル1定義の SQL として置きます（ErCreator は読み込み時にこれらも取り込み、DDL 生成の依存順に並べます）。

| フォルダ | 内容 |
|---|---|
| `Views/` | `CREATE VIEW ... AS ...;` |
| `Functions/` | `CREATE FUNCTION` / `CREATE PROCEDURE` |
| `Triggers/` | `CREATE TRIGGER ... ON table ...` |

---

## 6. 最小の例

2テーブルと1つのリレーションです。そのまま ErCreator で開けます。

```yaml
Structure:
  DbType: PostgreSQL
  Pages:
    - PageName: main
      Entities:
        - EntityName: customer
          Id: 0f8c1c52-6b1e-4d63-9a51-3f1f2b9e7a10
          Comment: 顧客
          Columns:
            - ColumnName: id
              Comment: 顧客ID
              TypeName: integer
              AllowNull: false
              PrimaryKeyNumber: 1
              IsIdentity: true
            - ColumnName: name
              Comment: 氏名
              TypeName: text
              AllowNull: false
        - EntityName: orders
          Id: 5d2a9e41-2c7b-4f0e-8a3d-6b4c1e9f2a77
          Comment: 注文
          Columns:
            - ColumnName: id
              TypeName: integer
              AllowNull: false
              PrimaryKeyNumber: 1
            - ColumnName: customer_id
              Comment: 顧客ID
              TypeName: integer
              AllowNull: false
            - ColumnName: ordered_at
              Comment: 注文日時
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

## 7. AI に作らせるときのヒント

次のような指示を添えると、そのまま開けるファイルになりやすくなります。

```text
ErCreator の .ermlx（YAML）形式で ER 図を出力してください。仕様は docs/ermlx-spec.md のとおりです。
- Structure と Design に分け、エンティティごとに一意な UUID を Id に付け、Design.EntityLayouts の EntityId と一致させる
- NOT NULL の列は AllowNull: false を明記する（省略すると NULL 許可）
- 主キーは PrimaryKeyNumber: 1, 2… で指定する
- 型は DbType（PostgreSQL）の組み込み型名を使う。桁数付きの型は Domains に定義して参照する
- 外部キーは Relationships に書き、ParentEntityId/ChildEntityId と列名を合わせ、NeedForeignKey: true にする
- Design は ColumnType: All / ItemType: "ColumnName, Type, PkText" / EntityInfoType: NameAndComment とし、
  エンティティは横 280px・縦 220px 間隔で重ならないように Left/Top を付ける
- 別ページのテーブルとのリレーションは、リレーションのページにそのテーブルのショートカット（PartialEntities）を置き、その Id を参照する
- RelationshipLayouts と LastGeneratedData は出力しない
```

ほかに、**Mermaid の erDiagram**（自動で配置されます）や **A5:SQL Mk-2** からも取り込めます。対応形式は [インポート / エクスポート対応](import-export.md) を参照してください。
