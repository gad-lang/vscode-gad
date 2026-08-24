import * as vscode from "vscode";
import { execFile } from "child_process";
import * as path from "path";

// The Gad debug adapter is the `gad` CLI itself, run as `gad debug --dap`,
// speaking the Debug Adapter Protocol over stdio. This extension wires it into
// VS Code's debugging UI for files of the `gad` language.

// Run `gad fmt -` with `input` on stdin and return {stdout, stderr, code}.
function runGadFmt(
  gadPath: string,
  args: string[],
  input: string,
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = execFile(gadPath, args, { cwd }, (err, stdout, stderr) => {
      resolve({ stdout, stderr, code: (err as NodeJS.ErrnoException & { code?: number })?.code ?? 0 });
    });
    child.stdin?.write(input);
    child.stdin?.end();
  });
}

// Starter content written for a new workspace `.gad.yaml` (see `gad fmt --help`).
const GAD_CONFIG_TEMPLATE = `# Gad workspace configuration (.gad.yaml)
# Consumed by the \`gad\` CLI (fmt / run / template mode) and this extension.

# Template delimiters for \`.gadt\` files and template mode.
template:
    start_delimiter: "{%"
    end_delimiter: "%}"

# Directories formatted by \`gad fmt\` when no PATH is given.
# input_dirs:
#   - path: .
#     includes: ["*.gad", "*.gadt"]
#     excludes: []
#     transpile: false
#     backup: false
`;

// A single terminal reused by the `gad.run` command.
let runTerminal: vscode.Terminal | undefined;

// Language ids this extension runs/debugs: plain Gad (.gad/.gadt) and Gadx
// templates (.gadx), both compiled and debugged by the same `gad` CLI.
const GAD_LANGUAGES = ["gad", "gadt", "gadx"];

function isGadLanguage(languageId: string): boolean {
  return GAD_LANGUAGES.includes(languageId);
}

// The Gad/Gadx document to act on: the active editor if it is a Gad or Gadx
// file, otherwise the most recent visible Gad/Gadx editor.
function activeGadDocument(): vscode.TextDocument | undefined {
  const active = vscode.window.activeTextEditor;
  if (active && isGadLanguage(active.document.languageId)) return active.document;
  return vscode.window.visibleTextEditors.find(
    (e) => isGadLanguage(e.document.languageId),
  )?.document;
}

export function activate(context: vscode.ExtensionContext): void {
  // `gad.run`: run the current file with `gad <file>` in an integrated
  // terminal (reused across runs), saving it first.
  context.subscriptions.push(
    vscode.commands.registerCommand("gad.run", async () => {
      const doc = activeGadDocument();
      if (!doc) {
        void vscode.window.showInformationMessage("No Gad file to run.");
        return;
      }
      await doc.save();
      const gadPath = vscode.workspace
        .getConfiguration("gad")
        .get<string>("path", "gad");
      const cwd =
        vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ??
        path.dirname(doc.uri.fsPath);

      if (!runTerminal || runTerminal.exitStatus !== undefined) {
        runTerminal = vscode.window.createTerminal({ name: "Gad", cwd });
      }
      runTerminal.show(true);
      const quote = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
      runTerminal.sendText(`${quote(gadPath)} ${quote(doc.uri.fsPath)}`);
    }),
  );

  // `gad.debug`: start a debug session for the current file (no launch.json
  // needed; the config provider below fills in the defaults).
  context.subscriptions.push(
    vscode.commands.registerCommand("gad.debug", async () => {
      const doc = activeGadDocument();
      if (!doc) {
        void vscode.window.showInformationMessage("No Gad file to debug.");
        return;
      }
      await doc.save();
      const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
      await vscode.debug.startDebugging(folder, {
        type: "gad",
        request: "launch",
        name: "Debug Gad file",
        program: doc.uri.fsPath,
        stopOnEntry: false,
      });
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((t) => {
      if (t === runTerminal) runTerminal = undefined;
    }),
  );

  // `gad.openConfig`: open the workspace `.gad.yaml`, creating a starter one
  // (fmt/template/transpile options) when it does not exist yet.
  context.subscriptions.push(
    vscode.commands.registerCommand("gad.openConfig", async () => {
      const doc = activeGadDocument();
      const folder =
        (doc && vscode.workspace.getWorkspaceFolder(doc.uri)) ??
        vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showInformationMessage(
          "Open a folder to create a Gad config (.gad.yaml).",
        );
        return;
      }
      const name = vscode.workspace
        .getConfiguration("gad")
        .get<string>("configFile", ".gad.yaml");
      const uri = vscode.Uri.joinPath(folder.uri, name);
      try {
        await vscode.workspace.fs.stat(uri);
      } catch {
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(GAD_CONFIG_TEMPLATE, "utf8"),
        );
      }
      const opened = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(opened);
    }),
  );

  // Fill in a default launch config (program = current file) when the user
  // starts debugging without a launch.json entry.
  const provider: vscode.DebugConfigurationProvider = {
    resolveDebugConfiguration(folder, config) {
      if (!config.type && !config.request && !config.name) {
        const editor = vscode.window.activeTextEditor;
        if (editor && isGadLanguage(editor.document.languageId)) {
          config.type = "gad";
          config.request = "launch";
          config.name = "Debug Gad file";
          config.program = "${file}";
        }
      }
      if (!config.program) {
        return vscode.window
          .showInformationMessage("Cannot find a Gad program to debug")
          .then(() => undefined);
      }
      return config;
    },
  };
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider("gad", provider),
  );

  // Spawn `gad debug --dap` as the debug adapter.
  const factory: vscode.DebugAdapterDescriptorFactory = {
    createDebugAdapterDescriptor() {
      const gadPath = vscode.workspace
        .getConfiguration("gad")
        .get<string>("path", "gad");
      return new vscode.DebugAdapterExecutable(gadPath, ["debug", "--dap"]);
    },
  };
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("gad", factory),
  );

  // Format-on-save: register a DocumentFormattingEditProvider that calls
  // `gad fmt -` (stdin/stdout mode). The `gad.format.useConfig` setting
  // controls whether the workspace .gad.yaml is applied; `gad.path` is the
  // executable path.
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(GAD_LANGUAGES, {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
      ): Promise<vscode.TextEdit[]> {
        const cfg = vscode.workspace.getConfiguration("gad");
        const gadPath = cfg.get<string>("path", "gad");
        const useConfig = cfg.get<boolean>("format.useConfig", true);

        const args = ["fmt"];
        if (!useConfig) args.push("--no-config");
        // Name the piped buffer so `gad fmt` picks the right dialect
        // (.gad / .gadt / .gadx) rather than assuming plain Gad on stdin.
        args.push("--stdin-name", path.basename(document.uri.fsPath));
        args.push("-"); // stdin mode

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        const cwd = workspaceFolder?.uri.fsPath ?? path.dirname(document.uri.fsPath);

        const input = document.getText();
        const result = await runGadFmt(gadPath, args, input, cwd);

        if (result.code !== 0 || !result.stdout) {
          if (result.stderr) {
            void vscode.window.showErrorMessage(`gad fmt: ${result.stderr.trim()}`);
          }
          return [];
        }

        // Replace the entire document with the formatted output.
        const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(input.length),
        );
        return [vscode.TextEdit.replace(range, result.stdout)];
      },
    }),
  );

  // Go-to-definition via the `gad def` scope resolver: send the buffer and the
  // caret's byte offset, navigate to the returned declaration (line/column).
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(GAD_LANGUAGES, {
      async provideDefinition(document, position) {
        const text = document.getText();
        const off = byteOffset(text, document.offsetAt(position));
        const res = await runGadLang(document, ["def", "--offset", String(off), "-"], text);
        if (!res || res.code !== 0 || !res.stdout.trim()) return undefined;
        let j: { line?: number; column?: number } | null;
        try {
          j = JSON.parse(res.stdout);
        } catch {
          return undefined;
        }
        if (!j) return undefined;
        const target = new vscode.Position((j.line ?? 1) - 1, (j.column ?? 1) - 1);
        return new vscode.Location(document.uri, target);
      },
    }),
  );

  // Auto-completion via the `gad complete` language service: in-scope
  // identifiers, keywords, builtins and (after `.`) the receiver's real members,
  // each with documentation. Triggered on typing and on `.`.
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      GAD_LANGUAGES,
      {
        async provideCompletionItems(document, position) {
          const text = document.getText();
          const off = byteOffset(text, document.offsetAt(position));
          const res = await runGadLang(document, ["complete", "--offset", String(off), "-"], text);
          if (!res || res.code !== 0 || !res.stdout.trim()) return undefined;
          let items: { label: string; kind: string; doc?: string }[];
          try {
            items = JSON.parse(res.stdout);
          } catch {
            return undefined;
          }
          return items.map((it) => {
            const ci = new vscode.CompletionItem(it.label, completionKind(it.kind));
            ci.detail = it.kind;
            if (it.doc) ci.documentation = new vscode.MarkdownString(it.doc);
            return ci;
          });
        },
      },
      ".",
    ),
  );
}

// runGadLang runs a `gad` language-service subcommand for document, feeding the
// buffer on stdin, resolving `gad.path` and the workspace cwd like the other
// commands. Returns undefined when the language is not Gad.
function runGadLang(
  document: vscode.TextDocument,
  args: string[],
  input: string,
): Promise<{ stdout: string; stderr: string; code: number }> | undefined {
  if (!isGadLanguage(document.languageId)) return undefined;
  const gadPath = vscode.workspace.getConfiguration("gad").get<string>("path", "gad");
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const cwd = workspaceFolder?.uri.fsPath ?? path.dirname(document.uri.fsPath);
  // Name the piped buffer so the CLI picks the dialect (.gad / .gadx). Insert
  // before the trailing `-` (stdin) marker.
  const withName = args.slice(0, -1).concat(
    ["--stdin-name", path.basename(document.uri.fsPath)],
    args.slice(-1),
  );
  return runGadFmt(gadPath, withName, input, cwd);
}

// byteOffset converts a UTF-16 code-unit offset (VS Code) to the UTF-8 byte
// offset the `gad` CLI expects.
function byteOffset(text: string, charOffset: number): number {
  return Buffer.byteLength(text.slice(0, charOffset), "utf8");
}

// completionKind maps a `gad complete` kind to a VS Code CompletionItemKind.
function completionKind(kind: string): vscode.CompletionItemKind {
  switch (kind) {
    case "function":
    case "method":
      return vscode.CompletionItemKind.Function;
    case "keyword":
      return vscode.CompletionItemKind.Keyword;
    case "constant":
      return vscode.CompletionItemKind.Constant;
    case "property":
      return vscode.CompletionItemKind.Property;
    case "field":
    case "key":
    case "export":
      return vscode.CompletionItemKind.Field;
    case "variable":
      return vscode.CompletionItemKind.Variable;
    default:
      return vscode.CompletionItemKind.Text;
  }
}

export function deactivate(): void {
  // nothing to clean up
}
