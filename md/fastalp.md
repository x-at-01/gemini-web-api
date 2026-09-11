# fastalp: Lossless float compression in Rust — 2.6x faster than C++ ALP, beating zstd/lz4 (25 GB/s decode, 9.5x ratio)

[fastalp](https://crates.io/crates/fastalp) is a pure-Rust implementation of the ALP (Adaptive Lossless Floating-Point) compression algorithm, targeting time-series, telemetry, and columnar storage systems.

In domains such as IoT monitoring, telemetry, and quantitative finance, raw IEEE 754 floating-point values compress poorly with general-purpose byte compressors (e.g. zstd, lz4) or integer bitpackers due to unpredictable variation in exponent and mantissa bits across samples.

The ALP algorithm (introduced at ACM SIGMOD 2024 by Azim Afroozeh et al., and adopted in engines like DuckDB and FastLanes) exploits the property that most real-world floats originate from decimal readings with fixed decimal precision. By adaptively discovering decimal scaling factors and projecting floats onto integers, it applies Frame-of-Reference (FOR) and SIMD bitpacking to achieve both higher compression ratios and faster decode throughput than general-purpose codecs.

### Benchmark Comparison

Tested against standard floating-point and time-series codecs across 37 public and industrial datasets on identical hardware (Apple M2 Max, measured via Geometric Mean across all datasets):

| Codec | Category | Decomp Throughput | End-to-End Comp | GeoMean Ratio |
| :--- | :--- | :---: | :---: | :---: |
| **fastalp (Rust)** | Specialized Float | **25.3 GB/s** | **2.1 GB/s** | **9.50x** |
| C++ ALP (Paper Ref) | Specialized Float | 19.3 GB/s | 0.8 GB/s | 5.93x |
| Pcodec (pco) | Specialized Float | 1.8 GB/s | 0.2 GB/s | 8.81x |
| LZ4 (lz4_flex) | General Byte | 5.0 GB/s | 2.0 GB/s | 3.89x |
| Snappy (snap) | General Byte | 4.6 GB/s | 2.5 GB/s | 3.05x |
| Zstd (level 3) | General Byte | 1.4 GB/s | 0.5 GB/s | 6.07x |
| Gorilla | Specialized Float | 1.2 GB/s | 1.9 GB/s | 4.41x |

![fastalp Floating-Point Compression Performance & Ratio Benchmark|690x2512](https://fastly.jsdelivr.net/gh/webc-fs/-@sJ/iDXAaJVvppSgiJndAw_g.svg)

### Architecture & Features

- **Zero dependencies & `no_std`**: Pure safe Rust core codec suitable for embedded targets.
- **Unified generics**: Generic implementation over `f32` and `f64` streams.
- **Zero-allocation streaming**: In-place buffer reuse via `compress_into` and `decompress_into` to eliminate allocation jitter.
- **Strict bit-exact roundtripping**: Decoded values match input IEEE 754 representations bit-for-bit (`a.to_bits() == b.to_bits()`), with an isolated exception stream for non-decimal floats, NaNs, and infinities.
- **Delta-ALP & division reconstruction (`use_div`)**: Uses first-order differences and exact division to narrow dynamic bit-widths and eliminate truncation exceptions.

### Usage

```rust
use fastalp::{compress, decompress, Result};

fn main() -> Result<()> {
    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];

    // Compress floating-point slice into a byte buffer
    let compressed = compress(&sensor_data);

    // Decompress byte buffer back to original slice
    let decompressed: Vec<f64> = decompress(&compressed)?;

    assert_eq!(decompressed, sensor_data);
    Ok(())
}
```

### Links

- Crates.io: https://crates.io/crates/fastalp
- GitHub: https://github.com/webc-site/fastalp
- Docs: https://docs.rs/fastalp