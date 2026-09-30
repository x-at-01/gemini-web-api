# ulua: Pure Rust implementation of the Luau language with JIT and WebAssembly

[GitHub](https://github.com/webc-site/ulua) · [Playground](https://webc-site.github.io/ulua) · [crates.io](https://crates.io/crates/ulua)

ulua is an open-source, pure-Rust implementation of the Luau programming language. Luau is Roblox's high-performance evolution of Lua 5.1, featuring a gradual static type system, register-based virtual machine, and compiler optimization pipeline.

Previously, using Luau in Rust required C++ FFI bindings (such as mlua with the luau feature), which pulls in C/C++ build tools and complicates cross-compilation, static linking, and WebAssembly browser targets.

ulua provides the complete Luau pipeline written in Rust: lexer, parser, bytecode compiler, register VM, garbage collector, bidirectional static type checker, and native machine code generation (CodeGen JIT for AArch64 and x86_64).

### Current Status and Ongoing Refactoring

A note on project status: ulua is under active development and refactoring.

The current focus is primarily on eliminating C-style artifacts from earlier transliterations, shrinking the unsafe footprint, and eliminating warning suppression attributes (such as #![allow(...)]). We are systematically replacing raw pointers and C idioms with idiomatic Rust patterns to establish a sound and verifiable foundation.

We have not yet conducted systematic low-level microarchitectural tuning. The throughput observed today comes largely from Luau's register VM design. Once the C-style legacy code is refactored into clean, idiomatic Rust and the internal architecture stabilizes, we will turn our attention to dedicated performance profiling and GC optimizations.

### In-Memory Benchmark Comparison

To measure execution characteristics without process initialization and shell I/O noise, benchmarks were evaluated using a pure-Rust in-memory test runner on Apple Silicon (Apple M2 Max, arm64). The suite covers 16 compute-heavy benchmarks (binary trees allocation and GC, 400k coroutine ping-pong switches, fannkuch, deep recursive Fibonacci, Mandelbrot fractals, matrix multiplication, N-body orbital mechanics, spectral norm, etc.), taking median runtimes across runs (in milliseconds, ms):

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

In pure interpretation mode, ulua matches official C++ Luau throughput (1.0 vs 1.02 GeoMean) and is approximately 17% faster than PUC Lua 5.4. With native JIT compilation enabled (features = ["jit"]), runtime drops by 48% (0.52 vs 1.0 baseline), matching C++ Luau JIT (0.57).

### Browser-based WebAssembly Playground

Without C/C++ toolchain dependencies, ulua compiles directly to wasm32. A static browser playground is available at:

https://webc-site.github.io/ulua

The playground runs the Luau compiler, bidirectional type inference engine, and virtual machine entirely client-side via WebAssembly.

### Usage Example

Add to Cargo.toml:

```toml
[dependencies]
ulua = "0.1"
```

Evaluating scripts or running bytecode:

```rust
use ulua::{compile, eval, eval_bytecode};

fn main() -> Result<(), Box<dyn std::error::Error>> {
  // Evaluate source directly
  eval("assert(1 + 1 == 2)")?;

  // Compile source into binary bytecode
  let bytecode = compile("assert(10 * 20 == 200)")?;

  // Execute precompiled bytecode
  eval_bytecode(&bytecode)?;

  Ok(())
}
```

Host embedding and JIT control:

```rust
use ulua::prelude::*;

fn main() -> Result<()> {
  let lua = Lua::new();

  // Pure interpretation by default
  lua.load("print('Running in interpreter')").exec()?;

  // Enable JIT compilation dynamically
  #[cfg(feature = "jit")]
  {
    lua.enable_jit(true)?;
    let result: i64 = lua.load(r#"
      local sum = 0
      for i = 1, 1000000 do sum += i end
      return sum
    "#).eval()?;
    assert_eq!(result, 500000500000);
  }

  // Expose Rust functions to Luau
  let add = lua.create_function(|_, (a, b): (i64, i64)| Ok(a + b))?;
  lua.globals().set("add", add)?;

  let res: i64 = lua.load("return add(10, 20)").eval()?;
  assert_eq!(res, 30);

  Ok(())
}
```

### Community and Feedback

ulua is open source and published on crates.io. We welcome issues, bug reports, and discussions on design or edge cases as we continue refactoring the codebase.
