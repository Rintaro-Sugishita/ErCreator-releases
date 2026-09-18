# Third-Party Notices / 第三者ライセンス表示

ErCreator（Web 版・デスクトップ版）は、以下の第三者コンポーネントを利用しています。各コンポーネントは、それぞれの著作権者が定めるライセンスに従います。本一覧はベストエフォートで作成しており、網羅性・正確性を保証するものではありません。各ライセンスの正確な条文は、各プロジェクトの配布物を参照してください。

ErCreator (web and desktop editions) includes the third-party components listed below. Each is used under the license set by its respective copyright holders. This list is provided on a best-effort basis and is not guaranteed to be exhaustive or exact; refer to each project's distribution for the authoritative license text.

配布に含まれないもの（テスト専用: xunit / Testcontainers / coverlet / Microsoft.NET.Test.Sdk など、および開発専用の DevServer）は記載していません。FrostNova.* は本ソフトウェアの開発者自身のライブラリです。

---

## MIT License

次のコンポーネントは MIT License の下で提供されています（著作権は各記載者に帰属）。

- **.NET / ASP.NET Core / Blazor**（Microsoft.AspNetCore.Components.*, .NET ランタイム/ライブラリ, Microsoft.Data.SqlClient, Microsoft.VisualBasic, System.Security.Cryptography.ProtectedData, Microsoft.AspNetCore.Components.WebView.Wpf, Microsoft.Xaml.Behaviors.Wpf） — © Microsoft / .NET Foundation and Contributors
- **YamlDotNet** — © Antoine Aubry and contributors
- **ClosedXML** — © ClosedXML contributors
- **DocumentFormat.OpenXml** — © Microsoft
- **ExcelNumberFormat** — © ExcelNumberFormat contributors
- **RBush** — © RBush contributors
- **Humanizer** — © .NET Foundation and Contributors
- **CommunityToolkit.Mvvm (.NET Community Toolkit)** — © .NET Foundation and Contributors
- **jsPDF** — © James Hall, yWorks GmbH, and contributors（実行時に CDN から読み込み）
- **Anthropic (.NET SDK)** — © the Anthropic .NET SDK contributors（デスクトップ版）
- **OpenAI (.NET)** — © OpenAI（デスクトップ版）
- **MySqlConnector** — © Bradley Grainger and contributors（デスクトップ版）
- **LibGit2Sharp** — © LibGit2Sharp contributors（デスクトップ版。ネイティブ libgit2 については下記参照）
- **WindowsAPICodePack**（コミュニティ版) — © Microsoft / fork contributors（デスクトップ版）

MIT License の条文:

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Apache License 2.0

- **SixLabors.Fonts** 1.0.0 — © Six Labors
  Apache License 2.0 の下で提供されています。条文は https://www.apache.org/licenses/LICENSE-2.0 を参照してください。
  （注: Six Labors 製ライブラリは v2.0 以降「Six Labors Split License」へ移行していますが、本ソフトウェアが利用する Fonts 1.0.0 は Apache-2.0 です。）

---

## Microsoft MSAGL

- **AutomaticGraphLayout (Microsoft Automatic Graph Layout, MSAGL)** — © Microsoft Corporation
  MIT License の下で提供されています（条文は上記 MIT License と同一）。

---

## PostgreSQL License

- **Npgsql** — © The Npgsql Development Team
  PostgreSQL License（BSD 類似の寛容なライセンス）の下で提供されています。条文は https://github.com/npgsql/npgsql/blob/main/LICENSE を参照してください。

---

## libgit2 (native, via LibGit2Sharp)

- **libgit2** — © the libgit2 contributors
  GNU GPL v2（リンク例外付き / GPLv2 with a linking exception）の下で提供されており、プロプライエタリなアプリケーションからの利用が許諾されています。条文は https://github.com/libgit2/libgit2/blob/main/COPYING を参照してください。（デスクトップ版）

---

## Oracle Data Provider for .NET（プロプライエタリ）

- **Oracle.ManagedDataAccess.Core** 23.6.0 — © Oracle and/or its affiliates
  オープンソースではなく、オラクル社が別途定めるライセンス条件（Oracle Free Use Terms and Conditions / Oracle Technology Network ライセンス等）に従います。利用・再配布にあたっては、オラクル社の当該条件を確認・遵守してください。（デスクトップ版）
