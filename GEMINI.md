# Viven Water — Project Context & AI Coding Guide

## 🚨 MANDATORY EXECUTION PROTOCOL (REDLINE)
**Every AI agent MUST perform these checks BEFORE concluding a task:**
1.  **Static Validation**: Run `npm run build` and `npm run lint`. Ensure zero errors in `src/`.
2.  **Zero-Loss Content Check**: If refactoring components, verify that data (Team members, copy, lists) matches the source 100%. **NO PLACEHOLDERS ALLOWED.**
3.  **Visual Integrity**: 
    - **Logo Parity**: In TeamSection, always use `items-center` and custom `scale` (e.g., Kohler 1.5x) to ensure horizontal visual balance between different brand logos.
    - **Mobile Sliders**: Interactive horizontal sliders (ProblemSection) must include pagination dots and `snap-center` behavior.
4.  **String Safety**: Always use backticks (`` ` ``) in `data.jsx`.
5.  **Git Sanitization**: Never commit large binaries (.pdf) or backup folders unless explicitly requested.
6.  **Shell Commands**: **DO NOT USE `&&`** to chain commands. This is a win32 environment; run commands sequentially in separate calls.
7.  **Git & README**: 
    - Always document progress incrementally in the `README.md` when requested (incremental updates for each set of changes).
    - Commit messages must be concise and **MUST NOT** include any "Gemini" or AI-agent signatures.
    - Synchronize code to: `https://github.com/BananaWong/viven_u_need_to_know.git`.

---

> **Note for AI Agents:** This project follows a strict "Vibe Coding" optimization strategy. Adhere to the established aesthetics and structural guidelines at all times.

## 1. Project Overview
A high-end, immersive landing page for Viven Water. 
- **Tech Stack:** React 19, Vite 7, Tailwind CSS 3.4, GSAP (Animations), Supabase (Backend).
- **Core Aesthetic:** Minimalist, premium, medical-tech professional.

## 2. File Structure
- `src/App.jsx`: The "Mission Control". Contains all section components and layout logic. Keep this file small and clean.
- `src/components/Icons.jsx`: Centralized SVG library. Access via `<Icons.Name />`.
- `src/constants/data.jsx`: The "Brain". Contains all text, video URLs, and configuration arrays (Risk data, Calendar events, Finishes).
- `STYLE_SPEC.md`: Foundational design system (colors, spacing, typography).

## 3. Visual & Styling Rules (Do Not Break)
- **Aspect Ratio Locking:** The `FamilyCalendarSection` uses a parent container with `aspect-ratio: 2.27 / 1` (on desktop) to perfectly fit a 320px sidebar + a 16:9 full-bleed video. Do NOT use fixed heights here.
- **Typography:**
  - Primary Font: **TT Commons Pro** (Sans).
  - Label/Mono Font: **TT Commons Pro Mono** (Real monospace variant).
  - Tailwind Config: `font-sans` and `font-mono` are explicitly mapped to these local families.
- **Video Display:** Prefer `object-cover` for full-bleed sections. Use `q_auto,f_auto` Cloudinary parameters for all video URLs.

## 4. Coding Standards & AI Guidelines
- **Data Updates:** Modify `src/constants/data.jsx` ONLY when asked to change content (text, videos, schedule). Do not inline data back into `App.jsx`.
- **Terminology:** "Build" (建构) specifically means generating static production files (e.g., `npm run build`). Do NOT create ZIP archives unless the user explicitly asks for a compressed package.
- **String Syntax:** In `data.jsx`, **always use backticks (`` ` ``)** for strings to avoid syntax errors with apostrophes.
- **Hidden Components:** The `ConvenienceSection` (comparison slider) is currently commented out in `App.jsx`. **DO NOT DELETE IT.** It is kept for future marketing phases.
- **GSAP Animations:** Animations are scoped via the `useGSAP` hook and `useRef`. If DOM elements are moved or HTML tags are changed (e.g., `<p>` to `<h2>`), you **MUST** update the corresponding GSAP `scrollTrigger` selectors.
- **Tailwind Grid & Layout:** For complex matrices (like the Market Comparison table), DO NOT mix arbitrary `col-span` values in odd-numbered grids. Always use a highly divisible system like `grid-cols-12` for precise widths. Use `whitespace-pre-line` and explicit `\n` in strings for controlled wrapping in tight grid columns.
- **Icon Rendering:** Before using a new icon (e.g., `<Icons.Box />`), you **MUST** verify it is exported in `src/components/Icons.jsx`. Failing to do so will cause a fatal React crash.

## 5. Deployment & Build
- **Build Command:** `npm run build`
- **Build Output:** `dist/`
- Ensure all new font files are registered in `src/fonts.css` to be included in the Vite bundle.

---
*Last Updated: March 9, 2026*