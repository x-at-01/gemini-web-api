# fastalp: 纯 Rust 打造的下一代 ALP 浮点无损压缩 — 25 GB/s 极速解码、压缩比提升 60%、压缩提速 2.6x

[fastalp (crates.io)](https://crates.io/crates/fastalp) · [GitHub](https://github.com/webc-site/fastalp) · [文档 (docs.rs)](https://docs.rs/fastalp)

fastalp 是对 ALP（Adaptive Lossless Floating-Point，自适应浮点无损压缩）算法在纯 Rust 中的算法级演进与重构实现，专为高吞吐时序数据库、IoT/遥测数据采集以及列式存储引擎打造。

### 基准性能评测 (Benchmark Comparison)

在 Apple M2 Max 上针对官方 ALP 基准测试集的全部 37 个公开和工业数据集进行了全量评估（跨所有数据集的几何平均值 GeoMean）：

| 编解码器 (Codec) | 类别 | 解压吞吐量 | 端到端压缩吞吐 | 纯内核压缩 | 几何平均压缩比 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **fastalp (Rust)** | 专用浮点压缩 | **25.3 GB/s** | **2.1 GB/s (2.58x)** | **7.8 GB/s (1.46x)** | **9.50x (+60%)** |
| C++ ALP (论文原版) | 专用浮点压缩 | 19.3 GB/s | 0.8 GB/s | 5.4 GB/s | 5.93x |
| Pcodec (pco) | 专用浮点压缩 | 1.8 GB/s | 0.2 GB/s | — | 8.81x |
| LZ4 (lz4_flex) | 通用字节压缩 | 5.0 GB/s | 2.0 GB/s | — | 3.89x |
| Snappy (snap) | 通用字节压缩 | 4.6 GB/s | 2.5 GB/s | — | 3.05x |
| Zstd (level 3) | 通用字节压缩 | 1.4 GB/s | 0.5 GB/s | — | 6.07x |
| Gorilla | 专用浮点压缩 | 1.2 GB/s | 1.9 GB/s | — | 4.41x |

![fastalp Benchmark Infographic|690x2512](https://fastly.jsdelivr.net/gh/webc-fs/-@sJ/iDXAaJVvppSgiJndAw_g.svg)

### 核心性能优势

在 37 个数据集的基准套件中，`fastalp` 相较于 C++ 参考实现和业界主流通用压缩算法，均展现出显著的速度与压缩率优势：

- **端到端压缩提速 2.58 倍**（2.1 GB/s vs 0.8 GB/s）：原版 C++ ALP 的无剪枝穷举采样消耗了 80% 以上的 CPU 周期。`fastalp` 引入三级级联搜索，在采样初期快速剪枝非十进制和低收益模型，维持多 GB/s 的极速写入率。
- **解压速度提速 1.31 倍**（几何平均 25.3 GB/s vs 19.3 GB/s）：纯寄存器流水线解码避免了内存中间缓冲区的往返开销，在城市/宏观指标数据上可达 40~65 GB/s，在平稳波形上甚至超过 90+ GB/s。
- **压缩比提升 60%**（几何平均 9.50x vs 5.93x）：通过重构除法运算路径并采用差分增量（Delta）编码微小步进，`fastalp` 收窄了动态位宽，彻底防止异常字典（Exception Dictionary）膨胀。
- **准常量遥测数据达到 150x ~ 744x 极致压缩**：通过离群点隔离机制将主体位流压缩至 0-bit，将 1024 个元素的常量块直接压缩至仅 11 字节。
- **相比通用字节压缩算法数量级领跑**：在解压速度上是 Zstd (level 3) 的 18 倍、压缩速度为其 4 倍，且在十进制浮点数上的压缩密度高出 56%。

### 架构与算法工程细节

原始 ALP 论文（ACM SIGMOD 2024, Azim Afroozeh 等）确立了将十进制浮点数投影为整数后进行基准参考系（FOR, Frame-of-Reference）位打包的基本原理。`fastalp` 从计算机体系结构与现代 CPU 微架构出发重构了该范式，攻克了参考实现中的多个性能瓶颈：

- **三级微架构级联剪枝流水线 (Three-Tier Microarchitectural Pruning Pipeline)**  
  摒弃全空间参数穷举搜索，采用 3 阶段级联策略：单周期内快速判断全等序列、4/16 样本短路跳出不规则数据、以及非十进制特征提前中止。将采样开销大幅削减 70% ~ 90%。

- **融合单遍 `AlpConsumer` 寄存器解码流水线 (Fused Single-Pass `AlpConsumer` Register Pipeline)**  
  传统 Delta 解压为两遍式（Two-pass）：先将整数增量解包至 8KB 栈缓冲区，再做前缀和与浮点转换。Fastalp 创新设计单态化 `AlpConsumer` 架构：位解包、前缀和累加、基准偏移计算和 IEEE 754 浮点数重构全部在 CPU 寄存器内以单遍完成，彻底消除 8KB 中间缓冲分配、缓存写入与重复读取开销。

- **精确十进制除法重构 (`use_div`)**  
  二进制浮点乘法（如 `* 0.1`）受限于 IEEE 754 精度截断误差，导致本该精准匹配的十进制数往返校验失败并溢出至异常字典。`fastalp` 精确重构除法路径，杜绝虚假异常膨胀，数据体积进一步缩减 20% ~ 38%。

- **带短路过滤器的自适应 Delta-ALP (Adaptive Delta-ALP with Short-Circuit Filter)**  
  物理波形通常具备绝对振幅大但局部步进极小的特性。`fastalp` 结合一阶差分与 16 样本数学过滤器，当局部梯度超出 FOR 跨度时立即终止 Delta 评估，既避免了不规则数据上的无谓计算，又在平滑波形上将位宽收窄 15% ~ 38%。

- **硬件原生银行家舍入 (Hardware-Native Round-Ties-Even)**  
  原版 ALP 依赖浮点 Magic Constant (`0x0018000000000000`)，在 $[-2^{51}, 2^{51}]$ 范围外会静默溢出。`fastalp` 将舍入直接映射到现代 CPU 硬件指令（x86 的 `ROUNDSD`、ARM64 的 `FRINTN`），移除了动态范围限制并保障了无分支的高吞吐。

- **零堆分配流式支持与 `no_std`**  
  完全零第三方依赖，通过 `compress_into` / `decompress_into` 实现运行期零堆内存分配，原生支持 `no_std`，可无缝嵌入嵌入式与内核环境。统一的零成本抽象同时支持 `f32` 与 `f64`。

### 使用示例

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
fastalp = "0.1"
```

代码示例：

```rust
use fastalp::{compress, decompress, Result};

fn main() -> Result<()> {
    let sensor_data = vec![20.5, 20.6, 20.8, 21.0, 20.9, 21.2];

    // 将浮点切片压缩为字节数组（泛型支持 f64 / f32）
    let compressed = compress(&sensor_data);

    // 将字节数组无损还原为原始切片
    let decompressed: Vec<f64> = decompress(&compressed)?;

    assert_eq!(decompressed, sensor_data);
    Ok(())
}
```
