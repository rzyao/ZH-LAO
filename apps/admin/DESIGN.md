# DESIGN.md — Enterprise SaaS

> Clean authority. Data-dense but never cluttered. The kind of product a CFO trusts and an intern can navigate.

---

## 1. Design Overview

**Product type:** B2B SaaS dashboard — admin panels, analytics, workflow tools
**Target audience:** Business professionals (25-55), daily power users and occasional stakeholders
**Design philosophy:** Information hierarchy is everything. The interface disappears — the data speaks. Every pixel serves comprehension, not decoration. Quiet confidence over flashy delight.
**Personality keywords:** Trustworthy, efficient, precise, calm, professional
**Reference products:** Linear, Notion, Stripe Dashboard, Vercel

### Brand Voice in UI
- **Headlines:** Direct and functional. "Team Overview" not "Meet Your Amazing Team."
- **Body text:** Concise and scannable. Sentence case. No jargon without context.
- **Microcopy:** Helpful, never clever. "Changes saved" not "Boom! You nailed it! 💥"
- **Empty states:** Instructional, not whimsical. Tell the user exactly what to do next.

---

## 2. Color Palette

### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | #2563EB | Primary actions, active nav items, links |
| `--color-primary-hover` | #1D4ED8 | Hover state for primary elements |
| `--color-primary-light` | #EFF6FF | Selected row backgrounds, active tab bg, badge bg |
| `--color-primary-dark` | #1E40AF | Text on primary-light backgrounds |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | #FAFAFA | Page background behind all content |
| `--color-surface` | #FFFFFF | Cards, panels, modals, table backgrounds |
| `--color-surface-secondary` | #F5F5F5 | Nested surfaces, sidebar background |
| `--color-border` | #E5E7EB | Standard borders, dividers, table lines |
| `--color-border-strong` | #D1D5DB | Emphasized borders, input borders |
| `--color-text-primary` | #111827 | Headings, table headers, important labels |
| `--color-text-secondary` | #4B5563 | Body text, descriptions, secondary info |
| `--color-text-muted` | #9CA3AF | Placeholders, timestamps, metadata |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | #059669 | Confirmations, positive metrics, "active" badges |
| `--color-success-light` | #ECFDF5 | Success banner bg, positive badge bg |
| `--color-warning` | #D97706 | Caution states, approaching limits, pending |
| `--color-warning-light` | #FFFBEB | Warning banner bg, pending badge bg |
| `--color-error` | #DC2626 | Errors, negative metrics, destructive actions |
| `--color-error-light` | #FEF2F2 | Error banner bg, negative badge bg |
| `--color-info` | #2563EB | Informational banners, tips (shares primary blue) |

### Dark Mode
| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | #FAFAFA | #0F0F0F |
| `--color-surface` | #FFFFFF | #1A1A1A |
| `--color-surface-secondary` | #F5F5F5 | #242424 |
| `--color-border` | #E5E7EB | #2E2E2E |
| `--color-text-primary` | #111827 | #F9FAFB |
| `--color-text-secondary` | #4B5563 | #9CA3AF |
| `--color-text-muted` | #9CA3AF | #6B7280 |

### Color Rules
- Primary blue is reserved for interactive elements and active states — never decorative.
- Semantic colors are used only for their intended meaning. Green = success. Red = error. No exceptions.
- Badges use the `-light` variant as background with the main semantic color as text.
- In dark mode, surface colors get lighter (not inverted). Brand colors stay the same.
- Maximum 2 accent colors visible at any time in a single view.

---

## 3. Typography

### Font Stack
- **Headings & Body:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Monospace:** "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace
- **Why Inter:** Optimized for screens, excellent tabular figures for data-heavy UIs, massive weight range. It's not a "creative" choice — it's an engineering choice.

### Type Scale
| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 30px | 700 | 1.20 | -0.5px | Dashboard hero metrics only |
| H1 | 24px | 600 | 1.25 | -0.3px | Page titles |
| H2 | 20px | 600 | 1.30 | -0.2px | Section headings |
| H3 | 16px | 600 | 1.40 | 0px | Card titles, panel headers |
| H4 | 14px | 600 | 1.40 | 0px | Sub-labels, column headers |
| Body | 14px | 400 | 1.60 | 0px | Default text, descriptions |
| Small | 13px | 400 | 1.50 | 0px | Helper text, metadata |
| Tiny | 12px | 500 | 1.40 | 0.2px | Badges, overlines, tags |
| Mono | 13px | 400 | 1.50 | 0px | Code, IDs, technical values |

### Typography Rules
- 14px is the minimum for body text. 12px only for badges, tags, and fine print.
- Headings use negative letter-spacing to feel tighter. Body uses 0. Small text uses positive to stay legible.
- Maximum line width: 680px (approximately 70 characters). Tables are exempt.
- Tabular figures (`font-variant-numeric: tabular-nums`) for all numbers in tables and metrics.
- Sentence case everywhere. Title Case only for proper nouns and product names.
- Bold (600) is for hierarchy — never use it for emphasis within body text. Use color or italics instead.

---

## 4. Component Styles

### Buttons
**Primary**
```
Background: var(--color-primary) → #2563EB
Text: #FFFFFF
Padding: 8px 16px
Border-radius: 6px
Font: 14px/500 Inter
Hover: #1D4ED8, cursor pointer
Active: #1E40AF, scale(0.98)
Disabled: opacity 0.5, cursor not-allowed
Focus-visible: 2px solid #2563EB, 2px offset
Min-height: 36px
```

**Secondary**
```
Background: transparent
Border: 1px solid var(--color-border-strong) → #D1D5DB
Text: var(--color-text-primary) → #111827
Padding: 8px 16px
Border-radius: 6px
Font: 14px/500 Inter
Hover: var(--color-surface-secondary) → #F5F5F5 bg
Active: #E5E7EB bg
```

**Ghost**
```
Background: transparent
Border: none
Text: var(--color-text-secondary) → #4B5563
Padding: 8px 12px
Hover: var(--color-surface-secondary) → #F5F5F5 bg
```

**Destructive**
```
Background: var(--color-error) → #DC2626
Text: #FFFFFF
Same dimensions as Primary
Hover: #B91C1C
```

**Icon Button**
```
Size: 36px × 36px (or 32px compact)
Icon: 16px (or 14px compact)
Border-radius: 6px
Background: transparent
Hover: var(--color-surface-secondary) bg
```

### Button Rules
- One primary button per view section. Multiple secondaries are fine.
- Destructive actions always require a confirmation dialog.
- Button labels are verbs: "Save", "Export", "Delete" — not "OK" or "Submit".
- Icon-only buttons must have `aria-label` and a tooltip on hover.
- Minimum touch target: 36px height desktop, 44px mobile.
- Button groups: 8px gap, no separator borders.

### Inputs
```
Background: var(--color-surface) → #FFFFFF
Border: 1px solid var(--color-border-strong) → #D1D5DB
Border-radius: 6px
Padding: 8px 12px
Height: 36px
Font: 14px/400 Inter
Color: var(--color-text-primary)
Placeholder: var(--color-text-muted) → #9CA3AF
Focus: border var(--color-primary), ring 0 0 0 3px rgba(37,99,235,0.1)
Error: border var(--color-error), ring 0 0 0 3px rgba(220,38,38,0.1)
Error text: 13px var(--color-error), 4px below input
Disabled: var(--color-bg) background, 0.6 opacity text
```

### Input Rules
- Labels above inputs, never floating or inline.
- Labels: 14px/500, var(--color-text-primary). Required indicator: red asterisk after label.
- Helper text below input: 13px, var(--color-text-muted). Appears before error state.
- Error messages replace helper text (same position), never both visible.
- Select dropdowns: same styling as inputs, with 16px chevron-down icon right-aligned.

### Cards
```
Background: var(--color-surface) → #FFFFFF
Border: 1px solid var(--color-border) → #E5E7EB
Border-radius: 8px
Padding: 24px (desktop), 16px (mobile)
Shadow: none at rest
Hover (if interactive): border-color var(--color-border-strong), shadow 0 1px 3px rgba(0,0,0,0.04)
```

### Card Rules
- Cards are containers, not decorations. If content doesn't need isolation, don't use a card.
- Card headers: 16px/600 title + optional 13px muted description below.
- Card footers: separated by 1px border-top, 16px padding-top, right-aligned actions.
- Nested cards are prohibited. Use sections with borders instead.

### Tables
```
Header bg: var(--color-surface-secondary) → #F5F5F5
Header text: 12px/500, var(--color-text-muted), uppercase, letter-spacing 0.5px
Row border: 1px solid var(--color-border) bottom
Row padding: 12px 16px per cell
Row hover: var(--color-surface-secondary) bg
Selected row: var(--color-primary-light) bg
Text alignment: left for text, right for numbers, center for status badges
Monospace: IDs, codes, hashes use mono font at 13px
```

### Table Rules
- Always include column headers. No headerless tables.
- Sortable columns: indicate with a subtle up/down chevron icon.
- Row actions: right-most column, icon buttons or "..." menu.
- Pagination: bottom-right, showing "1-10 of 248" with prev/next.
- Empty table: show empty state in the table body area, not replacing the table.

### Badges / Tags
```
Padding: 2px 8px
Border-radius: 4px
Font: 12px/500 Inter
Background: semantic -light color
Text: semantic main color
Examples:
  Active: bg #ECFDF5, text #059669
  Pending: bg #FFFBEB, text #D97706
  Error: bg #FEF2F2, text #DC2626
  Default: bg #F3F4F6, text #4B5563
```

### Modals / Dialogs
```
Overlay: rgba(0, 0, 0, 0.4)
Panel: var(--color-surface), 12px radius, 24px padding
Max-width: 480px (form modals), 640px (confirmation with content)
Shadow: 0 20px 60px rgba(0, 0, 0, 0.15)
Header: 20px/600 title + optional 14px muted description
Footer: right-aligned buttons, secondary left, primary right
Close: 16px X icon, top-right, 8px from edges
Animation: fade overlay 200ms, panel translateY(8px) → 0 + fade 200ms
```

### Modal Rules
- Maximum one modal visible at a time. No stacked modals.
- Escape key and overlay click close the modal.
- Destructive modals: the confirm button is red and labels the action ("Delete project" not "OK").
- Focus traps inside modal. First focusable element receives focus on open.

### Navigation — Sidebar
```
Width: 240px (expanded), 64px (collapsed)
Background: var(--color-surface) with right border
Logo area: 48px height, 16px left padding
Nav items: 36px height, 8px 12px padding, 6px radius
Active: var(--color-primary-light) bg, var(--color-primary) text + left 2px border accent
Hover: var(--color-surface-secondary) bg
Icon: 18px, 12px right margin
Text: 14px/500 Inter
Section dividers: 1px border + 8px margin, optional 12px/500 uppercase section label
Collapse toggle: bottom of sidebar, icon button
```

### Toast / Notifications
```
Position: bottom-right, 24px from edges
Width: 360px max
Background: var(--color-surface)
Border: 1px solid var(--color-border)
Border-radius: 8px
Shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
Padding: 16px
Left accent: 3px solid semantic color (success/error/warning)
Auto-dismiss: 5s for success, persistent for errors
Stack: max 3 visible, 8px gap between, newest on top
```

---

## 5. Layout & Spacing

### Grid System
- **Max content width:** 1280px (with sidebar: 1280px + 240px sidebar)
- **Columns:** 12-column CSS Grid
- **Gutter:** 24px
- **Page margin:** 32px (desktop), 16px (mobile)
- **Sidebar + content:** sidebar is fixed, content area scrolls independently

### Spacing Scale (4px base)
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon-to-text gap, badge padding |
| `--space-2` | 8px | Related element gaps, button group spacing |
| `--space-3` | 12px | Input internal padding, compact card padding |
| `--space-4` | 16px | Standard component padding, card padding mobile |
| `--space-5` | 20px | Form field gaps |
| `--space-6` | 24px | Card padding desktop, section inner padding |
| `--space-8` | 32px | Page margins, section gaps |
| `--space-10` | 40px | Large section separators |
| `--space-12` | 48px | Page-level vertical rhythm |
| `--space-16` | 64px | Hero sections, major vertical breaks |

### Responsive Breakpoints
| Name | Width | Behavior |
|------|-------|----------|
| Mobile | < 640px | Sidebar hidden (hamburger), single column, bottom sheet for modals |
| Tablet | 640px – 1024px | Sidebar collapsed to 64px icons, 2-column grids |
| Desktop | > 1024px | Full sidebar, up to 4-column grids, side-by-side panels |

### Layout Rules
- All spacing values come from the scale. No magic numbers. `margin: 13px` is always wrong.
- Content sections stack vertically with `--space-8` (32px) between them.
- Sidebar navigation is fixed — only the content area scrolls.
- Page header (title + actions) is sticky at top with a bottom border on scroll.
- Dashboard grid: use CSS Grid with `auto-fill, minmax(320px, 1fr)` for metric cards.

---

## 6. Elevation & Depth

### Shadow Scale
| Level | Value | Usage |
|-------|-------|-------|
| None | `none` | Default cards, buttons at rest, flat UI |
| XS | `0 1px 2px rgba(0,0,0,0.04)` | Subtle lift on card hover |
| SM | `0 2px 4px rgba(0,0,0,0.06)` | Dropdowns, popovers |
| MD | `0 4px 12px rgba(0,0,0,0.08)` | Toasts, floating action buttons |
| LG | `0 8px 24px rgba(0,0,0,0.12)` | Modals, command palettes |
| XL | `0 20px 60px rgba(0,0,0,0.15)` | Full-screen overlays |

### Depth Philosophy
- **Flat by default.** Cards use borders, not shadows, for containment.
- Shadows appear only when an element is floating above the page (dropdown, modal, toast).
- Shadow intensity never exceeds 0.15 opacity. This is a quiet interface.
- In dark mode, shadows are invisible — use lighter surface colors for elevation instead.
- Z-index scale: content (0), sticky headers (10), dropdowns (20), modals (30), toasts (40).

---

## 7. Iconography & Imagery

### Icons
- **Library:** Lucide icons (consistent, open-source, pairs well with Inter)
- **Default size:** 18px (in nav and buttons), 16px (inline with text), 24px (standalone)
- **Stroke width:** 1.5px (Lucide default)
- **Color:** Inherit parent text color. Never standalone color unless semantic (green check, red x).

### Imagery
- **Product screenshots:** 8px radius, 1px border, subtle shadow (SM level)
- **Avatars:** 32px default, 24px compact, 40px profile. Circular. Fallback: initials on colored bg.
- **Avatar colors:** Deterministic based on name hash — generate from a set of 8 soft pastels.
- **Charts:** Recharts or similar. Use primary blue + a 5-color qualitative palette. Never rainbow.

### Chart Color Palette
| Index | Hex | Usage |
|-------|-----|-------|
| 1 | #2563EB | Primary data series |
| 2 | #7C3AED | Second series |
| 3 | #059669 | Third series |
| 4 | #D97706 | Fourth series |
| 5 | #DC2626 | Fifth series |

---

## 8. Animation & Motion

### Timing
| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Instant | 0ms | — | Active/pressed states, checkbox toggle |
| Micro | 100ms | ease-out | Button hover bg, focus ring appear |
| Fast | 150ms | ease-out | Tooltip show, badge pulse, row highlight |
| Standard | 200ms | ease-in-out | Dropdown open, sidebar expand, card hover lift |
| Emphasis | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Modal enter, page transition, toast slide-in |
| Exit | 150ms | ease-in | Modal exit, toast dismiss (faster than enter) |

### Motion Rules
- Entrances: fade (opacity 0→1) + translateY(8px → 0). Always both, never just one.
- Exits: fade out only. No translateY on exit — it feels sluggish.
- Sidebar collapse: 200ms width transition + icon crossfade.
- Skeleton loading: pulse animation on `--color-surface-secondary`, 1.5s duration, infinite.
- Respect `prefers-reduced-motion`: disable translateY and skeleton pulse. Keep opacity fades.
- No "bounce" or "spring" easing anywhere. This is a professional tool.

---

## 9. Design Guardrails

### Do
- Use the spacing scale for all gaps, paddings, and margins.
- Maintain 4.5:1 contrast for body text, 3:1 for large text and UI components.
- Use border-radius consistently: 6px for buttons/inputs, 8px for cards, 12px for modals.
- Right-align numbers and currency in tables (use `tabular-nums`).
- Include loading, empty, and error states for every data-driven component.
- Use `aria-label` on icon-only buttons and interactive elements without visible text.

### Don't
- Don't use more than 1 font family (Inter handles everything via weight variation).
- Don't center-align body text. Left-align always, except single-line empty state messages.
- Don't use color as the only indicator of state — pair with icons or text labels.
- Don't nest cards inside cards. Use bordered sections or list items.
- Don't exceed the shadow scale — if you need more than LG shadow, rethink the component.
- Don't use rounded-full (999px) on anything except avatars and small badges.
- Don't animate content that the user hasn't triggered (no auto-playing carousels, no pulsing CTAs).
- Don't use placeholder text as the label. Labels are always visible above the input.

---

## 10. Accessibility Standards

### Compliance Level
WCAG 2.1 AA. Every component must pass automated accessibility testing.

### Color Contrast
| Element | Minimum Ratio | Verified Pairs |
|---------|---------------|----------------|
| Body text (#4B5563) on white | 4.5:1 | 7.0:1 ✓ |
| Primary text (#111827) on white | 4.5:1 | 15.4:1 ✓ |
| Muted text (#9CA3AF) on white | 4.5:1 | 3.0:1 ✗ — use only for non-essential info |
| Primary blue (#2563EB) on white | 3:1 | 4.6:1 ✓ (AA for UI components) |
| White on primary blue (#2563EB) | 4.5:1 | 4.6:1 ✓ |
| Success text (#059669) on success-light (#ECFDF5) | 4.5:1 | 4.6:1 ✓ |
| Error text (#DC2626) on error-light (#FEF2F2) | 4.5:1 | 5.6:1 ✓ |

### Keyboard Navigation
- Tab order: sidebar nav → page header actions → main content (top-to-bottom, left-to-right)
- Focus-visible: `outline: 2px solid var(--color-primary); outline-offset: 2px`
- Skip link: hidden until focused, jumps to `<main>`. Text: "Skip to main content"
- Tables: arrow keys navigate cells, Enter activates row actions
- Modals: trap focus. Tab cycles within modal. Escape closes.

### Screen Reader
- Page titles via `<h1>` — one per page, matches the breadcrumb
- Landmark regions: `<nav>` for sidebar, `<main>` for content, `<header>` for page header
- Tables: use `<th scope="col">` for headers, `<caption>` for table description
- Status updates (save confirmations, errors) via `aria-live="polite"`
- Loading states: `aria-busy="true"` on the container, skeleton screen for visual users

### Touch Targets
- All clickable elements: minimum 36px × 36px (desktop), 44px × 44px (mobile)
- Table rows on mobile: minimum 48px height for tap targets
- Close buttons on modals/toasts: 36px × 36px minimum

---

## 11. Edge Cases & Error Patterns

### Empty States
```
Container: centered within the parent, max-width 400px
Icon: 48px, var(--color-text-muted), relevant to the content type
Headline: 16px/600, var(--color-text-primary), descriptive
Description: 14px/400, var(--color-text-secondary), 2 lines max, instructs next step
CTA: Primary button if user can take action, or secondary "Learn more" link
Spacing: 16px between icon and headline, 8px between headline and description, 24px before CTA
```
Example: "No projects yet" → "Create your first project to start tracking progress." → [+ New Project]

### Loading States
- **Initial page load:** Full skeleton screen matching content layout. Pulse animation.
- **Data refresh:** Subtle 2px progress bar at top of content area (not blocking interaction).
- **Button action:** Button shows spinner (16px) replacing text. Button disabled during load.
- **Table load:** Skeleton rows (5 rows) matching column widths.
- **Infinite scroll:** Skeleton row at bottom of list while loading next page.

### Error States
- **Form validation:** Inline below field. Red border + red text + error icon. Show on blur or submit.
- **API error (recoverable):** Toast notification, error variant, with "Retry" action button.
- **API error (fatal):** Full page error with illustration, message, and "Go back" / "Retry" buttons.
- **404:** Simple centered message: "Page not found" + link to dashboard.
- **Network offline:** Persistent banner at top: "You're offline. Changes will sync when reconnected."

### Overflow & Long Content
- **User names in tables:** Truncate with ellipsis at 200px max-width. Full name on hover tooltip.
- **Descriptions:** 2-line clamp with `-webkit-line-clamp: 2`. Full text in expandable area or tooltip.
- **Sidebar nav labels:** Truncate with ellipsis. Full text tooltip on hover. No wrapping.
- **Table on mobile:** Horizontal scroll with subtle fade-out gradient on right edge.
- **Long form content:** Scroll within a max-height container. Never let a form exceed viewport.

---

## 12. Agent Instructions

> These are explicit rules for AI coding agents generating UI with this design system.

### Before Generating
1. Read this entire DESIGN.md before writing any component code.
2. Use CSS custom properties: `var(--color-primary)`, `var(--space-4)`, etc.
3. Import Inter from Google Fonts (weight 400, 500, 600, 700) and JetBrains Mono (400).
4. Base font-size: 14px. Base line-height: 1.60. Base color: `var(--color-text-secondary)`.

### CSS Reset Baseline
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; }
body { font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: #4B5563; background: #FAFAFA; -webkit-font-smoothing: antialiased; }
```

### Component Generation Order
When building a page, generate in this order:
1. Layout shell (sidebar + content area)
2. Page header (title, breadcrumbs, actions)
3. Primary content (tables, cards, forms)
4. Empty/loading/error states
5. Interactive states (hover, focus, active)

### Agent Prompt Templates
Use these as examples when prompting an agent with this DESIGN.md:

**Dashboard page:**
"Create a dashboard with a 240px sidebar, page title 'Overview', and a grid of metric cards. Each card shows a label (12px/500 uppercase muted), a value (30px/700), and a trend indicator (green up or red down). Use the Enterprise SaaS DESIGN.md for all tokens."

**Data table:**
"Build a data table for 'Users' with columns: Name, Email, Role (badge), Status (badge), Last Active, Actions (... menu). Include sortable headers, row hover, pagination, and an empty state. Follow DESIGN.md Section 4 and 11."

**Settings form:**
"Create a settings page with sections: Profile (name, email, avatar upload), Notifications (toggle switches), and Danger Zone (delete account with confirmation modal). All inputs per DESIGN.md, destructive modal per Section 4."

### Common AI Agent Mistakes to Avoid
- Using `box-shadow` on cards at rest — this system uses borders, shadows are for floating elements only.
- Making the sidebar scrollable with the page — sidebar is fixed, content scrolls independently.
- Using 16px body text — this system uses 14px as the base for information density.
- Putting actions on the left side of modals — actions are always right-aligned, destructive leftmost.
- Using full-rounded (999px) buttons — buttons are 6px radius, not pills.
- Generating without empty and loading states — every data view needs both.
- Using `text-align: center` on table data — only status badges are centered, text is left, numbers are right.
