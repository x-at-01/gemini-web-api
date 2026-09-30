[GitHub](https://github.com/webc-site/ulua) · [Playground](https://webc-site.github.io/ulua) · [crates.io](https://crates.io/crates/ulua)

Hi everyone,

Sharing `ulua`, a pure-Rust implementation of the Luau language.

This project is a comprehensive refactor and continuation based on `luau-rs/luau`, which translated Roblox's original C++ implementation into Rust. We are continuing that work by modernizing the codebase into safe, idiomatic Rust.

### Current focus and ongoing refactoring

Our primary work right now is removing C/C++ transliteration artifacts, cleaning up raw pointers, eliminating warning suppressions (`#![allow(...)]`), and shrinking the `unsafe` surface area. The project is under active development.

We have not yet conducted systematic microarchitectural performance tuning. The throughput observed today comes primarily from Luau's well-designed register VM and bytecode layout. Once all C-style legacy code has been refactored into clean idiomatic Rust and internal boundaries stabilize, we plan to systematically optimize the VM dispatch and GC.

### In-Memory Benchmark Comparison

To compare performance without process spawn or terminal I/O latency, we benchmarked 16 compute-heavy test cases in a single process on Apple Silicon (Apple M2 Max, arm64). Median execution times across iterations (in ms):

| Benchmark Case | ulua (Rust Interp) | mlua/luau (C++ Interp) | ulua (JIT) | mlua/luau (C++ JIT) | LuaJIT (JIT) | Lua 5.4 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| binarytrees (alloc/GC) | 105.0 | 135.7 | 70.4 | 89.9 | 49.6 | 116.9 |
| coroutines (context switch) | 83.1 | 108.2 | 82.8 | 130.8 | 26.1 | 145.3 |
| fannkuch (permutations) | 33.1 | 28.8 | 7.9 | 7.8 | 3.6 | 22.6 |
| fib (call stack recursion) | 83.7 | 92.6 | 35.2 | 34.8 | 8.4 | 74.9 |
| mandel (floating point loop) | 93.2 | 93.5 | 25.4 | 23.3 | 11.0 | 56.2 |
| matmul (dense matrix) | 51.8 | 45.8 | 12.2 | 12.5 | 4.3 | 38.3 |
| nbody (celestial mechanics) | 93.4 | 95.7 | 92.5 | 92.7 | 4.8 | 72.1 |
| spectralnorm (eigenvalues) | 79.9 | 74.6 | 20.7 | 19.9 | 2.2 | 90.9 |
| tablesort (quicksort closure) | 64.5 | 66.9 | 63.8 | 67.4 | 115.2 | 241.1 |
| Geometric Mean Ratio (vs ulua) | 1.0 (baseline) | 1.02 | 0.52 | 0.57 | 0.16 | 1.17 |

In interpreter mode, ulua tracks the upstream C++ implementation closely (1.0 vs 1.02 GeoMean) and is approximately 17% faster than PUC Lua 5.4. With native JIT enabled (`features = ["jit"]`), execution time drops by ~48% on compute-heavy workloads, on par with upstream C++ Luau JIT (0.57).

### WebAssembly Playground

Because there is zero C/C++ toolchain dependency, ulua compiles directly to WebAssembly (`wasm32-unknown-unknown`). We have a live web playground running the full compiler, type inference engine, and VM client-side:

https://webc-site.github.io/ulua

Feedback, bug reports, and conformance edge cases are warmly welcomed on our repository!
