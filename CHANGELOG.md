# Changelog

## 0.1.1-rc.3

- **Syntax highlighting**: `class`, `mixin` and `interface` are highlighted as
  keywords only in declaration position (`class [Name] {`, `mixin [Name] {`,
  `interface {`/`[`/`Name {`). They are contextual keywords — plain identifiers
  everywhere else — so using them as parameter names, selectors or dict keys
  (`fn(class)`, `x.mixin`, `{interface: 1}`) no longer mis-highlights them.
  (Shared TextMate grammar.)

## 0.1.1-rc.2

Keeps the extension in step with recent Gad language features.

- **Syntax highlighting**: the shared TextMate grammar now highlights the
  `StaticType` builtin alongside `Class` / `Mixin`.
- Highlighting, completion and diagnostics work with the new language syntax
  added in this cycle:
  - `type<X>` / `type<X|Y>` **meta-type** parameters (dispatch on a type value).
  - marker `type Name { … }` types and the `const Name = type { … }` form.
  - `gad.transform(…)` mapped transforms and the `t.raises(…)` test assertion.
  - `match` without a subject (`match { … }`), mixable `: value` / `{ block }`
    arms, and `;`/newline arm separators.

## 0.1.1-rc.1

- Gad and Gadx language support, DAP debugging, TextMate grammar.
