# fastalp: Evolving ALP float compression in pure Rust — 2.6x faster, 60% higher ratio (25 GB/s decode)

[fastalp](https://crates.io/crates/fastalp) is an engineered redesign and algorithmic evolution of the ALP (Adaptive Lossless Floating-Point) compression paradigm, implemented in pure Rust.

While the original ALP paper (ACM SIGMOD 2024 by Azim Afroozeh et al., adopted in DuckDB and FastLanes) demonstrated the effectiveness of projecting decimal floats into integers with Frame-of-Reference (FOR) and bitpacking, the reference C++ implementation exhibits several architectural bottlenecks:
1. **Exhaustive unpruned sampling**: Searching the full parameter space accounts for >80% of execution time, capping end-to-end compression throughput at ~0.8 GB/s.
2. **Two-pass delta decompression**: Unpacking integer deltas into an 8KB stack buffer followed by a separate prefix-sum pass creates intermediate memory roundtrips and cache stalls.
3. **Multiplication truncation exceptions**: Binary floating-point multiplication (e.g. `* 0.1`) introduces IEEE 754 truncation errors, creating spurious exceptions that inflate stored byte volume by 20% ~ 38%.
4. **Magic-number rounding bias limitations**: Legacy floating-point rounding biases (`0x0018000000000000`) are bounded to the $[-2^{51}, 2^{51}]$ range and risk overflow on large exponents.

`fastalp` addresses these issues with several algorithmic and microarchitectural breakthroughs:

- **Three-Tier Microarchitectural Pruning**: Replaces unpruned parameter searches with a cascade filter (pure decimal fast path, 4/16-sample short-circuiting, and non-decimal abort), boosting end-to-end compression throughput from 0.8 GB/s to **2.1 GB/s (2.58x faster than C++ ALP)**, with pure kernel throughput reaching **7.8 GB/s (1.46x vs C++)**.
- **Fused Single-Pass `AlpConsumer` Pipeline**: Bit-unpacking, prefix-sum accumulation, base-offset addition, and IEEE 754 float conversion are merged directly in CPU registers without any intermediate 8KB stack buffers, elevating decompression throughput to **25.3 GB/s GeoMean** (1.31x vs C++ ALP).
- **Exact Decimal Division Reconstruction (`use_div`)**: Eliminates spurious exception inflation caused by IEEE 754 binary multiplication truncation, shrinking compressed size by 20% ~ 38%.
- **Adaptive Delta-ALP**: Implements first-order difference encoding with a 16-sample mathematical short-circuit filter, narrowing dynamic bit-widths by 15% ~ 38% on continuous physical waveforms.
- **0-Bit Sparse Outlier Pruning**: Automatically isolates pulse spikes into the exception stream, dropping the primary bitstream to 0-bit and achieving 150x ~ 744x compression ratios on quasi-constant telemetry.
- **Hardware-Native Round-Ties-Even**: Upgrades legacy magic-number float biases to native CPU rounding instructions (`ROUNDSD` on x86, `FRINTN` on ARM64), eliminating $[-2^{51}, 2^{51}]$ overflow bounds while maintaining branchless latency.
- **Zero-Allocation Streaming**: Direct in-place buffer reuse via `compress_into` and `decompress_into` to eliminate allocation jitter in streaming pipelines.
- **Zero-Cost Generic Abstraction**: Full support for both `f32` and `f64` streams under `AlpFloat`, with zero third-party dependencies and native `no_std` support for embedded targets.

### Benchmark Comparison

Evaluated on identical hardware (Apple M2 Max) across all 37 public and industrial datasets from the original ALP paper suite (Geometric Mean):

| Codec | Category | Decomp Throughput | End-to-End Comp | Pure Kernel | GeoMean Ratio |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **fastalp (Rust)** | Specialized Float | **25.3 GB/s** | **2.1 GB/s (2.58x)** | **7.8 GB/s (1.46x)** | **9.50x (+60%)** |
| C++ ALP (Paper Ref) | Specialized Float | 19.3 GB/s | 0.8 GB/s | 5.4 GB/s | 5.93x |
| Pcodec (pco) | Specialized Float | 1.8 GB/s | 0.2 GB/s | — | 8.81x |
| LZ4 (lz4_flex) | General Byte | 5.0 GB/s | 2.0 GB/s | — | 3.89x |
| Snappy (snap) | General Byte | 4.6 GB/s | 2.5 GB/s | — | 3.05x |
| Zstd (level 3) | General Byte | 1.4 GB/s | 0.5 GB/s | — | 6.07x |
| Gorilla | Specialized Float | 1.2 GB/s | 1.9 GB/s | — | 4.41x |

![fastalp Floating-Point Compression Performance & Ratio Benchmark|690x2512](https://fastly.jsdelivr.net/gh/webc-fs/-@sJ/iDXAaJVvppSgiJndAw_g.svg)

### Usage

```rust
use fastalp::{compress, decompress, Result};

fn main() -> Result<()> {
    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];

    // Compress floating-point slice into byte buffer (generic over f64 / f32)
    let compressed = compress(&sensor_data);

    // Decompress byte buffer back to exact original slice
    let decompressed: Vec<f64> = decompress(&compressed)?;

    assert_eq!(decompressed, sensor_data);
    Ok(())
}
```

### Links

- Crates.io: https://crates.io/crates/fastalp
- GitHub: https://github.com/webc-site/fastalp
- Docs: https://docs.rs/fastalp