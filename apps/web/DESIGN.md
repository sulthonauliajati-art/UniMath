---
name: UniMath
description: Platform latihan numerasi gamified — The Arcade Lab
colors:
  neon-cyan: "#00E5FF"
  deep-cyan: "#00B8CC"
  arcade-blue: "#0077FF"
  void-navy: "#040914"
  deep-space: "#0A1128"
  glass-card: "#0A1128"
  white: "#FFFFFF"
  slate-mist: "#94A3B8"
  slate-dusk: "#64748B"
  emerald: "#10B981"
  crimson: "#EF4444"
  amber: "#F59E0B"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Poppins, sans-serif"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.neon-cyan}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.deep-cyan}"
  button-secondary:
    backgroundColor: "{colors.deep-space}"
    textColor: "{colors.neon-cyan}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neon-cyan}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: UniMath

## 1. Overview

**Creative North Star: "The Arcade Lab"**

UniMath exists at the intersection of a precision laboratory and a futuristic arcade. It's where academic rigor meets satisfying game mechanics — a dark, sleek space illuminated by cyan neon, where every interaction delivers tactile, immediate feedback. Students don't just answer questions; they train, level up, and climb — and the interface makes every step feel earned.

The system is **dark by default** — not as a trend, but as a functional choice. Deep navy backgrounds reduce eye strain during long practice sessions. Glass surfaces layered with backdrop-blur create depth without visual weight. Neon cyan (`#00E5FF`) is the single voice of action: it marks what's interactive, what's active, and what's been achieved. Arcade blue (`#0077FF`) is the secondary accent, used only for emphasis and variety in gradients.

This system explicitly rejects: childish cartoon aesthetics, chaotic multi-color game-show palettes, textbook-dense layouts, and generic SaaS white-card dashboards. It's a tool for serious learning that happens to feel incredible to use.

**Key Characteristics:**
- Dark glassmorphism foundation with neon cyan as the sole action accent
- Glow-driven depth: elements float on aura, not shadow
- Tactile, responsive interactions with 150-250ms transitions
- Single geometric sans (Poppins) for headings, single humanist sans (Inter) for body
- Consistent 8px spacing rhythm with generous rounded corners (8px–32px)
- Reduced-motion fallback on every animation

## 2. Colors

The palette is deliberately narrow. One primary accent carries all action; one secondary accent supports it. Neutrals stay cool and deep. Status colors are standard web-semantic (green/red/amber) and never used decoratively.

### Primary
- **Neon Cyan** (`#00E5FF`): The voice of the interface. Used for primary buttons, active states, focus rings, progress indicators, and the glow aura that defines the depth system. Appears on ≤10% of any given screen by area — its rarity is its power.
- **Deep Cyan** (`#00B8CC`): Hover and pressed variant of Neon Cyan. Darker, more grounded, used only in interactive state transitions.

### Secondary
- **Arcade Blue** (`#0077FF`): Gradient partner to Neon Cyan. Used in button gradients and as a secondary glow color for emphasis moments (confetti triggers, achievement unlocks). Never used solo as an interactive accent.

### Neutral
- **Void Navy** (`#040914`): The deepest background. The page body surface. Near-black with a hint of blue depth.
- **Deep Space** (`#0A1128`): Elevated surfaces — cards, sidebars, modal backgrounds. Lighter than Void but still firmly dark.
- **Glass Card** (`rgba(10, 17, 40, 0.65)` with `backdrop-filter: blur(16px)`): Translucent container for the glassmorphism layer. Sits over Void Navy or Deep Space. Never used as a solid — the transparency and blur are the point.
- **White** (`#FFFFFF`): Primary text only. Never used as a background.
- **Slate Mist** (`#94A3B8`): Secondary text — descriptions, meta information, placeholder hints.
- **Slate Dusk** (`#64748B`): Muted text — disabled states, tertiary labels, timestamp metadata.

### Status
- **Emerald** (`#10B981`): Success. Correct answers, completed states, positive confirmation.
- **Crimson** (`#EF4444`): Error. Wrong answers (practice mode only), destructive actions, validation failures.
- **Amber** (`#F59E0B`): Warning. Hints, streak-at-risk indicators, non-critical alerts.

### Named Rules
**The Glow-First Rule.** Depth is conveyed through neon aura, not drop shadow. Interactive elements float on a cyan glow that intensifies on hover and activates on focus. Shadows are structural only — reserved for modal backdrops and card containers. If an element needs to feel "lifted," add glow, not shadow.

**The Dark Canvas Rule.** The background is always Void Navy (`#040914`). Never use white or light backgrounds as a primary surface. Light surfaces are inverted accents (e.g., a white input field on a dark form) — they draw attention precisely because they're rare.

**The One Voice Rule.** Neon Cyan is the only color that means "you can act here." Buttons, links, focus rings, selection indicators — all cyan. Arcade Blue only appears as a gradient partner. Status colors (Emerald, Crimson, Amber) only appear as feedback after an action, never as decorative elements.

## 3. Typography

**Display/Heading Font:** Poppins (geometric sans, weights 400–800)
**Body Font:** Inter (humanist sans, weights 400–700)
**Label/Mono Font:** Inter (same family, higher weight)

**Character:** Poppins brings geometric precision and energy — its near-circular counters and clean terminals read as modern and confident. Inter grounds the system in readability — its tall x-height and open apertures make long-form text and data tables effortless to scan. The pairing works because they're distinct enough to create hierarchy (geometric vs. humanist) without fighting for attention.

### Hierarchy
- **Display** (Poppins 700, clamp(2rem, 5vw, 3.5rem), 1.15): Hero moments — student dashboard greeting, completion celebration screens. Letter-spacing tightened to -0.02em for impact.
- **Headline** (Poppins 600, 1.5rem/24px, 1.25): Page and section headings. Carries the geometric personality without competing with Display.
- **Title** (Poppins 500, 1.125rem/18px, 1.3): Card titles, modal headers, panel labels. The workhorse heading — present but not dominant.
- **Body** (Inter 400, 0.875rem–1rem / 14px–16px, 1.6): All running text, descriptions, question stems, answer options. Max line length 65–75ch on prose; tables and data can run denser. Base size adjustable via `data-font-size` on `<html>` (14px/16px/18px) for accessibility.
- **Label** (Inter 500, 0.75rem–0.875rem / 12px–14px, 1.4, +0.01em tracking): Form labels, button text, stat captions, badge text. Slightly tracked for clarity at small sizes. Uppercase reserved for overline-style metadata only.

### Named Rules
**The Geometric Voice Rule.** Poppins speaks only in headings. Body text is always Inter. Never set running text in Poppins or headings in Inter — the distinction is the hierarchy.

**The Body-Readable Rule.** No body text below 14px (0.875rem). Students as young as 9 read this interface. Small labels (12px) are acceptable only for tertiary metadata like timestamps.

## 4. Elevation

UniMath uses a **glow-driven elevation model**. Traditional box-shadows are structural only — reserved for modal backdrops and the card container layer. Interactive depth is conveyed through neon glow intensification: elements "lift" by brightening their aura, not by casting darker shadows.

This is a deliberate inversion of Material-like elevation. In a dark interface, dark shadows disappear into the background. Cyan glow reads clearly against void navy at any elevation.

### Shadow Vocabulary
- **Card Container** (`box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5)`): The only structural shadow. Used on `.glass` cards and modal panels to separate them from the background. Dark and diffuse — reads as separation, not as "lift."
- **Glow Rest** (`box-shadow: 0 0 20px rgba(0, 229, 255, 0.35)`): Default state for primary buttons and active elements. Visible but not shouting.
- **Glow Hover** (`box-shadow: 0 0 30px rgba(0, 229, 255, 0.5)`): Hover state. Brighter, wider — the element feels closer.
- **Glow Active** (`box-shadow: 0 0 15px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 119, 255, 0.5)`): Focus and active states. Cyan + arcade blue together — maximum presence.

### Named Rules
**The Neon Depth Rule.** If an element needs to feel elevated, intensify its glow — never darken its shadow. Shadows are structural separators only. Glow is the depth language.

**The Flat-at-Rest Rule.** Surfaces are flat at rest. Glow appears only as a response to state (hover, focus, active, selected). A button without hover is just a shape; a button with glow is an invitation.

## 5. Components

### Buttons

**Character:** Tactile and responsive. Buttons feel like physical objects — they lift on hover (translateY -2px), press on tap (translateY 0, scale 0.98), and their glow intensifies to match. Every interaction completes in 200ms ease-out.

- **Shape:** Rounded corners at the md scale (16px). No sharp corners — the radius softens the neon aesthetic without becoming playful.
- **Primary (Solid Gradient):** `background: linear-gradient(135deg, #00E5FF, #0077FF)`. White text. Glow shadow at rest, brighter on hover. Hover lifts 2px with a subtle scale bump (1.02). This is the CTA — one per view, never more than two.
- **Secondary (Outlined):** Transparent background, 1px Neon Cyan border at 50% opacity, Neon Cyan text. On hover: background fills to 10% cyan, border goes full opacity, glow appears. Used for secondary actions alongside Primary.
- **Ghost:** Fully transparent, Neon Cyan text only. On hover: background fills to 10% cyan. No border, no glow. Used for tertiary actions, navigation items, and inline links that need button affordance.
- **Danger:** Crimson background at 20% opacity, Crimson text. On hover: background deepens to 30%. Used only in confirmation modals for destructive actions.
- **Sizes:** sm (py-2 px-4, text-sm), md (py-3 px-6, text-base), lg (py-4 px-8, text-lg), xl (py-5 px-10, text-xl). Rounded scales with size (rounded-lg through rounded-2xl).

### Cards / Containers

- **Corner Style:** Rounded at lg scale (24px). Generous enough to feel premium, not so round it reads as a pill.
- **Glass Card:** `background: rgba(10, 17, 40, 0.65)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(0, 229, 255, 0.35)`, card shadow. The signature container. Used for material cards, stat panels, and elevated content areas.
- **Glass Strong:** `background: rgba(4, 9, 20, 0.85)`, `backdrop-filter: blur(20px)`. Denser, less transparent. Used for navigation bars, persistent panels, and modal content areas that need more opacity.
- **Solid Card:** `background: #0A1128` (Deep Space), no blur, 1px white/10% border. Used for data-heavy panels, tables, and admin surfaces where glass transparency would reduce readability.
- **Internal Padding:** 24px (p-6) default. 16px (p-4) for dense data panels.

### Inputs / Fields

- **Style:** White background at 90% opacity (`bg-white/90`), 1px Neon Cyan border at 30% opacity, rounded-xl (16px). Dark text (`text-gray-900`) on white field — the inversion signals "you can type here."
- **Focus:** Border shifts to full Neon Cyan, glow shadow appears. 300ms transition.
- **Error:** Border shifts to Crimson, no glow. Error message fades in below with a subtle slide-up.
- **With Icon:** Left icon at 48px padding-left. Password fields get a show/hide toggle icon on the right.

### Navigation

- **Top Bar / Sidebar:** Glass Strong background with 20px blur. Poppins 500 for nav labels, 14px. Active item: Neon Cyan text + subtle left-border glow (1px cyan line with blur). Inactive: Slate Mist text, no decoration.
- **Mobile:** Bottom sheet or hamburger drawer. Same glass background treatment. Touch targets minimum 44px.

### Progress Bar

- **Track:** Deep Space at 50% opacity, fully rounded (pill shape).
- **Fill:** Animated gradient from Arcade Blue to Emerald (or Arcade Blue to Neon Cyan for the cyan variant). Width animates on mount from 0 to target percentage over 800ms ease-out.
- **Sizes:** sm (6px height), md (10px), lg (16px). All fully rounded.

### Toast

- **Position:** Fixed, bottom-right, stacked with 8px gap.
- **Entry:** Scale (0.95→1) + fade + slide-up (20px→0). 200ms.
- **Exit:** Scale (1→0.95) + fade + slide-up (0→-10px). 150ms.
- **Styles:** Solid color backgrounds at 90% opacity with matching border. Success (Emerald), Error (Crimson), Warning (Amber with dark text), Info (Neon Cyan). Each with a Unicode icon prefix.

### Modal

- **Backdrop:** `rgba(0, 0, 0, 0.7)` + `backdrop-filter: blur(4px)`. Fades in over 200ms.
- **Panel:** Deep Space background, 1px white/10% border, rounded-2xl (24px), card shadow. Scales from 0.95→1 with 20px upward slide. 200ms ease-out.
- **Header:** Optional, with border-bottom separator (white/10%). Title in Poppins 600, 18px. Close button (✕) in Slate Mist, hover to White.
- **Body:** 24px padding (p-6). 16px (p-4) on mobile.
- **Dismiss:** Escape key closes. Click-outside on backdrop closes (unless explicitly prevented for mandatory flows like remedial).

## 6. Do's and Don'ts

### Do:
- **Do** use Neon Cyan (`#00E5FF`) as the sole interactive accent. Buttons, links, focus rings — one color, one voice.
- **Do** use `backdrop-filter: blur()` on glass surfaces. Glass without blur is just a dark transparent rectangle.
- **Do** keep glow on ≤10% of any screen by area. The Neon Cyan voice is powerful because it's rare.
- **Do** use Poppins for headings and Inter for body. The geometric-vs-humanist distinction is the typographic hierarchy.
- **Do** provide reduced-motion fallbacks for every animation. The `prefers-reduced-motion` media query in globals.css is the baseline — every new animation must respect it.
- **Do** give every interactive state a distinct visual treatment: rest, hover, focus, active, disabled. No state should look like another.
- **Do** use 8px spacing rhythm. Margins and paddings should be multiples of 8px (8, 16, 24, 32, 48, 64).
- **Do** maintain ≥4.5:1 contrast for body text. White on Void Navy passes easily; Slate Mist (`#94A3B8`) on Deep Space (`#0A1128`) is 4.6:1 — right at the line, don't go lighter.
- **Do** let students control base font size via the `data-font-size` attribute (small 14px / normal 16px / large 18px).

### Don't:
- **Don't** use white or light backgrounds as primary surfaces. The dark canvas is the identity. Light surfaces are inverted accents only (input fields, tooltips).
- **Don't** use cartoon illustrations, comic-style fonts, or pastel color palettes. This is a precision learning tool, not a children's coloring book.
- **Don't** use more than 3 colors on any single screen. Neon Cyan (action), one status color (feedback), neutrals (structure). Anything beyond that is noise.
- **Don't** use box-shadow for interactive depth. Glow is the depth language. Shadows are structural only.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards or list items. Use background tints or glow instead.
- **Don't** set body text below 14px (0.875rem). Nine-year-olds read this interface. Small labels at 12px are acceptable only for timestamp metadata.
- **Don't** use gradient text (`background-clip: text`) as a decorative treatment. The `.text-gradient` utility exists for rare brand moments only (completion screens, achievement unlocks) — never for body text or labels.
- **Don't** nest cards inside cards. If content needs grouping, use spacing and a subtle divider, not a second rounded container.
- **Don't** animate CSS layout properties (width, height, top, left). Use `transform` and `opacity` only.
- **Don't** ship an animation without checking `prefers-reduced-motion`. The globals.css baseline catches existing ones — new keyframes need their own `@media` override.
