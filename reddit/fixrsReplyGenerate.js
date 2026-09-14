const linkStrip = (text) => {
  let cleaned = text.replaceAll(/https?:\/\/[^\s\)]+/g, "");
  cleaned = cleaned.replaceAll(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  return cleaned;
};

export const fixrsReplyGenerate = (target_post = null) => {
  const title = target_post?.title?.toLowerCase() ?? "",
    is_pedantic = title.includes("pedantic") || title.includes("strict"),
    is_restriction = title.includes("restriction") || title.includes("bacon");

  let opening =
    "I'm still fairly new to Rust, but I ran into this exact annoyance while trying to clean up clippy warnings.";

  if (is_restriction) {
    opening =
      "I'm still fairly new to Rust, but clippy::absolute_paths from the restriction group was one of the first ones that gave me headaches.";
  } else if (is_pedantic) {
    opening =
      "I'm pretty new to Rust, but as someone who also likes strict lints, clippy::absolute_paths was a pain to deal with.";
  }

  const reply_lines = [
    opening,
    "",
    "The tricky part is that cargo clippy --fix cannot provide machine-applicable suggestions for clippy::absolute_paths. Bringing paths into scope with use statements isn't always safe automatically, because direct imports can shadow local variables or trigger name collisions in nested modules. Doing dozens of these by hand across files gets old real fast.",
    "",
    "I ended up writing a small CLI tool called fixrs to automate this workflow. It parses the AST with syn 2, tracks lexical scopes per module, and refactors long paths into use imports (falling back to importing the parent module if a direct import would clash).",
    "",
    "You can install it directly via cargo:",
    "",
    "```bash",
    "cargo install fixrs",
    "```",
    "",
    "To preview changes without touching any files:",
    "",
    "```bash",
    "cargo fixrs --dry-run",
    "```",
    "",
    "And to apply them in-place:",
    "",
    "```bash",
    "cargo fixrs",
    "```",
    "",
    "Here is a quick before and after of how it cleans up call sites and resolves module scopes:",
    "",
    "```rust",
    "// Before:",
    "pub mod time_stamp {",
    "    pub const TICKS_PER_SECOND: u64 = wbase::convert::TICKS_PER_SECOND as u64;",
    "}",
    "",
    "// After:",
    "pub mod time_stamp {",
    "    use wbase::convert;",
    "",
    "    pub const TICKS_PER_SECOND: u64 = convert::TICKS_PER_SECOND as u64;",
    "}",
    "```",
    "",
    "Hope this helps save some manual refactoring time if anyone else is running into similar clippy warnings.",
  ];

  const raw_reply = reply_lines.join("\n");
  return linkStrip(raw_reply);
};

export default fixrsReplyGenerate;
