---
name: Precision Enterprise Intelligence
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#46566c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6e85'
  on-tertiary-container: '#e9f0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  transcript-text:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  timestamp:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  sidebar-width: 280px
  content-max-width: 1200px
---

## Brand & Style
The design system is engineered for high-stakes enterprise environments where clarity and speed of information processing are paramount. The brand personality is authoritative yet invisible—acting as a silent facilitator for executive decision-making and project management.

The aesthetic follows a **High-Utility Minimalism** approach. It rejects decorative trends like glassmorphism or neomorphism in favor of a rigorous, grid-based structure. The goal is to reduce cognitive load by using a "Content-First" hierarchy where UI chrome is minimized and data is prioritized. Visual interest is derived from precise alignment, rhythmic spacing, and purposeful typography rather than ornamentation.

## Colors
The palette is rooted in professional stability and high-contrast legibility. 

- **Primary (Electric Blue):** Reserved strictly for primary calls to action, active states, and focus indicators. It provides a sharp "signal" in a sea of neutral content.
- **Secondary (Deep Charcoal/Navy):** Used for global navigation, sidebars, and primary headings to provide a solid structural anchor.
- **Tertiary (Slate):** Applied to metadata, timestamps, and secondary icons to create a clear visual step-down from primary content.
- **Neutral (Slate 50/100):** Provides the canvas. Backgrounds are kept crisp white (`#FFFFFF`) for the content area, with subtle off-white tones used to differentiate the workspace sidebar from the main stage.

Semantic colors (Success, Warning, Error) must be used sparingly and always accompanied by icons to ensure accessibility in data-heavy transcripts.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic weight distribution. A secondary font, **Geist**, is introduced for technical metadata such as timestamps, durations, and code snippets, providing a precise, "engineered" feel to the data.

**Hierarchy Rules:**
- **Transcripts:** Use `transcript-text` with a slightly increased line-height (26px) to improve readability during long-form reading.
- **Scanning:** Use `label-mono` for tags (e.g., "DECISION", "ACTION ITEM") to allow users to quickly parse the meeting flow.
- **Contrast:** Ensure a significant weight jump between body text and headers to maintain a clear document structure.

## Layout & Spacing
The layout employs a **Fixed-Fluid Hybrid** model. The sidebar is fixed at 280px to provide a consistent navigation anchor, while the main content area is fluid up to a maximum width of 1200px to maintain optimal line lengths for reading transcripts.

**Rhythm:**
- A **4px baseline grid** governs all component spacing.
- **8px (small), 16px (medium), and 32px (large)** are the primary increments for internal padding and vertical stack spacing.
- **Section Breaks:** Use 48px or 64px to separate distinct meeting segments or visual modules.

**Breakpoints:**
- **Desktop (1280px+):** Full sidebar visibility, multi-pane view (Transcript + Insights).
- **Tablet (768px - 1279px):** Sidebar collapses to icons or hidden drawer; single-column focus.
- **Mobile (<768px):** Stacked layout. Actions move to a bottom sticky bar for thumb-accessibility.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than shadows. 

- **Surface 0 (Background):** Slate 50 (`#F8FAFC`) or White (`#FFFFFF`).
- **Surface 1 (Cards/Panels):** Pure White with a 1px border of Slate 200 (`#E2E8F0`).
- **Surface 2 (Popovers/Modals):** Pure White with a slightly darker 1px border and a very subtle, diffused 4px blur shadow (only for modals to separate them from the workspace).

Avoid all heavy drop shadows. Interactive elements should indicate depth through color shifts (e.g., a button becoming 5% darker on hover) rather than "lifting" off the page.

## Shapes
The design system uses a **Soft (0.25rem)** roundedness profile to maintain a professional, architectural feel. 

- **Standard Elements:** 4px (Buttons, Inputs, Small Cards).
- **Large Containers:** 8px (Main content panels, Modals).
- **Interactive States:** Focus rings should follow the element's radius with a 2px offset.

This subtle rounding prevents the UI from feeling "aggressive" (sharp corners) or "consumer-casual" (pill shapes), striking a balance suitable for enterprise software.

## Components
- **Buttons:** Rectangular with 4px radius. Primary buttons use solid Electric Blue with white text. Secondary buttons use a Slate 200 border with Slate 900 text.
- **Inputs:** 1px Slate 200 border. On focus, the border changes to Electric Blue with a subtle 2px blue "halo" (outer stroke). Labels are always persistent above the field.
- **Chips/Badges:** Small, 2px radius, using tinted backgrounds (e.g., light green for "Completed") and dark text. Used for meeting tags and speaker identification.
- **Transcript Lines:** Hover states on transcript rows reveal "Copy Link" and "Create Task" shortcuts to minimize persistent visual noise.
- **Cards:** No shadows. Defined by a 1px `#E2E8F0` border. Headlines within cards use `headline-md`.
- **Data Tables:** Minimalist. No vertical lines, only 1px horizontal dividers. Header rows use `label-mono` for clear distinction.