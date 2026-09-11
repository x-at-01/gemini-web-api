import { CRATE_NAME, CRATE_URL, DOCS_URL, GITHUB_URL } from "./constant.js";

export const postContentBuild = () => {
  const title =
      CRATE_NAME + ": lossless floating-point compression in pure Rust",
    raw =
      "Hey everyone,\n\n" +
      "Over the past few weeks I have been working on [" +
      CRATE_NAME +
      "](" +
      CRATE_URL +
      "), a pure Rust implementation of the ALP (Adaptive Lossless Floating-Point) compression algorithm.\n\n" +
      "If you deal with time series, telemetry, or columnar datasets, you have probably noticed that raw IEEE 754 floats do not compress very well with general-purpose byte compressors (zstd, lz4) or integer bitpackers.\n\n" +
      "The original ALP paper from ACM SIGMOD 2024 (by Azim Afroozeh et al., which DuckDB and FastLanes adopted) showed that most real-world sensor and financial data actually originates from decimal scales with fixed decimal places. By adaptively projecting floats into integers and applying Frame-of-Reference (FOR) with bitpacking, you can get significantly higher compression ratios and faster decode speeds than general compressors.\n\n" +
      "I wanted an ergonomic, pure Rust implementation with:\n" +
      "- Zero third-party dependencies and native no_std support for embedded systems\n" +
      "- Unified generic APIs for both f32 and f64 streams\n" +
      "- In-place buffer reuse (`compress_into` / `decompress_into`) to avoid allocation jitter in streaming pipelines\n" +
      "- Bit-exact roundtripping (`a.to_bits() == b.to_bits()`), with an isolated exception stream for NaN, Inf, and non-decimal floats\n\n" +
      "Here is a minimal example:\n\n" +
      "```rust\n" +
      "use fastalp::{compress, decompress, Result};\n\n" +
      "fn main() -> Result<()> {\n" +
      "    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];\n\n" +
      "    let compressed = compress(&sensor_data);\n" +
      "    let decompressed: Vec<f64> = decompress(&compressed)?;\n\n" +
      "    assert_eq!(decompressed, sensor_data);\n" +
      "    Ok(())\n" +
      "}\n" +
      "```\n\n" +
      "Links:\n" +
      "- Crates.io: " +
      CRATE_URL +
      "\n" +
      "- GitHub: " +
      GITHUB_URL +
      "\n" +
      "- Docs: " +
      DOCS_URL +
      "\n\n" +
      "If you have time to check it out, benchmark it on your datasets, or have any suggestions on the API design, I would love to hear your feedback!";

  return [title, raw];
};

export default postContentBuild;
