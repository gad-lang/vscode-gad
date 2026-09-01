# Changelog

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
