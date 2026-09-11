# fastalp: lossless floating-point compression in pure Rust

Hey everyone,

Over the past few weeks I have been working on [fastalp](https://crates.io/crates/fastalp), a pure Rust implementation of the ALP (Adaptive Lossless Floating-Point) compression algorithm.

If you deal with time series, telemetry, or columnar datasets, you have probably noticed that raw IEEE 754 floats do not compress very well with general-purpose byte compressors (zstd, lz4) or integer bitpackers.

The original ALP paper from ACM SIGMOD 2024 (by Azim Afroozeh et al., which DuckDB and FastLanes adopted) showed that most real-world sensor and financial data actually originates from decimal scales with fixed decimal places. By adaptively projecting floats into integers and applying Frame-of-Reference (FOR) with bitpacking, you can get significantly higher compression ratios and faster decode speeds than general compressors.

I wanted an ergonomic, pure Rust implementation with:
- Zero third-party dependencies and native no_std support for embedded systems
- Unified generic APIs for both f32 and f64 streams
- In-place buffer reuse (`compress_into` / `decompress_into`) to avoid allocation jitter in streaming pipelines
- Bit-exact roundtripping (`a.to_bits() == b.to_bits()`), with an isolated exception stream for NaN, Inf, and non-decimal floats

Here is a minimal example:

```rust
use fastalp::{compress, decompress, Result};

fn main() -> Result<()> {
    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];

    let compressed = compress(&sensor_data);
    let decompressed: Vec<f64> = decompress(&compressed)?;

    assert_eq!(decompressed, sensor_data);
    Ok(())
}
```

Links:
- Crates.io: https://crates.io/crates/fastalp
- GitHub: https://github.com/webc-site/fastalp
- Docs: https://docs.rs/fastalp

If you have time to check it out, benchmark it on your datasets, or have any suggestions on the API design, I would love to hear your feedback!