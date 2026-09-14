# fixrs: Automatic refactoring for long absolute paths and clippy::absolute_paths

[GitHub](https://github.com/webc-site/fixrs) · [crates.io](https://crates.io/crates/fixrs)

When writing Rust or working with LLM-assisted completions, code often ends up with verbose absolute paths like `wbase::convert::TICKS_PER_SECOND` or `std::sync::atomic::Ordering::Relaxed`.

Long paths clutter function bodies and consume precious LLM context tokens.
While Clippy provides `clippy::absolute_paths` to catch these occurrences, `cargo clippy --fix` does not provide machine-applicable suggestions for it. In a reasonably sized codebase with dozens or hundreds of occurrences, manually bringing each path into scope with `use` and updating call sites is tedious.

Manual refactoring also carries subtle edge cases:
- Identifier collisions: If a submodule already defines a constant named `TICKS_PER_SECOND`, pulling the item directly with `use ...::TICKS_PER_SECOND;` triggers cycle errors.
- Nested modules and expressions: Paths inside inner modules, type casts with `as`, QSelf syntax like `<Type as Trait>::method`, or pattern matching require careful scope handling.

I built `fixrs` to automate this workflow reliably.

### How it works

fixrs parses source code using syn 2:
- Detects qualified paths whose depth exceeds the threshold (default: more than 2 segments).
- Maintains a lexical scope tree per module to respect local variables, parameters, and existing imports.
- Automatically falls back to importing the parent module when a direct import would clash with an existing symbol.
- Applies changes and formats output via rustfmt.

### Installation and Usage

Install via cargo:

```bash
cargo install fixrs
```

Run inside any Rust project directory:

```bash
# Run as a cargo subcommand
cargo fixrs

# Or run the standalone binary
fixrs
```

Adjust the minimum path depth threshold if needed (e.g. only paths with 3 or more segments):

```bash
fixrs --min-depth 3
```

Preview changes without modifying files:

```bash
fixrs --dry-run
```

### Example

Before:

```rust
pub mod time_stamp {
    pub const TICKS_PER_SECOND: u64 = wbase::convert::TICKS_PER_SECOND as u64;
}
```

After:

```rust
pub mod time_stamp {
    use wbase::convert;

    pub const TICKS_PER_SECOND: u64 = convert::TICKS_PER_SECOND as u64;
}
```

v0.1.1 is now on crates.io and tested across several multi-crate projects.
The project is open source on GitHub. Feedback and issue reports for any uncovered AST patterns are very welcome.
