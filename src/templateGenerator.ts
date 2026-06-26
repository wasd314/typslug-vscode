import { formatISO } from "date-fns";
import * as vscode from "vscode";

const resolvePlaceholder = (text: string, slug: string) => {
  const variables: Record<string, string> = {
    slug,
    creationDatetime: formatISO(new Date()),
    creationDate: formatISO(new Date(), { representation: "date" }),
  };

  // 未知変数はそのまま残す
  return text.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? `{{${key}}}`,
  );
};

const fallbackTemplate = `\
// slug: {{slug}}
// created at: {{creationDatetime}}
`;

const loadTemplate = async (workspaceRoot: vscode.Uri) => {
  const templateRelativePath = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("templateFilePath", ".typslug/template.typ");
  const templateUri = vscode.Uri.joinPath(workspaceRoot, templateRelativePath);
  try {
    const bytes = await vscode.workspace.fs.readFile(templateUri);
    return await vscode.workspace.decode(bytes, { uri: templateUri });
  } catch {
    return fallbackTemplate;
  }
};

export const generateTemplate = async (
  workspaceRoot: vscode.Uri,
  slug: string,
) => {
  const slugRootRaw = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("slugRootPath", "");
  const slugRoot = vscode.Uri.joinPath(workspaceRoot, slugRootRaw);
  const entryFileName = vscode.workspace
    .getConfiguration("typslug")
    .get<string>("entryFileName", "main.typ");
  const targetUri = vscode.Uri.joinPath(slugRoot, slug, entryFileName);
  const content = resolvePlaceholder(await loadTemplate(workspaceRoot), slug);
  const blob = await vscode.workspace.encode(content, { uri: targetUri });
  await vscode.workspace.fs.writeFile(targetUri, blob);
};
