import * as vscode from "vscode";

export const getSlugs = async (
  workspaceRoot: vscode.Uri,
  slugPrefix: string,
) => {
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

export const slugToUri = async (workspaceRoot: vscode.Uri, slug: string) => {
  return slugToUriUnchecked(workspaceRoot, slug).then(async (uri) => {
    try {
      await vscode.workspace.fs.stat(uri);
      return uri;
    } catch {
      return;
    }
  });
};

export const SLUG_LETTER = `[^"*\\[\\]{}()!,]`;
