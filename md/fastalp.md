# fastalp: Evolving ALP float compression in pure Rust — 2.6x faster, 60% higher ratio (25 GB/s decode)

[fastalp](https://crates.io/crates/fastalp) is a pure-Rust algorithmic evolution of the ALP (Adaptive Lossless Floating-Point) compression paradigm, engineered for high-throughput time-series, telemetry, and columnar storage engines.

### Benchmark Comparison

Evaluated across all 37 public and industrial datasets from the official ALP benchmark suite on an Apple M2 Max (Geometric Mean across all datasets):

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

### Performance Advantages

Across the 37-dataset benchmark suite, `fastalp` demonstrates consistent speed and density gains over both the C++ reference and standard general-purpose codecs:

- **2.58x faster end-to-end compression** (2.1 GB/s vs 0.8 GB/s): Unpruned sampling in C++ ALP consumes >80% of CPU cycles. `fastalp`'s cascade search prunes non-decimal and low-gain models early, maintaining multi-gigabyte ingestion rates.
- **1.31x faster decompression** (25.3 GB/s vs 19.3 GB/s GeoMean): Pure register decoding eliminates intermediate memory roundtrips, scaling up to 40~65 GB/s on civic/macro data and 90+ GB/s on steady waveforms.
- **60% higher compression ratio** (9.50x vs 5.93x GeoMean): By reconstructing division operations and delta-encoding step variations, `fastalp` narrows dynamic bit-widths and prevents spurious exception inflation.
- **150x ~ 744x on quasi-constant telemetry**: Outlier isolation drops the primary bitstream to 0-bit, compressing 1024-element constant blocks into 11 bytes.
- **Order-of-magnitude gains over byte compressors**: Outperforms Zstd level 3 by 18x in decompression speed and 4x in compression speed, while achieving 56% higher compression density on decimal floats.

### Algorithmic & Microarchitectural Evolution

The original ALP paper (ACM SIGMOD 2024 by Azim Afroozeh et al.) established the principle of projecting decimal floats into integers followed by Frame-of-Reference (FOR) bitpacking. `fastalp` re-engineers this paradigm to resolve fundamental microarchitectural bottlenecks in the reference implementation:

- **Three-Tier Microarchitectural Pruning Pipeline**  
  Replaces exhaustive parameter exploration with a 3-stage cascade: an immediate single-cycle check for identical sequences, 4/16-sample short-circuiting for irregular data, and early non-decimal aborts. This slashes sampling overhead by 70% ~ 90%.

- **Fused Single-Pass `AlpConsumer` Register Pipeline**  
  Traditional delta decompression is two-pass: unpacking integer deltas into an 8KB stack buffer, followed by a separate prefix-sum and floating-point conversion pass. Fastalp introduces the monomorphized `AlpConsumer` architecture: bit-unpacking, prefix-sum accumulation, base-offset arithmetic, and IEEE 754 float reconstruction occur in a single pass entirely within CPU registers, eliminating 8KB intermediate buffer allocation, cache writes, and re-reads.

- **Exact Decimal Division Reconstruction (`use_div`)**  
  Binary float multiplication (e.g. `* 0.1`) suffers from IEEE 754 truncation error, causing valid decimal readings to fail roundtrip checks and land in the exception dictionary. `fastalp` reconstructs exact division paths, eliminating spurious exceptions and shrinking stored volume by 20% ~ 38%.

- **Adaptive Delta-ALP with Short-Circuit Filter**  
  Physical waveforms often have large absolute amplitudes but tiny step differentials. `fastalp` combines first-order differences with a 16-sample mathematical filter that halts delta evaluation when the local gradient exceeds the FOR span, saving CPU cycles on irregular data while cutting bit-widths by 15% ~ 38% on smooth waves.

- **Hardware-Native Round-Ties-Even**  
  Original ALP relied on floating-point magic constants (`0x0018000000000000`), which silently overflow outside $[-2^{51}, 2^{51}]$. `fastalp` maps rounding directly to hardware instructions (`ROUNDSD` on x86, `FRINTN` on ARM64), removing dynamic range limits while preserving branchless throughput.

- **Zero-Allocation Streaming & `no_std`**  
  Zero third-party dependencies, zero runtime heap allocations via `compress_into` / `decompress_into`, and native `no_std` support for embedded targets. Unified zero-cost abstractions support both `f32` and `f64`.

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