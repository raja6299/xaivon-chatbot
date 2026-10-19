# XAIVON CHATBOT V2 — BRANDING, DESIGN SYSTEM & UI/UX QUALITY ASSURANCE

**Document Date:** October 20, 2026  
**Repository:** `raja6299/xaivon-chatbot`  
**Host:** `assistant.xaivon.com`  
**Identity Reference:** `xaivon.com` (Read-only brand source of truth)

---

## 1. Official Brand Identity & Color Palette

The chatbot UI has been harmonized with XAIVON's official visual identity, eliminating legacy generic elements, violet gradients (`#7c3aed`), and plain typographic letters.

### 1.1 Color Tokens
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| **Copper Primary** | `#C4704B` | Primary interactive accents, active tabs, buttons, brand marks |
| **Copper Hover** | `#B3623E` | Hover states, active pressed states |
| **Copper Accent Light** | `#E59873` | Highlights, subtle gradients, focus borders |
| **Deep Charcoal Dark** | `#0C0E12` | Dark mode background canvas |
| **Panel Surface Dark** | `#13161C` | Card and modal surfaces |
| **Warm Ivory Light** | `#FDFBF7` | Light mode background canvas |
| **Panel Surface Light** | `#FFFFFF` | Light mode card surfaces |

### 1.2 Official Geometric Brand Mark
- **Vector Component:** `components/brand/XaivonLogo.tsx` renders the exact geometric angular polygon geometry extracted from `xaivon.com/favicon.svg`.
- **Favicon & Icons:**
  - `public/favicon.svg`: Vector SVG favicon with copper gradient styling.
  - `app/icon.tsx`: Dynamically generates the 32x32 geometric brand mark in copper tones (replacing the former violet gradient).
  - `public/logo.png`: High-resolution 512x512 PNG asset generated with `sharp` to prevent 404s when referenced by search engines and structured data.
  - `public/og-image.png`: 1200x630 OpenGraph social preview asset.

---

## 2. Structural & Layout Improvements

### 2.1 Elimination of Duplicate Chat Launcher
- **Defect:** `app/page.tsx` rendered the full inline `<ChatWindow>`, while global `app/layout.tsx` rendered `<ChatWidget>`, resulting in an awkward floating widget overlapping the bottom of the home page.
- **Remediation:** Added `'/'` to `HIDDEN_ROUTES` in `components/chat/ChatWidget.tsx`. The standalone home page now features strictly one primary consultant window, while preserving the floating launcher on routes that require one.

### 2.2 Viewport & Responsive Design Matrix
The layout was verified across standard screen breakpoints:
- **320px–390px (Mobile Portrait):** Full-bleed composer, touch-optimized suggestion pills, accessible touch targets (min 44px).
- **768px (Tablet):** Compact layout, modal overlays with responsive dismiss controls.
- **1366×768 (Standard Laptop):** Full two-column view displays the editorial value proposition on the left and the active consultant window on the right within the initial viewport fold without clipping the input composer.
- **1440px–1920px (Desktop / Ultrawide):** Centered max-width container with subtle dark glassmorphic borders.

### 2.3 Accessibility & Interaction Standards
- **Keyboard Navigation:** Full tab order through suggestion pills, composer textarea, file upload button, voice button, send button, and action controls.
- **Escape Key:** Modals (Lead Capture, Calendar, Settings) dismiss cleanly on `Escape`.
- **Screen Reader Support:** ARIA attributes (`aria-label`, `role="dialog"`, `aria-live="polite"`) applied to message lists and status indicators.
- **Reduced Motion:** CSS animations respect `@media (prefers-reduced-motion: reduce)`.
