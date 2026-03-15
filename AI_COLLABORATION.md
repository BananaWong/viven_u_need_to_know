# AI-to-AI Collaboration & Handover Log

> **Note to Claude/Cursor/Other Agents:** This file tracks the architectural evolution and specific "Vibe Coding" optimizations made by previous agents. Please update this log after significant refactors.

## 🤖 Current Agent Context (March 15, 2026)
**Last Agent:** Claude Sonnet 4.6 (via Claude Code CLI)
**Project State:** **DATACHECK FEATURE — BACKEND COMPLETE, FRONTEND PENDING.**

---

### 🔍 Recent Updates (March 15, 2026) — DataCheck Water Quality Feature

#### Overview
A new major feature is in progress: **DataCheck** (`/datacheck/:zip`), a real water quality report page powered by EPA data. The product strategy is: show users the real contaminants in their local tap water → sell Viven as the solution.

The reference/inspiration is [EWG Tap Water Database](https://www.ewg.org/tapwater/). The key persuasion mechanic is the two-tier standard:
- **EPA legal limit** — what's legally allowed (lenient)
- **EWG health guideline** — what science says is safe (much stricter, often 10–2500× tighter)

Showing users their water is "legal but not safe" is the core hook.

---

#### Architecture Decision: Static JSON (not a live API)

After evaluating Flask, Bun/Hono, and pre-generation, the team chose **pre-generated static JSON files served by Nginx** on the VPS. Rationale:

- EPA data only updates quarterly — no need for a live server
- ~20,608 unique ZIP codes → ~20,608 JSON files (compact, ~1–5 KB each)
- Nginx serving static files is the fastest possible option (<5ms)
- Zero runtime dependencies, zero crash risk, zero maintenance overhead
- Quarterly update = run one Python script, rsync files, done

**Frontend fetch:**
```js
fetch(`https://api.vivenwater.com/reports/${zip}.json`)
```

---

#### Data Sources
- **SQLite database** (`ca-water-quality/data/water_quality.db`, 381 MB) — lives at `C:\Users\banan\Desktop\ca-water-quality\data\` locally, on the VPS at `/var/www/vivenwater/ca-water-quality/data/`
- **EPA SDWA violations** — 1.18M records, updates quarterly via `quick_update.py`
- **UCMR5 PFAS** — 1.82M records, 2023–2025 monitoring cycle, near-complete
- **EWG standards** — 116 contaminants, scraped from EWG website, stored in `backend/src/ewg_standards.py`

> ⚠️ **Key limitation:** EPA violations records tell you a limit was exceeded, but NOT by how much. Only PFAS (UCMR5) data has actual measured concentrations (ppt). So EWG multiplier comparisons (e.g., "133× above EWG limit") only work for PFAS contaminants. For regular EPA violations, we can only show "this contaminant violated EPA standards" + the EWG reference limit for context.

---

#### Files Created (all in `../backend/` relative to this file)

```
vivenwater_website/designer/
├── backend/
│   ├── generate.py              ← Main script: reads SQLite → writes JSON files
│   ├── update_and_generate.sh   ← Cron script for quarterly auto-update
│   ├── nginx.conf               ← Nginx config for api.vivenwater.com
│   ├── requirements.txt         ← Python deps (sqlite3 is stdlib, no pip needed)
│   └── src/
│       └── ewg_standards.py     ← 116 EWG contaminant standards (data only)
└── DATACHECK_SPEC.md            ← Full design spec with wireframes & visual rules
```

The `backend/src/app.py` and `backend/src/water_lookup.py` are legacy Flask files (copied over for reference). They are **not used** in the final architecture and can be ignored.

---

#### JSON Output Format (per ZIP)

Each file at `reports/{zipcode}.json` looks like:

```json
{
  "zip": "90210",
  "found": true,
  "generated_at": "2026-03-15",
  "system": {
    "pwsid": "CA1910087",
    "name": "Beverly Hills City Water",
    "city": "Beverly Hills",
    "state": "CA",
    "population": 34000,
    "connections": 12000,
    "source_type": "Surface Water"
  },
  "risk_level": "HIGH",
  "summary": {
    "ewg_exceedances": 3,
    "pfas_detected": 7,
    "pfas_total_tested": 29,
    "epa_health_violations": 1
  },
  "contaminants": [
    {
      "name": "PFOA",
      "type": "pfas",
      "value": 12.0,
      "unit": "ppt",
      "exceeds_epa": true,
      "exceeds_ewg": true,
      "epa_limit_str": "4 ppt",
      "ewg_limit_str": "0.09 ppt",
      "ewg_multiplier": 133,
      "health_effects": "Harm to the immune system; harm to fetal growth and child development"
    }
  ],
  "violations": [
    {
      "contaminant_code": "1040",
      "contaminant_name": "Nitrate",
      "status": "Resolved",
      "begin_date": "01/15/2022",
      "end_date": "03/20/2022",
      "is_major": false,
      "ewg_limit_str": "0.14 ppm",
      "health_effects": "Cancer; harm to fetal growth and child development"
    }
  ]
}
```

If `found: false`, the file only contains `{ "zip": "...", "found": false }`.

---

#### Risk Level Logic

| Level | Triggers |
|-------|----------|
| `HIGH` | Open EPA health violation, OR any PFAS exceeds EPA limit, OR any contaminant ≥50× EWG limit |
| `MODERATE` | 3+ PFAS detected, OR 2+ health violations, OR 3+ EWG exceedances |
| `LOW` | Any PFAS detected or any EWG exceedance |
| `MINIMAL` | No violations, no PFAS, no EWG exceedances |

---

#### Frontend Work Still Needed

**Status: NOT STARTED**

Three things need to be done in `designer/src/`:

**1. `App.jsx` — add route** (2 lines)
```jsx
import DataCheckPage from './pages/DataCheckPage';
<Route path="/datacheck/:zip" element={<DataCheckPage />} />
```
`react-router-dom` is already installed and configured. No new deps needed.

**2. `components/Sections/IntegratedScanner.jsx` — rewrite**

Currently 100% fake (hardcoded results, fake progress bar). Needs to:
- On submit: fetch `https://api.vivenwater.com/reports/${zip}.json`
- If `found: true` → `navigate('/datacheck/' + zip)`
- If `found: false` → show inline error ("No data found for this ZIP")
- Keep the existing scan animation while the fetch is in-flight
- Use env var: `const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vivenwater.com'`

Add to `.env.development`: `VITE_API_URL=http://localhost:8080` (or wherever you serve the JSON locally for testing).

**3. `pages/DataCheckPage.jsx` — build from scratch**

Full design spec is in `../DATACHECK_SPEC.md`. Summary of page sections (top → bottom):

| Section | Background | Content |
|---------|-----------|---------|
| Header | reuse existing | — |
| Hero band | `#1C1917` dark | "WATER REPORT · ZIP · System name · population · source type" + inline zip re-search input |
| Risk score | `#FCFBF9` cream | 3-col stat cards: risk level badge + ewg_exceedances + pfas_detected + epa_health_violations |
| Contaminants | white | One card per contaminant. Shows value, EWG vs EPA bar comparison, ewg_multiplier badge, health_effects tags |
| PFAS grid | `#F9F5F0` warm | Grid of detected PFAS chips with value + multiplier |
| CTA | `#1C1917` dark | "Viven removes 99.9% of what's in your water" + detected contaminant tags + Reserve CTA button |
| Footer | reuse existing | — |

**Visual rules (match existing Viven design language):**
- Font: DM Sans (already loaded)
- Accent: `#f2663b` / `#d94e24`
- Cards: `bg-white rounded-2xl border border-stone-100 shadow-sm`
- EWG exceedance border: `border-l-4 border-l-[#f2663b]`
- EPA violation border: `border-l-4 border-l-red-500`
- Multiplier badge: `<5× orange`, `5–50× red`, `>50× bg-red-900 text-white`
- Use `RevealOnScroll` from `components/Common/UI.jsx` for scroll animations
- Skeleton loading: Tailwind `animate-pulse` placeholder cards while fetch is in-flight

**Empty states:**
- ZIP not found → "No data found · [← Search again]" + optional email capture
- System found but MINIMAL risk → positive framing + educational Viven CTA

---

#### How to Test Locally (before VPS deploy)

```bash
# 1. Generate JSON for a single ZIP to verify output
cd vivenwater_website/backend
python generate.py --zip 90210 --db "C:/Users/banan/Desktop/ca-water-quality/data/water_quality.db"
# → creates reports/90210.json

# 2. Serve the reports folder locally
cd reports && python -m http.server 8080
# → http://localhost:8080/90210.json

# 3. Set env var in designer/.env.development
VITE_API_URL=http://localhost:8080

# 4. Run the frontend
cd vivenwater_website/designer && npm run dev
```

---

#### VPS Deploy Checklist (when ready)

```
[ ] Run: python generate.py --db /path/to/db --out /var/www/vivenwater/reports
[ ] Copy nginx.conf → /etc/nginx/sites-available/api.vivenwater.com
[ ] Enable: ln -s ... /etc/nginx/sites-enabled/
[ ] SSL: certbot --nginx -d api.vivenwater.com
[ ] Test: curl https://api.vivenwater.com/reports/90210.json
[ ] Set cron: 0 2 1 1,4,7,10 * /var/www/vivenwater/backend/update_and_generate.sh
[ ] Frontend: npm run build → deploy to VPS
```

---

---

### 🔍 Recent Updates (March 15, 2026)

#### 1. Variant Deprecation
- **Biohacker & Tycoon**: Both variants are now officially **deprecated**. 
- **Action**: Removed active synchronization tasks from the roadmap. Existing code/links (like the commented-out switcher in `App.jsx`) are retained for historical context but are no longer maintained.

#### 2. Project Hygiene
- **Root Cleanup**: Deleted legacy/scattered files including `MobileFinishesDemo.jsx`, `compare3.cjs`, `1.png`, and `netlify.toml`.
- **Infrastructure**: Removed Netlify-specific configuration files (`_headers`, `_redirects`, `.netlify/`) following the migration to Hostinger VPS.

---

## 🤖 Previous Agent Context (March 12, 2026)

#### 1. Infrastructure & Cleanup
- **Influencer Hero SaaS Decommissioned**:
    - Removed `clicks.js` and custom domain window variables from `index.html`.
    - Deleted legacy redirect logic in `src/main.jsx` for `/click/`, `/track/`, and `/hero/` paths.
- **Support Removal**: Removed the "Support" mailto link from the global `Footer.jsx`.

#### 2. UI/UX Refinements (Pixel Perfecting)
- **Product Anatomy Section**:
    - Fixed image clipping by introducing a conservative aspect ratio (`0.88/1`) and `object-cover`.
    - Balanced spacing around the "Designed by Product Experts" block to ensure better visual rhythm.
- **Comparison Section**:
    - Scaled up the "Other Faucets" image using `scale-120` for better visual parity.
    - **Synchronized Alignment**: Locked the heights of both product cards' headers and image zones, ensuring the horizontal divider and all benefit rows are perfectly aligned.
    - Removed the interactive magnifying lens from the Viven product image for a cleaner, static presentation.
- **Problem Section (Droplet)**:
    - Balanced the droplet position by increasing top margins.
    - **Typographic Hierarchy**: Implemented a sub-text rendering logic for pollutants. Parenthetical information (e.g., "FOREVER CHEMICALS") is now rendered at `0.9em` with `opacity-80`, maintaining professional clarity without visual noise. Fixed "THMs" term casing.
- **Email Popup**:
    - Tightened card design by reducing corner radius to `rounded-2xl`.
    - Removed the "Insider Access" badge for a more minimalist look.
    - Updated Privacy Policy link to open in a new tab.
    - Adjusted triggers: Now fires after **6 seconds** or when the user scrolls near the second section (`#problem`).
- **Reserve CTA Section**:
    - Re-aligned the right-side product image to be vertically centered with the left-side copy.
    - Increased image scale to `1.25` and fixed badge positioning.

#### 3. Content Updates
- **Team Info**: 
    - Shashank Varma: Title updated to **Founder & CEO**.
    - Ling Weng: Bio refined to: "12 years of experience building kitchen products loved by consumers."

---

## 🤖 Previous Agent Context (March 11, 2026)

#### 1. Analytics & Tracking
- **Google Tag (gtag.js)**: Integrated the Google Tag Manager script (`G-3SZKWLYBQS`) into the `<head>` of `index.html` for comprehensive site tracking.
- **Placement**: Positioned immediately after the charset meta tag to ensure early initialization.
- **GDPR Compliance (Consent Mode)**: 
    - Configured gtag to default to `denied` for both `analytics_storage` and `ad_storage`.
    - Created a new `CookieConsent.jsx` component that gracefully animates in via GSAP.
    - Captures user consent via `localStorage` and dynamically updates the gtag consent state to `granted` only when the user explicitly clicks "Accept All".
- **Influencer Hero Subdomain Fix**:
    - **Explicit Tracking**: Added `window.ih_custom_domain = "brand.vivenwater.com"` to `index.html` to force tracking through the new dedicated subdomain.
    - **JS-Based Redirection (Legacy Support)**: Implemented a robust redirect script in `src/main.jsx`. Any incoming request to paths like `/click/` or `/track/` on the main domain is now automatically forwarded to `https://brand.vivenwater.com` with all query parameters intact. This resolves `ERR_INVALID_RESPONSE` errors and ensures old marketing links remain functional.

#### 2. "Vibe Coding" UI Refinements (Pixel Perfecting)
- **Problem Section (Droplet)**: Mathematically recalculated the Bezier curve coordinates for the 6 pollutant dots, ensuring they perfectly align with the `x` axis of the SVG path arcs (peaks at 25% and 75%). Shifted the internal text container downwards to respect the droplet's lower center of gravity.
- **Comparison Section**: Shrinked overall card sizes for a tighter layout (`max-w-[1200px]`, `p-10`), while scaling up the Viven product image (`scale-115`, `max-w-full`) to establish visual dominance over the "Status Quo" image (`opacity-90`, `max-w-[70%]`). Bolded key conversion keywords.
- **Product Anatomy**: Shifted the NSF logo to the bottom-left of the video. Converted the central hardware image to `object-cover` with an elongated `0.72/1` aspect ratio to fill the container without strange white borders. Compressed vertical padding to pull the CTA button higher up into the visual viewport.
- **Reserve CTA Matrix**: Standardized label heights (`min-h-[40px]`) across the 3-column offer grid to ensure absolute vertical alignment of the core metrics ("First 1000", "$899", "Filter Set"). Added a strikethrough effect (`line-through opacity-60`) to the MSRP value. Bolded keywords in the benefits list.
- **Hero Mobile View**: Zoomed out the mobile fallback background image by changing `bg-cover` to a custom `backgroundSize: '100% auto'` and anchored it to `right center`, ensuring the entire product hardware is visible within the narrow viewport.
- **Email Subscription Popup**: 
    - Created `EmailPopup.jsx` with a premium dark glass aesthetic.
    - **Smart Triggers**: Activates after 10 seconds of dwell time OR upon scrolling 30% down the page.
    - **Supabase Integration**: Connected to the `subscribers` table to capture leads with metadata (source, timestamp).
    - **Persistence**: Uses `localStorage` to suppress the popup for users who have already subscribed or closed the modal.
- **Copy Polish**: Fixed apostrophe direction, refined THMs tooltip text, and corrected "innovation" to "innovative" in the Team bios.

---

## 🤖 Previous Agent Context (March 9, 2026)

#### 1. Conversion & FOMO Strategy
- **ReserveCTASection**: Implemented a high-conversion "Bottom-of-page" CTA section.
    - **Dynamic FOMO**: Added a real-time (mocked) capacity progress bar showing "84% Reserved" to drive urgency.
    - **Specs Matrix**: Integrated an Apple-style 3-column spec grid highlighting the "First 1000" early-bird pricing and "Free Filter Set" bonus ($250 value).
    - **Floating Badge**: Created a GSAP-animated "Save $200" floating badge for the desktop product display.
- **Pricing Logic**: Updated all references to reflect the $899 early-bird price and the $50 (reduced from $95) refundable reservation deposit.

#### 2. Layout & Information Architecture
- **Narrative Reordering**: Swapped the order of `ProblemSection` and `ComparisonSection`. The narrative now flows from identifying the "Tap Water Crisis" (Problem) directly into why Viven is the solution (Product Anatomy/Technology) before hitting the hard comparison.
- **Section Injection**: Inserted the `ReserveCTASection` before the FAQ to ensure a strong conversion point before the informative footer area.

#### 3. Content & Data Enrichment
- **Risk Data Refresh**: Reordered `SYMMETRICAL_RISK_DATA` for better visual balance and added "Pharmaceuticals" as a primary risk factor, reflecting updated marketing priorities.
- **Legal Robustness**: Dramatically expanded `TERMS_OF_SERVICE` and `PRIVACY_POLICY` with comprehensive clauses on arbitration, liability, and data processing. Enhanced legal UI with background styling and specialized typography for readability.

#### 4. UI/UX Refinements
- **TeamSection Alignment**: Standardized logo alignment for the founder bios. Switched to `items-center` for horizontal center-alignment and increased the Kohler logo scale to `1.5` to ensure visual parity with the Apple icon.
- **ProblemSection Mobile Optimization**: 
    - Replaced the static view with a high-end **Horizontal Snap Slider**.
    - **Interactive Pagination**: Added animated dots that track scroll position and allow for click-to-scroll navigation.
    - **Compact Aesthetic**: Tuned card width to `140px` and reduced vertical padding for a minimal, "medical-tech" look that respects the mobile fold.
- **Icon Versatility**: Added "original" color support for Facebook and Instagram icons in `Icons.jsx` to allow for branded social links in the footer.
- **Reveal Sensitivity**: Tuned `RevealOnScroll` in `UI.jsx` with a lower threshold (0.05) and positive rootMargin to trigger animations slightly earlier as users scroll, improving the "fluidity" of the experience.

---

## 🤖 Previous Agent Context (March 8, 2026)
**Last Agent:** Gemini CLI
**Project State:** **LEGAL COMPLIANCE DEPLOYED. MOBILE HERO FOLD-OPTIMIZED. DATA.JSX NORMALIZED.**

---

### 🔍 Recent Updates (March 8, 2026)

#### 1. Legal Compliance & Routing
- **TOS & Privacy**: Implemented dedicated `/terms` and `/privacy` pages. Used a structured `LegalPage.jsx` template with specialized typography styles for legal readability.
- **Dynamic Content**: Moved official legal texts (Version 1.0, June 2025) into `data.jsx`. Added anchor-link navigation for the Privacy Policy table of contents.

#### 2. Mobile UX & Performance (Hero Pass)
- **Fold Optimization**: Reconfigured mobile Hero to fit within `100dvh`. Compressed vertical margins and scaled font sizes to achieve a "one-screen" display, ensuring CTA buttons are visible without scrolling.
- **Image Fallback**: Replaced heavy Hero video with a high-quality `.webp` image (`backend_ehibwe.webp`) on mobile devices to improve LCP and initial load perception.
- **Visual Balance**: Adjusted the relationship between the description block and CTAs, providing more breathing room while shifting content upwards.

#### 3. Architecture & Reliability
- **JSX Normalization**: Renamed `constants/data.js` to `data.jsx` to correctly support JSX nodes within the data layer. Updated all component imports to explicitly include the `.jsx` extension, eliminating Vite resolution errors after file renaming.
- **Clean Deployment**: Hidden the "Hero Lab" customization panel for the current production-ready build.

---

### 🔍 Previous Updates (March 7, 2026)

#### 1. Hero Layout Lab v2.1
- **Three-Block Fluidity**: Implemented a dynamic customization panel that allows users to swap the order and visual hierarchy of H1 (Protect), H2 (Tap), and H3 (Description). 
- **Live PX Tuning**: Added real-time font-size sliders (Range: 32px-140px for large, 14px-60px for small). This allows the client to test exact pixel values for headings on both mobile and desktop.
- **Animation Sync**: Integrated a `key`-driven re-render strategy that automatically resets GSAP and SplitType animations whenever the layout or font sizes change, providing immediate high-fidelity feedback.

#### 2. Science Page "Conservative" Refactor
- **Aesthetic Pivot**: Shifted from "Laboratory Precision" (high visual noise) to a "Conservative Medical-Tech" look. 
- **Layout Simplification**: Removed background grid overlays and complex technical mono-font labels. Switched from hover-expand benefit cards to a clean, static, whitepaper-style card layout for better information density and accessibility.
- **Typographic Regularization**: Reduced headline sizes and optimized leading for a more understated, trustworthy brand voice.

#### 3. Global Spacing & Layout Optimization
- **Breathe Unified**: Standardized section padding to `py-24 lg:py-32` across the entire app to eliminate "cluttered" transitions.
- **Mobile First-Screen Push**: Significantly reduced mobile top padding in `Hero` and `ProblemSection` to pull conversion elements (CTAs, Badges) higher into the initial viewport.
- **Anatomy Section Refinement**: Re-aligned all feature icons to the left on mobile. Implemented a sequential "Cascade" GSAP animation (`x: -30` slide-in) for the mobile feature list.

#### 4. Comparison & Data Integrity
- **Marker Uniformity**: Unified the visual weight of non-Viven table markers. All competitor checks, crosses, and hyphens now use `text-black` with a consistent `strokeWidth: 2.5`.
- **Terminology Sync**: Standardized "Renter-friendly: 5-minute, 1-tool installation" across `ComparisonSection` and `Footer`. Removed the strikethrough "anyone can do" per client request for a cleaner message.

#### 5. Technical Tracking & Infrastructure
- **Analytics Ready**: Injected the Influencer Hero clicks tracking script into `index.html` using a `defer` strategy.
- **Direct Payment Routing**: Updated all core Footer CTAs to link directly to the **Stripe Checkout** page for frictionless conversion.
- **Video Autoplay Patch**: Added `videoRef` manual play triggers in `ProductAnatomySection` to bypass aggressive mobile browser autoplay restrictions.

---

### 🔍 Recent Updates (March 6, 2026)

#### 1. Science & Research Overhaul
- **Molecular Innovation Page**: Launched a dedicated `/science` page using a "Laboratory Precision" aesthetic. Features high-contrast monochrome design, technical grids, and GSAP-driven staggered reveals.
- **Buttery-Smooth Accordion**: Refactored the Benefits data-grid to use pure CSS `grid-template-rows: 0fr -> 1fr` for a high-end, 60fps expandable card interaction that elegantly pushes content up on hover without layout jitter.
- **Scientific Integrity**: Verified and integrated 100% real, peer-reviewed research (Nature Medicine, J Strength Cond Res, MDPI 2024) with actual DOI references, replacing all placeholder citations.
- **Technical Visuals**: Replaced "consumer-friendly" capsule tags and colorful icons with hair-thin lines, technical matrices, and medical-grade data visualizations to reinforce high-tech positioning.

#### 2. Global Navigation & Routing
- **SPA Routing**: Migrated the app to `react-router-dom` for seamless multi-page transitions. 
- **Smart Anchors**: Implemented conditional routing in Header/Footer. If a user is on the Science page, hash links (e.g., `#problem`) automatically redirect back to the home page's respective section.
- **Navigation UX**: Fixed "white-on-white" visibility issues. The Header now dynamically detects light backgrounds (like on the Science page) and switches to dark text/logo contrast even before scrolling.

#### 3. Footer Connectivity & Contact
- **Enhanced Reach**: Added Mail (shashank@vivenwater.com), Facebook, Instagram, and "Call us" contact channels.
- **Visual Cleanup**: Moved social links to the absolute bottom of the page. Reduced font-weight from `bold` to `medium` for a more sophisticated, understated finish. Changed company name to **Viven, Inc.**

#### 4. Deployment Optimization
- **Netlify SPA Fix**: Added `_redirects` configuration in the `public/` directory to prevent 404 errors on direct sub-page refreshes.

---

### 🚨 Critical Lessons: UX & Motion
1. **Dynamic Re-renders**: Using a combined state key (e.g., `${order.join('-')}-${largeFontSize}`) is the most reliable way to ensure GSAP and third-party libraries like SplitType re-calculate their targets after a React state change.
2. **Mobile Context Switch**: In list-heavy sections like `ProductAnatomy`, switching from a 2-column "side-in" layout to a single-column "cascade" layout on mobile significantly improves the visual rhythm.
3. **Autoplay Resilience**: Never rely solely on the `autoPlay` attribute for critical background videos; always pair with a `useEffect` manual `.play()` call.

---

### 🛠️ Architecture & Progress
1.  **Hero Lab**: Customization engine fully functional.
2.  **Science Page**: Conservative refactor complete.
3.  **Checkout Flow**: Stripe direct-link integrated.
4.  **Static Validation**: `npm run build` and `npm run lint` checked and passed.

---

### 🚀 Future Roadmap
-   **Variant Maintenance (Paused)**: `biohacker` and `tycoon` variants are deprecated. No further parity syncs required unless requested.
-   **Mobile Performance**: Audit GSAP ScrollTrigger performance on low-end mobile devices for the new transition sequences.
-   **Accessibility Pass**: Continue adding ARIA roles to new components.
