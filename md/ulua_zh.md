# 写了个纯 Rust 实现的 Luau 语言与 JIT 虚拟机 ulua

[GitHub](https://github.com/webc-site/ulua) · [Playground 在线体验](https://webc-site.github.io/ulua) · [Crates.io](https://crates.io/crates/ulua)

最近开源了 ulua，一个用纯 Rust 实现的 Luau 语言运行时。Luau 是 Roblox 基于 Lua 5.1 深度改造演进的脚本语言，具备渐进静态类型系统、寄存器虚拟机和编译优化管线。

在此之前，在 Rust 中嵌入使用 Luau 主要依赖基于 C++ 源码的 FFI 绑定（例如 mlua 的 luau feature）。使用 C++ 绑定需要依赖 C/C++ 交叉编译工具链，在需要静态编译、移植到嵌入式平台或编译为 WebAssembly 在浏览器内无缝运行时，配置流程会繁琐许多。

ulua 项目基于早期从 C++ 源码转译的 Rust 代码底座进行深度重写，包含从词法解析、AST 语法树、字节码编译、寄存器虚拟机、垃圾回收、静态类型推导到 A64/X64 本地机器码即时编译（CodeGen JIT）的完整处理管线，无需任何 C/C++ 编译依赖。

### 现状与开发重心

需要主动说明的是，项目目前处于活跃的重构与持续开发阶段：

当前阶段的主要工作，是集中消除 C/C++ 转译遗留下来的原始指针操作、精简 unsafe 代码块，并彻底移除各类警告忽略属性（#![allow(...)]）。我们正在逐步将大量 C 风格的数据流改写为惯用的 Rust 模式，以构建一个安全、可维护的现代化代码库。

目前代码尚未做细致的底层微架构性能调优。当前的执行效率主要得益于 Luau 本身简洁紧凑的寄存器虚拟机架构。我们计划在后续将所有 C 风格残余代码完全清洗、重构为纯正 idiomatic Rust 并且架构稳定后，再集中开展系统级的性能与 GC 优化。

### 性能基准实测数据

为了客观评估执行开销，测试套件采用纯 Rust 进程内微基准（消除外部子进程创建与终端 I/O 带来的干扰），在 Apple Silicon (Apple M2 Max, arm64) 平台上运行了 16 组经典计算密集用例（涵盖二叉树分配与 GC、40 万次协程切换、全排列、递归、曼德博分形、矩阵乘法、天体轨道模拟、谱范数逼近等），取各引擎多次运行的耗时中位数（单位：毫秒 ms）：

| 基准测试用例 | ulua (纯 Rust 解释) | mlua/luau (C++ 解释) | ulua (JIT) | mlua/luau (C++ JIT) | LuaJIT (JIT) | Lua 5.4 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| binarytrees (树分配/GC) | 105.0 | 135.7 | 70.4 | 89.9 | 49.6 | 116.9 |
| coroutines (协程切换) | 83.1 | 108.2 | 82.8 | 130.8 | 26.1 | 145.3 |
| fannkuch (全排列翻转) | 33.1 | 28.8 | 7.9 | 7.8 | 3.6 | 22.6 |
| fib (深度递归) | 83.7 | 92.6 | 35.2 | 34.8 | 8.4 | 74.9 |
| mandel (分形浮点迭代) | 93.2 | 93.5 | 25.4 | 23.3 | 11.0 | 56.2 |
| matmul (矩阵乘法) | 51.8 | 45.8 | 12.2 | 12.5 | 4.3 | 38.3 |
| nbody (引力轨道模拟) | 93.4 | 95.7 | 92.5 | 92.7 | 4.8 | 72.1 |
| spectralnorm (谱范数) | 79.9 | 74.6 | 20.7 | 19.9 | 2.2 | 90.9 |
| tablesort (快速排序) | 64.5 | 66.9 | 63.8 | 67.4 | 115.2 | 241.1 |
| 跨 16 组几何平均耗时比 | 1.0 (基准) | 1.02 | 0.52 | 0.57 | 0.16 | 1.17 |

实测数据显示，在解释执行模式下，ulua 的几何平均耗时与官方 C++ Luau 基本一致（1.0 vs 1.02），且比官方 Lua 5.4 快约 17%；在开启 JIT 机器码生成（features = ["jit"]）后，计算密集型场景耗时降低约 48%（相对解释模式由 1.0 降至 0.52），水平与官方 C++ Luau JIT (0.57) 相当。

### 浏览器端 WebAssembly Playground

由于脱离了 C++ 编译链依赖，ulua 可以直接编译到 wasm32 目标。我们部署了一个纯静态的在线演练场：

https://webc-site.github.io/ulua

页面在浏览器端运行 WebAssembly 虚拟机，支持 Luau 代码的即时语法高亮、双向静态类型推导诊断以及虚拟机执行。

### 快速上手示例

在 Cargo.toml 中添加依赖：

```toml
[dependencies]
ulua = "0.1"
```

基础求值与字节码执行：

```rust
use ulua::{compile, eval, eval_bytecode};

fn main() -> Result<(), Box<dyn std::error::Error>> {
  // 直接求值
  eval("assert(1 + 1 == 2)")?;

  // 编译为二进制字节码
  let bytecode = compile("assert(10 * 20 == 200)")?;

  // 直接执行预编译字节码
  eval_bytecode(&bytecode)?;

  Ok(())
}
```

宿主环境交互与 JIT 控制：

```rust
use ulua::prelude::*;

fn main() -> Result<()> {
  let lua = Lua::new();

  // 默认使用纯解释执行
  lua.load("print('Hello from ulua interpreter')").exec()?;

  // 可通过 API 动态开关 JIT 机器码生成
  #[cfg(feature = "jit")]
  {
    lua.enable_jit(true)?;
    let sum: i64 = lua.load(r#"
      local total = 0
      for i = 1, 1000000 do
        total += i
      end
      return total
    "#).eval()?;
    assert_eq!(sum, 500000500000);
  }

  // 向 Luau 注册 Rust 函数
  let add = lua.create_function(|_, (a, b): (i64, i64)| Ok(a + b))?;
  lua.globals().set("add", add)?;

  let res: i64 = lua.load("return add(10, 20)").eval()?;
  assert_eq!(res, 30);

  Ok(())
}
```

### 交流与反馈

项目已在 GitHub 开源，发布于 crates.io。目前我们正在逐步清理各类历史遗留的 unsafe 块并补全测试用例。欢迎大家试用、提出 issue 反馈或提交 PR 共同改进。
