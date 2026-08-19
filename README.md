# Gad for VS Code

Language support and debugging for the [Gad](https://github.com/gad-lang/gad)
scripting language. Debugging is powered by the `gad` CLI's Debug Adapter
Protocol server (`gad debug --dap`).

## Features

- `.gad` language registration (comments, brackets, auto-closing pairs).
- Breakpoints, stepping (in/over/out), call stack and locals via the built-in
  Gad debugger.

## Requirements

The `gad` executable must be on your `PATH` (or set `gad.path` in settings).
Install it with:

```sh
go install github.com/gad-lang/gad/cmd/gad@latest
```

## Debugging

Open a `.gad` file and press **F5**, or add a launch configuration:

```json
{
  "type": "gad",
  "request": "launch",
  "name": "Debug Gad file",
  "program": "${file}",
  "stopOnEntry": false
}
```

## Syntax highlighting

Grammars, language configuration and config schemas come from the shared
[`gad-textmate`](https://github.com/gad-lang/gad-textmate) bundle, vendored here
as the `gad-textmate` git submodule (the same bundle the IntelliJ plugin uses).
`gad.tmLanguage.json` is generated from the Gad compiler vocabulary — don't
hand-edit it.

## Build

Check out the submodule first (or clone with `--recurse-submodules`):

```sh
git submodule update --init   # populate gad-textmate (grammars/schemas)
bun install
bun run compile     # tsc -> out/extension.js
bun run package     # -> vscode-gad.vsix
```

The extension registers a debug adapter that runs `gad debug --dap` over stdio;
see `web/` in the main repo for the protocol implementation.
