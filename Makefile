# Makefile for the Gad VS Code extension.
# Thin wrapper over the bun scripts in package.json.
BUN ?= bun

.DEFAULT_GOAL := help

## help: list the available targets
.PHONY: help
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## install: install dependencies (and the gad-textmate bundle submodule)
.PHONY: install
install:
	git submodule update --init
	$(BUN) install

## compile: compile the TypeScript sources (out/)
.PHONY: compile
compile: install
	$(BUN) run compile

## package: build the .vsix extension package
.PHONY: package
package: install
	$(BUN) run package

## clean: remove build output and the packaged .vsix
.PHONY: clean
clean:
	rm -rf out vscode-gad.vsix
