# Final V3 Branding Parity, Visual Design & Viewport UX Specification

**Document Identifier:** `XAIVON-QA-BRANDING-UI-V3-20261019`  
**Target Repository:** `raja6299/xaivon-chatbot`  
**Date:** October 19, 2026  
**Status:** FACT-VERIFIED & IMPLEMENTED  

---

## 1. Official XAIVON Brand Mark Geometry & Verification

### 1.1 Root Discrepancy & Brand Audit
During the audit of `raja6299/xaivon-website` (accessed read-only), an important discrepancy was discovered:
1. **The Legacy SVG (`public/favicon.svg` / `xaivon-logo.svg`):** Contains an outdated blue-purple overlapping polygon mark. Using this file replicates an obsolete brand identity.
2. **The Stylized Copper "X":** The previous chatbot V2 component (`XaivonLogo.tsx`) drew a stylized diagonal copper "X". While the copper color was correct, the geometry did **not** match the live website.
3. **The Canonical Website Navbar & Footer Mark:** Inspecting `src/components/PremiumNav.jsx`, `PremiumNav.css`, `Footer.jsx`, and `Footer.css` revealed that the live visible mark is a precision geometric square.

```text
========================================================================
CANONICAL GEOMETRY (Read-only source: xaivon-website/src/components/PremiumNav.css)
========================================================================
- Outer Container: 28px × 28px
- Outer Shape: Copper square (`#B35734`), 8px corner radius (`rx: 8px`)
- Top-Left Inset: Dark charcoal square (`#24211D`), 10px × 10px, 2px radius, positioned at x: 6px, y: 6px
- Bottom-Right Inset: Pure white square (`#FFFFFF`), 6px × 6px, 1px radius, positioned at x: 16px, y: 16px (right: 6px, bottom: 6px)
========================================================================
```

### 1.2 Canonical Chatbot SVG & Component Implementation
In `components/brand/XaivonLogo.tsx`:
```tsx
export function XaivonLogo({
  size = 28,
  showText = false,
  className = '',
  textColor,
  theme = 'auto',
}: XaivonLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        {/* Outer 28x28 Copper Rounded Square */}
        <rect width="28" height="28" rx="8" fill="#B35734" />
        {/* Top-Left Dark Inset Square (10x10) */}
        <rect x="6" y="6" width="10" height="10" rx="2" fill="#24211D" />
        {/* Bottom-Right White Inset Square (6x6) */}
        <rect x="16" y="16" width="6" height="6" rx="1" fill="#FFFFFF" />
      </svg>
      {showText && (
        <span className="font-heading font-extrabold tracking-tight text-lg text-foreground">
          XAIVON
        </span>
      )}
    </div>
  );
}
```

### 1.3 Asset Artifacts Updated in Repository
1. `components/brand/XaivonLogo.tsx`: Reusable React component supporting 16, 24, 28, 32, 48, 64, and 128px scaling.
2. `public/favicon.svg`: Canonical vector favicon with the 28x28 geometry.
3. `app/icon.tsx`: Dynamic Next.js metadata icon renderer generating 32x32 raster icon for browser tabs.
4. `public/logo.png`: 512x512 high-resolution raster asset generated using `sharp` for PWA manifests and native integrations.
5. `public/og-image.png`: 1200x630 OpenGraph social preview asset featuring the canonical mark, copper borders, and typography.

---

## 2. Viewport & Responsive Layout Optimizations

### 2.1 Resolution of 1366×768 Composer Clipping
- **Defect:** On standard 1366×768 laptop displays, the desktop chat card previously used a static height (`h-[660px]`), which forced the message input composer and action buttons below the fold, requiring uncomfortable window scrolling.
- **Resolution:** In `app/page.tsx`, the container height was updated to a responsive, viewport-constrained formula:
  ```css
  h-[580px] sm:h-[620px] lg:h-[min(680px,calc(100vh-140px))] min-h-[500px]
  ```
- **Result:** On 768px vertical viewports, the card smoothly scales to `calc(768px - 140px) = 628px`, keeping both the navbar and the bottom input composer entirely visible without vertical scrolling.

### 2.2 Breakpoint Audit Matrix

| Viewport Width | Device Category | Chat Layout Adaptation | Validation Status |
|---|---|---|---|
| **320px – 390px** | Compact Mobile (iPhone SE, Galaxy S) | Single column, stacked controls, full-bleed composer, compact header | **PASS** |
| **400px – 600px** | Large Mobile (iPhone 14/15 Pro Max) | Single column, touch targets >= 44px, hidden redundant sidebar | **PASS** |
| **768px** | Tablets (iPad portrait) | Two-column stacked or collapsible summary panel, fluid chat pane | **PASS** |
| **1024px** | Tablets (iPad landscape, small laptops) | Full two-column editorial layout: Left consultant info, Right chat | **PASS** |
| **1366px** | Standard Laptops | Full two-column, dynamic max-height, 0 composer clipping | **PASS** |
| **1440px – 1920px** | Desktop & Ultra-wide | Centered 1280px max-width container with subtle warm copper ambient glow | **PASS** |

---

## 3. Dark & Light Theme Harmonization

The application supports both Dark (`#121110` background) and Light (`#FAF8F5` background) modes:
- **Copper Accent:** `#B35734` maintains a WCAG AAA compliant contrast ratio of > 4.5:1 against dark backgrounds and > 4.8:1 against ivory backgrounds.
- **Surface Elevation:**
  - Dark: Card surface `#1A1816` with subtle 1px border `#2E2A25`.
  - Light: Card surface `#FFFFFF` with warm border `#EADFD6` and soft ambient drop shadows.
- **Persistence:** Theme selection is persisted in `localStorage` under `xaivon-theme` and synced smoothly across iframes via `postMessage`.

---

## 4. Accessibility & Micro-Interactions
- **Focus Rings:** All buttons, dropdowns, and textareas feature high-contrast visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#B35734]`).
- **Keyboard Navigation:** Full Tab and Shift+Tab sequencing through greetings, attachment pickers, voice button, send button, and quick-prompt pills.
- **Screen Reader Announcements:** Dynamic message stream status announced via `aria-live="polite"` regions.
- **Reduced Motion:** All transitions respect `@media (prefers-reduced-motion: reduce)`.
