# Viven Water — Designer 样式规范

> 基准：`1rem = 16px`，`1pt = 1.333px`

---

## 换算参考表

| px | rem | pt |
|----|-----|----|
| 9 | 0.5625rem | 6.75pt |
| 10 | 0.625rem | 7.5pt |
| 11 | 0.6875rem | 8.25pt |
| 12 | 0.75rem | 9pt |
| 13 | 0.8125rem | 9.75pt |
| 14 | 0.875rem | 10.5pt |
| 15 | 0.9375rem | 11.25pt |
| 16 | 1rem | 12pt |
| 17 | 1.0625rem | 12.75pt |
| 18 | 1.125rem | 13.5pt |
| 20 | 1.25rem | 15pt |
| 24 | 1.5rem | 18pt |
| 30 | 1.875rem | 22.5pt |
| 36 | 2.25rem | 27pt |
| 48 | 3rem | 36pt |
| 60 | 3.75rem | 45pt |
| 72 | 4.5rem | 54pt |
| 88 | 5.5rem | 66pt |
| 96 | 6rem | 72pt |
| 112 | 7rem | 84pt |

---

## 颜色系统

| 用途 | HEX |
|------|-----|
| 主橙色（CTA / 强调） | `#f2663b` |
| 深棕（主文字） | `#2A2422` |
| 中棕（次要文字） | `#5C5552` |
| 背景米白 | `#FCFBF9` |
| 石墨灰文字 | `text-stone-500` |
| 石墨灰辅助 | `text-stone-700` |

---

## 字体

| 用途 | 字体 |
|------|------|
| 主字体 | TT Commons Pro（本地）|
| Mono / Label | font-mono（系统等宽）|

---

## 组件样式

### Label（全局小标签）
- 字体：`font-mono`
- 大小：`15px`（0.9375rem / 11.25pt）
- 样式：`uppercase` · `font-semibold` · `tracking-[0.25em]`
- 默认色：`#5C5552` · 强调色：`#f2663b`

---

### Hero 标题（h1）

#### "You deserve"
| 断点 | class | px | rem | pt |
|------|-------|----|-----|----|
| 默认（手机） | `text-5xl` | 48px | 3rem | 36pt |
| md ≥768px | `text-6xl` | 60px | 3.75rem | 45pt |
| lg ≥1024px | `text-7xl` | 72px | 4.5rem | 54pt |
| xl ≥1280px | `text-[5.5rem]` | 88px | 5.5rem | 66pt |

- 样式：`font-semibold` · `tracking-tighter` · `leading-[1] md:leading-[0.95]` · `text-white`

#### "better water."（橙色 span）
| 断点 | class | px | rem | pt |
|------|-------|----|-----|----|
| 默认（手机） | `text-6xl` | 60px | 3.75rem | 45pt |
| md | `text-7xl` | 72px | 4.5rem | 54pt |
| lg | `text-[5.5rem]` | 88px | 5.5rem | 66pt |
| xl | `text-[7rem]` | 112px | 7rem | 84pt |

- 颜色：`#f2663b`

---

### Hero 描述文字
- 大小：`text-lg`（18px）/ `md:text-xl`（20px）
- 样式：`font-normal` · `text-white` · `leading-relaxed`
- 段落间距：`mt-[0.5em]`

---

### Problem Section 大标题（h2）
- 大小：`text-3xl`（30px）/ `md:text-4xl`（36px）/ `lg:text-5xl`（48px）
- 最大宽度：`max-w-6xl`（72rem）
- 样式：`font-semibold` · `tracking-tighter` · `leading-[1.35]` · `text-[#2A2422]`

### Problem Section 副标题（小字）
- 大小：`text-sm`（14px）/ `md:text-base`（16px）
- 样式：`font-semibold` · `text-stone-500`

---

### 水滴区域 — 旁边标签（Pharmaceuticals 等）

| 状态 | 手机 | 桌面 | 字重 |
|------|------|------|------|
| 默认 | 15px | 17px | semibold |
| Hover | 18px | 20px | bold |

- 样式：`uppercase` · `tracking-[0.1em] md:tracking-[0.15em]` · `transition-all duration-500`

### 水滴区域 — 内部卡片

| 元素 | 手机 | 桌面 | 字重 |
|------|------|------|------|
| 数字（value） | `text-6xl` / 60px | `text-7xl` / 72px | light |
| 小标题（consequence） | `text-lg` / 18px | `text-xl` / 20px | bold |
| 详情（details） | 11px | `text-sm` / 14px | medium |

- 数字颜色：`#f2663b`
- 小标题颜色：`#2A2422`
- 详情颜色：`text-stone-700`

---

### 水滴浮动动画
- 位移：`y: -4px`
- 周期：`3s`
- Easing：`sine.inOut`
- 模式：`yoyo · repeat: -1`

---

### AnatomyFeature（解剖图旁文字）

| 元素 | 手机 | 桌面 | 字重 |
|------|------|------|------|
| title | 11px | `text-xs` / 12px | bold · uppercase |
| desc | 10px | 11px | medium |

---

### 导航栏
- 大小：`text-[11px]`（11px）
- 样式：`font-bold` · `uppercase` · `tracking-[0.15em]`
- 默认色：`text-white/90`（深色背景）/ `text-[#5C5552]`（滚动后）
- Hover 色：`#f2663b`

---

### Tailwind 断点参考

| prefix | 触发宽度 |
|--------|---------|
| 无 | 0px（手机）|
| `sm:` | ≥ 640px |
| `md:` | ≥ 768px |
| `lg:` | ≥ 1024px |
| `xl:` | ≥ 1280px |
| `2xl:` | ≥ 1536px |
