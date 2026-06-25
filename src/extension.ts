// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { regex } from "arkregex";
import { formatISO } from "date-fns";
import * as vscode from "vscode";
import { getSlugs, slugToUri } from "./slug";
import { generateContent } from "./templateGenerator";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "typslug.helloWorld",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage("Hello, World from Typslug!");
      vscode.window.showWarningMessage("Hello, World from Typslug!");
      // console.log(await getSlugs(""));
      const wr = vscode.workspace.workspaceFolders?.[0].uri;
      if (wr) {
        const content = await generateContent(wr, "hello/world");
        console.log(`[${content}]`);
      }

      // vscode.window.showErrorMessage("Hello, World from Typslug!");
    },
  );
  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      {
        language: "typst",
        scheme: "file",
      },
      {
        provideCompletionItems(document, position, token, context) {
          const fnName = vscode.workspace
            .getConfiguration("typslug")
            .get<string>("triggeringFunctionName");
          if (!fnName) {
            return;
          }

          // reject glob
          const reBefore = regex(`${fnName}\\(\\s*"([^"*\\[\\]{}()!,]*)$`);
          const reAfter = regex(`^([^"*\\[\\]{}()!,]*)"`);

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

          return getSlugs("").then((f) =>
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
            vscode.window.showErrorMessage(
              "Error: Open the folder before executing this command.",
            );
            return;
          }

          const fnName = vscode.workspace
            .getConfiguration("typslug")
            .get<string>("triggeringFunctionName");
          if (!fnName) {
            return;
          }
          const reBefore = regex(`${fnName}\\(\\s*"([^"*\\[\\]{}()!,]*)$`);
          const reAfter = regex(`^([^"*\\[\\]{}()!,]*)"`);

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
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
