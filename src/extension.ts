// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { regex } from "arkregex";
import * as vscode from "vscode";
import { getSlugs, SLUG_LETTER, slugToUri, slugToUriUnchecked } from "./slug";
import { generateTemplate } from "./templateGenerator";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("typslug.jumpToNote", async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(
          "Error: Open the folder before executing this command.",
        );
        return;
      }

      const disposables: vscode.Disposable[] = [];
      const existingSlugs = await getSlugs(workspaceRoot, "");
      const isExisting = (slug: string) =>
        existingSlugs.some(({ slug: s }) => s === slug);
      const existingItems: vscode.QuickPickItem[] = existingSlugs.map(
        ({ uri, slug }) => ({
          label: slug,
          description: vscode.workspace.asRelativePath(uri),
          // 入力を連続部分列として含むもの以外隠されてしまうので，fuzzy match するものも強制表示する
          alwaysShow: true,
        }),
      );

      const qp = vscode.window.createQuickPick();
      qp.prompt = "Input the slug to jump";
      qp.placeholder = "Select Slug or Enter New Slug...";
      qp.items = existingItems;

      const fuzzyMatch = (pattern: string, str: string) => {
        // pattern が str の（連続とは限らない）部分列であるか
        let pi = 0;
        for (let si = 0; si < str.length && pi < pattern.length; si++) {
          if (pattern[pi].toLowerCase() === str[si].toLowerCase()) {
            pi++;
          }
        }
        return pi === pattern.length;
      };

      qp.onDidChangeValue((value) => {
        const newSlug = value.trim();
        const filtered = newSlug
          ? existingItems.filter((item) => fuzzyMatch(newSlug, item.label))
          : existingItems;

        if (!newSlug || isExisting(newSlug)) {
          qp.items = filtered;
        } else {
          qp.items = [
            ...filtered,
            {
              label: newSlug,
              description: `Generate "${newSlug}"`,
              alwaysShow: true,
            },
          ];
        }
      }, disposables);

      qp.onDidAccept(async () => {
        const selected = qp.selectedItems[0];
        if (!selected) {
          qp.hide();
          return;
        }
        const slug = selected.label;
        if ((await slugToUri(workspaceRoot, slug)) === undefined) {
          await generateTemplate(workspaceRoot, slug);
        }
        vscode.window.showTextDocument(
          await slugToUriUnchecked(workspaceRoot, slug),
        );
        qp.hide();
      }, disposables);

      qp.onDidHide(() => {
        qp.dispose();
        disposables.forEach((d) => d.dispose());
      }, disposables);

      qp.show();
    }),

    vscode.languages.registerCompletionItemProvider(
      {
        language: "typst",
        scheme: "file",
      },
      {
        provideCompletionItems(document, position, token, context) {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
          if (!workspaceRoot) {
            return;
          }

          const fnName = vscode.workspace
            .getConfiguration("typslug")
            .get<string>("triggeringFunctionName");
          if (!fnName) {
            return;
          }

          const reBefore = regex(`${fnName}\\(\\s*"(${SLUG_LETTER}*)$`);
          const reAfter = regex(`^(${SLUG_LETTER}*\\s*)"`);

          const lineText = document.lineAt(position.line).text;
          const beforeCursor = lineText.slice(0, position.character);
          const afterCursor = lineText.slice(position.character);

          const matchBefore = reBefore.exec(beforeCursor);
          const matchAfter = reAfter.exec(afterCursor);
          if (matchBefore === null) {
            return;
          }

          const slugBefore = matchBefore[1];
          const slugAfterLength =
            matchAfter === null ? 0 : matchAfter[1].length;
          const replaceRange = new vscode.Range(
            position.with({
              character: position.character - slugBefore.length,
            }),
            position.with({
              character: position.character + slugAfterLength,
            }),
          );

          return getSlugs(workspaceRoot, "").then((f) =>
            f.map(({ uri, slug }) => {
              const item = new vscode.CompletionItem(
                {
                  label: slug,
                  description: "Typslug",
                },
                vscode.CompletionItemKind.File,
              );
              item.documentation = vscode.workspace.asRelativePath(uri);
              item.insertText = `${slug}${matchAfter === null ? '"' : ""}`;
              item.range = replaceRange;
              return item;
            }),
          );
        },
      },
      '"',
    ),

    vscode.languages.registerDefinitionProvider(
      {
        language: "typst",
        scheme: "file",
      },
      {
        async provideDefinition(document, position, token) {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
          if (!workspaceRoot) {
            return;
          }

          const fnName = vscode.workspace
            .getConfiguration("typslug")
            .get<string>("triggeringFunctionName");
          if (!fnName) {
            return;
          }
          const reBefore = regex(`${fnName}\\(\\s*"(${SLUG_LETTER}*)$`);
          const reAfter = regex(`^(${SLUG_LETTER}*)"\\s*`);

          const lineText = document.lineAt(position.line).text;
          const beforeCursor = lineText.slice(0, position.character);
          const afterCursor = lineText.slice(position.character);

          const matchBefore = reBefore.exec(beforeCursor);
          const matchAfter = reAfter.exec(afterCursor);
          if (matchBefore === null || matchAfter === null) {
            return;
          }

          const slug = `${matchBefore[1]}${matchAfter[1]}`;
          const uri = await slugToUri(workspaceRoot, slug);
          if (!uri) {
            return;
          }
          return new vscode.Location(uri, new vscode.Position(0, 0));
        },
      },
    ),

    vscode.languages.registerDocumentLinkProvider(
      {
        language: "typst",
        scheme: "file",
      },
      {
        async provideDocumentLinks(document, token) {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
          if (!workspaceRoot) {
            return;
          }
          const fnName = vscode.workspace
            .getConfiguration("typslug")
            .get<string>("triggeringFunctionName");
          if (!fnName) {
            return;
          }
          const re = regex(`${fnName}\\(\\s*"(${SLUG_LETTER}+)"\\s*\\)`, "g");
          const links = [];

          const text = document.getText();
          while (true) {
            const match = re.exec(text);
            if (match === null) {
              break;
            }
            const slug = match[1];
            const slugStart = match.index + match[0].indexOf(slug);
            const begin = document.positionAt(slugStart);
            const end = document.positionAt(slugStart + match[1].length);
            const uri = await slugToUri(workspaceRoot, slug);
            if (!uri) {
              continue;
            }
            const link = new vscode.DocumentLink(
              new vscode.Range(begin, end),
              uri,
            );
            links.push(link);
          }
          return links;
        },
      },
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
