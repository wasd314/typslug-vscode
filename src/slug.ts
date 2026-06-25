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

  // "...aaa|" => "...aaa*/**/", "...aaa/|" => "...aaa/**/"
  const prefixPart = `${slugPrefix}${slugPrefix.endsWith("/") ? "" : "*/"}`;
  const pattern = new vscode.RelativePattern(
    slugRoot,
    `${prefixPart}**/${entryFileName}`,
  );

  const uris = await vscode.workspace.findFiles(pattern);
  // +1: `/` after slugRootPath
  const sliceLeft = slugRoot.fsPath.length + 1;
  return uris.map((uri) => {
    return {
      uri,
      slug: uri.fsPath.slice(sliceLeft).replace(/[/\\][^/\\]+$/, ""),
    };
  });
};

export const slugToUri = async (workspaceRoot: vscode.Uri, slug: string) => {
  const slugRootRaw = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("slugRootPath", "");
  const entryFileName = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("entryFileName", "main.typ");
  const uri = vscode.Uri.joinPath(
    workspaceRoot,
    slugRootRaw,
    slug,
    entryFileName,
  );

  try {
    await vscode.workspace.fs.stat(uri);
    return uri;
  } catch {
    return;
  }
};

export const slugToUriUnchecked = async (
  workspaceRoot: vscode.Uri,
  slug: string,
) => {
  const slugRootRaw = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("slugRootPath", "");
  const entryFileName = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("entryFileName", "main.typ");
  const uri = vscode.Uri.joinPath(
    workspaceRoot,
    slugRootRaw,
    slug,
    entryFileName,
  );
  return uri;
};
