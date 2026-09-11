import { CRATE_NAME, CRATE_URL, DOCS_URL, GITHUB_URL } from "./constant.js";

export const postContentBuild = () => {
  const title =
      "[Announce] " +
      CRATE_NAME +
      ": High-performance lossless floating-point compression in pure Rust",
    raw =
      "Hi everyone,\n\n" +
      "I'd like to share [" +
      CRATE_NAME +
      "](" +
      CRATE_URL +
      "), an adaptive lossless floating-point compression library implemented in pure Rust.\n\n" +
      "It builds upon and extends the theoretical foundation of the ACM SIGMOD 2024 Best Artifact paper *ALP: Adaptive Lossless Floating-Point Compression* (integrated in DuckDB, FastLanes, and Kùzu). In domains like IoT sensing, telemetry, and quantitative finance, floating-point numbers usually originate from decimal readings with fixed precision. General-purpose byte compressors or integer bitpackers often struggle on IEEE 754 float streams, whereas `" +
      CRATE_NAME +
      "` achieves significantly higher compression ratios and throughput.\n\n" +
      "### Key Highlights\n\n" +
      "- **Pure Safe Rust & no_std**: Zero third-party runtime dependencies, natively supports embedded targets and `no_std` environments.\n" +
      "- **Unified Generic APIs**: Seamless zero-cost abstractions for both `f64` and `f32` streams.\n" +
      "- **Strict Bit-Exact Roundtripping**: Guarantees decoded floats match original IEEE 754 bits bit-for-bit (`a.to_bits() == b.to_bits()`).\n" +
      "- **Zero-Allocation & Buffer Reuse**: Provides `_into` variants (`compress_into`, `decompress_into`) to write directly into preallocated buffers.\n" +
      "- **Novel Optimizations**: Incorporates Adaptive Delta-ALP and exact decimal division reconstruction (`use_div`) to further reduce dynamic bit-widths and eliminate spurious exceptions.\n\n" +
      "### Quick Example\n\n" +
      "```rust\n" +
      "use fastalp::{compress, decompress, Result};\n\n" +
      "fn main() -> Result<()> {\n" +
      "    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];\n\n" +
      "    // Compress floating-point slice into byte buffer (generic for f64 / f32)\n" +
      "    let compressed = compress(&sensor_data);\n\n" +
      "    // Decompress byte buffer back to exact f64 slice\n" +
      "    let decompressed: Vec<f64> = decompress(&compressed)?;\n\n" +
      "    assert_eq!(decompressed, sensor_data);\n" +
      "    Ok(())\n" +
      "}\n" +
      "```\n\n" +
      "### Links\n\n" +
      "- **Crates.io**: " +
      CRATE_URL +
      "\n" +
      "- **Repository**: " +
      GITHUB_URL +
      "\n" +
      "- **Documentation**: " +
      DOCS_URL +
      "\n\n" +
      "Feedback, benchmark results, and suggestions are warmly welcomed!";

  return [title, raw];
};

export default postContentBuild;
