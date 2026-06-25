# Typslug

A VS Code extension to assist with note-taking in Typst.

Typst でメモを取ることを支援する VS Code 拡張機能．

https://zenn.dev/monaqa/articles/2024-12-25-typst-as-a-memo-tool を参考にしています．


## Directory Structure

Typslug では次のようなディレクトリ構造で `(typslug_root)` 以下にメモを配置していきます．

```
(workspace_root)/
└── (typslug_root)/
    ├── .typslug/
    │   └── template.typ
    ├── math/
    │   └── number_theory/
    │       └── main.typ
    ├── rust/
    │   ├── trpl/
    │   │   └── main.typ
    │   └── macro_rules/
    │       └── main.typ
    └── typst/
        └── packages/
            ├── suiji/
            │   └── main.typ
            └── touying/
                └── main.typ
```

メモごとに葉ディレクトリを1つ用意します．`(typslug_root)` から `main.typ` の親ディレクトリへの相対パスを **slug** と呼んで，これを各メモの識別子とします．例えば上の例では，次の5つの slug があります．

- `math/number_theory`
- `rust/trpl`
- `rust/macro_rules`
- `typst/packages/suiji`
- `typst/packages/touying`


## Features

### コマンド `Typslug: Jump to Note`

入力した slug に対応するメモを開きます．存在しない場合テンプレートに基づき生成します．

テンプレートには次のプレースホルダーを用いることができます．これらは生成時に文字列置換によって挿入されます．

- `{{slug}}`
    - slug
- `{{creationDatetime}}`
    - 生成日時（`YYYY-MM-DDThh:mm:ssZ`）
- `{{creationDate}}`
    - 生成日（`YYYY-MM-DD`）

### slug サポート

特定関数の第1引数を slug とみなし，次の機能を提供します．

- 既存 slug の Auto Completion
- slug のリンク化
- Goto Definition で slug に対応するメモへのジャンプ


## Extension Settings

以下の項目を設定可能です．

- `typslug.entryFileName`
    - メモの主たるファイル名
- `typslug.triggeringFunctionName`
    - slug を引数に取る関数名．この引数の slug に対してリンク化，補完，ジャンプを提供します．
- `typslug.slugRootPath`
    - `(workspace_root)` から `(typslug_root)` への相対パス
    - 空文字列は `.` とみなされます
- `typslug.templateFilePath`
    - `(workspace_root)` からテンプレートファイルへの相対パス


## Dependencies

[Tinymist Typst](https://marketplace.visualstudio.com/items?itemName=myriad-dreamin.tinymist) が有効であることを前提としています．


## Release Notes

See [CHANGELOG](./CHANGELOG.md).

### 0.1.0

Initial release of Typslug.

