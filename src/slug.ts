import * as vscode from "vscode";

export const getSlugs = async (slugPrefix: string) => {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
  if (!workspaceRoot) {
    return [];
  }

  const slugRootRaw = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("slugRootPath", "");
  const slugRoot = vscode.Uri.joinPath(workspaceRoot, slugRootRaw);

  const entryFileName = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("entryFileName", "main.typ");

  // "...aaa" => "...aaa*/**/", "...aaa/" => "...aaa/**/"
  const prefixPart = `${slugPrefix}${slugPrefix.endsWith("/") ? "" : "*/"}`;
  const pattern = new vscode.RelativePattern(
    slugRoot,
    `${prefixPart}**/${entryFileName}`,
  );

  const uris = await vscode.workspace.findFiles(pattern);
  // +1: `/` after slugRootPath
  const sliceLeft = slugRoot.fsPath.length + 1;
  return uris.map((uri) =>
    uri.fsPath.slice(sliceLeft).replace(/[/\\][^/\\]+$/, ""),
  );
};
