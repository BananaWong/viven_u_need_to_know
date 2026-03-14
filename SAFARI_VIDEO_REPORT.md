# Safari 视频兼容性问题排查报告

**项目：** Viven Water 官网
**问题：** Hero Section 背景视频在 iPad Safari 上显示黑屏
**报告时间：** 2026-03-14
**状态：** 待部署验证

---

## 一、问题描述

网站首页（Hero Section）有一段全屏背景视频。在 Chrome、Firefox 等浏览器上表现正常，但在 **iPad Safari** 上始终显示黑屏——页面其他所有内容（导航、文字、按钮、其他板块）均正常渲染，唯独视频区域是纯黑背景加一个 CSS 渐变光晕。

---

## 二、排查过程

问题的根本难点在于：Safari 在视频无法播放时**不会报错**，只是静默地什么都不显示，导致非常难以通过错误日志定位原因。我们经历了以下几轮排查：

---

### 第一轮：Safari 视频播放通用兼容性修复

**假设：** Safari 对视频自动播放有更严格的策略，且旧版 iOS 有额外要求。

**做了什么：**
- 将 Cloudinary CDN 的视频 URL 从 `f_auto`（自动格式）改为明确指定 `f_mp4,vc_h264`，防止 CDN 向 Safari 推送它不支持的格式
- 修复播放时序：原代码在页面加载后立即调用 `.play()`，Safari 加载视频比 Chrome 慢，容易在视频还没准备好时就调用失败。改为等视频准备好（`readyState >= 2`）或等待 `canplay` 事件后再播放
- 添加 `webkit-playsinline` 属性，兼容 iOS 9/10 等旧版系统
- 添加 `preload="auto"` 和 `poster`（封面图），减少黑屏时间

**结果：** 无效，iPad Safari 依然黑屏。

---

### 第二轮：CSS Filter 渲染 Bug

**假设：** 视频其实在播放，但 Safari 在渲染时出了问题。

**发现：** Safari 有一个已知的渲染缺陷——当 CSS `filter` 属性（如 `brightness`、`contrast`）直接加在 `<video>` 元素上时，Safari 创建合成层（compositing layer）时会出错，导致画面全黑。这个问题 Chrome 和 Firefox 完全不受影响，所以开发阶段无法发现。

**做了什么：** 将 `filter: brightness(95%) contrast(105%)` 从 `<video>` 元素移到外层的 `<div>` 包裹层上，`<video>` 本身不附加任何 filter。

**结果：** 无效，iPad Safari 依然黑屏。

---

### 第三轮：GPU 合成层 + 渲染 Fallback

**假设：** Safari 没有为这个视频元素分配独立的 GPU 渲染层，导致画面无法合成到屏幕上。

**做了什么：**
- 给 `<video>` 加上 `transform: translate3d(0,0,0)`，强制 Safari 为视频元素开启专属 GPU 合成层
- 添加 3 秒超时 Fallback：监听视频的 `timeupdate` 事件，若 3 秒内没有触发（说明视频根本没在播），自动切换为静态封面图，至少保证用户不看到黑屏

**结果：** Fallback 没有触发（说明视频在解码），但画面还是黑屏。问题进一步缩小——视频在播放，只是画面没有渲染出来。

---

### 第四轮：更换视频文件

**假设：** Cloudinary CDN 的 `vc_h264` 转码参数实际上没有生效，或者 Cloudinary 对这个视频的自动格式判断出了问题。

**做了什么：** 重新导出了一个 H.264 编码版本的视频，直接上传到 Cloudinary 作为新资产，绕过格式转换参数。

**结果：** 首次加载时 autoplay 失效（Cloudinary on-demand 转码延迟导致），刷新后 autoplay 正常，但 iPad Safari 依然黑屏。

---

### 第五轮：截图分析 + 根本原因确认

**用户提供了 iPad Safari 的截图。**

截图显示：页面背景呈现出一个暗色调加中央灰白色椭圆光晕——这正是 HTML `<section>` 元素自身的 CSS 径向渐变背景，说明 `<video>` 元素在 iPad Safari 上完全透明，视频画面完全没有渲染出来。

**根本原因锁定：**

原始视频文件以 **AV1 编码**上传。AV1 是一种新型视频编码格式，压缩效率高，但苹果设备的支持极为有限：

| 设备 | AV1 支持情况 |
|------|------------|
| iPhone 15 及以上（A17 芯片） | 支持 |
| iPad Pro M4 | 支持 |
| 其他所有 iPhone / iPad | **不支持** |
| macOS Safari 17+ | 支持 |
| macOS Safari 16 及以下 | **不支持** |

绝大多数用户的 Apple 设备都不支持 AV1，且 Safari 在无法解码时**不报任何错误，只显示黑屏**。这就是为什么之前所有代码层面的修复都没有效果——问题根本不在代码，在视频文件本身的编码格式。

Cloudinary 的 `vc_h264` 转码参数本应强制转换为 H.264，但实际上对这个视频未能生效，可能是 Cloudinary 判断原始文件已经"足够优化"而跳过了转码流程。

---

### 第六轮（当前方案）：本地托管 + 双格式多源

**策略：** 完全脱离 Cloudinary 的格式判断，将视频文件直接托管在 Hostinger VPS 上，同时提供 AV1 和 H.264 两个版本，让浏览器自己选择：

```
├── public/
│   └── videos/
│       ├── Herosection_av1.mp4   (1.9MB，Chrome/Firefox 使用)
│       └── Herosection_h264.mp4  (3.7MB，Safari 使用)
```

代码中使用 `<source>` 多源写法：
```html
<source src="/videos/Herosection_av1.mp4" type="video/mp4; codecs=av01.0.05M.08" />
<source src="/videos/Herosection_h264.mp4" type="video/mp4; codecs=avc1.42E01E" />
```

浏览器按顺序检查每个 `<source>` 的 `type` 和 `codecs`：
- Safari（不支持 AV1）→ 跳过第一个 → 选择 H.264
- Chrome/Firefox（支持 AV1）→ 选择 AV1（更小，加载更快）

**优势：**
- 完全控制文件格式，不依赖 CDN 的格式协商
- 服务器（nginx/Apache）对视频 Range Request 的支持比 CDN 更可预期
- 两种格式兼顾兼容性与性能

---

## 三、待完成事项

| 事项 | 负责方 | 状态 |
|------|--------|------|
| 将最新代码部署到 Hostinger VPS | 开发 | 待部署 |
| 在 iPad Safari 上验证视频正常播放 | 测试 | 待验证 |
| 确认 H.264 视频文件编码正确（可用 `ffprobe` 检查） | 开发 | 待确认 |
| （可选）将视频 encode 为 Baseline Profile 以提升旧设备兼容性 | 开发 | 可选 |
| （可选）清理 Cloudinary 上的旧视频资产 | 运营 | 可选 |

---

## 四、验证通过后的预期效果

- **iPad Safari（所有机型）**：正常播放 H.264 背景视频
- **Chrome / Firefox**：正常播放 AV1 背景视频，加载体积比 H.264 小约 50%
- **旧版 Safari（macOS）**：正常播放 H.264
- **无法播放时**：3 秒后自动切换为静态封面图，不显示黑屏

---

## 五、经验总结

1. **Safari 的视频兼容性问题不会报错**，只会静默失败，必须主动排查
2. **AV1 在 Apple 生态的覆盖率极低**，面向消费者的网站视频应始终提供 H.264 fallback
3. **Cloudinary 的 `f_auto` / `vc_h264` 转码**在实际使用中有不确定性，关键视频资产建议手动控制格式
4. **多源 `<source>` 写法**是视频兼容性的最佳实践，让浏览器自己判断而不是猜测用户环境
