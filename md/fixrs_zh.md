# 写了个小工具 fixrs，自动修复 Rust 冗长绝对路径和 clippy::absolute_paths

[GitHub](https://github.com/webc-site/fixrs) · [crates.io](https://crates.io/crates/fixrs)

日常写 Rust 或者借助 AI 补全代码时，常常会遇到长串绝对路径，例如 `wbase::convert::TICKS_PER_SECOND` 或 `std::sync::atomic::Ordering::Relaxed`。

长路径不仅拉长代码行、影响阅读，在 AI 编程时也很占上下文。
Rust Clippy 提供了 `clippy::absolute_paths` lint 来建议将路径引入为 `use` 声明。
遗憾的是，官方 `cargo clippy --fix` 对这条规则没有提供自动修复支持。如果项目体量较大，可能会堆积几十上百个警告，逐个手动添加 `use` 并修改调用点既枯燥又耗时。

手动重构时还很容易踩到一些棘手的边界情况：
- 命名冲突：如果当前模块已有名为 `TICKS_PER_SECOND` 的常量，直接引入同名项会导致循环引用或遮蔽报错。
- 内嵌模块与类型转换：在内嵌 `mod` 内部存在 `as` 转换、QSelf（如 `<Type as Trait>::method`）或宏模式匹配时，手动替换容易漏掉作用域层级。

为了在项目中省去这些重复劳动，我写了 `fixrs` 这个小工具。

### 工作机制

fixrs 基于 syn 2 语法树进行源码解析，执行过程大致如下：
- 扫描 AST 中超出深度的绝对路径（默认多于 2 段的路径）。
- 跟踪文件各层级的词法作用域树，感知局部变量、函数参数以及已导入的项。
- 遇同名冲突时自动降级引入上一级模块，避免引入编译错误。
- 处理完成后就地重写并调用 rustfmt 格式化。

### 安装与使用

可以直接通过 cargo 安装：

```bash
cargo install fixrs
```

进入任意 Rust 项目目录即可运行：

```bash
# 作为 cargo 子命令执行
cargo fixrs

# 或直接运行二进制
fixrs
```

支持通过参数调整最小检测深度，例如只处理 3 段及以上的路径：

```bash
fixrs --min-depth 3
```

支持 `--dry-run` 预览修改而不写入磁盘：

```bash
fixrs --dry-run
```

### 效果示例

处理前：

```rust
pub mod time_stamp {
    pub const TICKS_PER_SECOND: u64 = wbase::convert::TICKS_PER_SECOND as u64;
}
```

处理后：

```rust
pub mod time_stamp {
    use wbase::convert;

    pub const TICKS_PER_SECOND: u64 = convert::TICKS_PER_SECOND as u64;
}
```

目前发布了 0.1.1 版本，在自己维护的几个多模块项目里跑过几轮测试。
代码在 GitHub 开源，欢迎试用。如果遇到没有覆盖到的语法场景，欢迎交流或提 issue。
