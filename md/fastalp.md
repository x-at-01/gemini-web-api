# [Announce] fastalp: High-performance lossless floating-point compression in pure Rust

Hi everyone,

I'd like to share [fastalp](https://crates.io/crates/fastalp), an adaptive lossless floating-point compression library implemented in pure Rust.

It builds upon and extends the theoretical foundation of the ACM SIGMOD 2024 Best Artifact paper *ALP: Adaptive Lossless Floating-Point Compression* (integrated in DuckDB, FastLanes, and Kùzu). In domains like IoT sensing, telemetry, and quantitative finance, floating-point numbers usually originate from decimal readings with fixed precision. General-purpose byte compressors or integer bitpackers often struggle on IEEE 754 float streams, whereas `fastalp` achieves significantly higher compression ratios and throughput.

### Key Highlights

- **Pure Safe Rust & no_std**: Zero third-party runtime dependencies, natively supports embedded targets and `no_std` environments.
- **Unified Generic APIs**: Seamless zero-cost abstractions for both `f64` and `f32` streams.
- **Strict Bit-Exact Roundtripping**: Guarantees decoded floats match original IEEE 754 bits bit-for-bit (`a.to_bits() == b.to_bits()`).
- **Zero-Allocation & Buffer Reuse**: Provides `_into` variants (`compress_into`, `decompress_into`) to write directly into preallocated buffers.
- **Novel Optimizations**: Incorporates Adaptive Delta-ALP and exact decimal division reconstruction (`use_div`) to further reduce dynamic bit-widths and eliminate spurious exceptions.

### Quick Example

```rust
use fastalp::{compress, decompress, Result};

fn main() -> Result<()> {
    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];

    // Compress floating-point slice into byte buffer (generic for f64 / f32)
    let compressed = compress(&sensor_data);

    // Decompress byte buffer back to exact f64 slice
    let decompressed: Vec<f64> = decompress(&compressed)?;

    assert_eq!(decompressed, sensor_data);
    Ok(())
}
```

### Links

- **Crates.io**: https://crates.io/crates/fastalp
- **Repository**: https://github.com/webc-site/fastalp
- **Documentation**: https://docs.rs/fastalp

Feedback, benchmark results, and suggestions are warmly welcomed!