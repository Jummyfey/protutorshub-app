# Prompt for Codex

Recreate the two supplied Basic 5 Mathematics pages exactly:

1. Basic 5 Dashboard
2. Week 1: Whole Numbers, Decimals and Place Value

Use the assets in this package. Do not redraw the supplied artwork with CSS and
do not replace it with generic icons.

## Global design requirements

- Use a clean white background with rich royal purple and warm metallic gold.
- Do not introduce blue.
- Preserve the desktop compositions shown in:
  - `dashboard/composites/full-dashboard-reference.png`
  - `week1/composites/full-page-reference.png`
- Header heights, panel proportions, margins and sidebar widths must match the
  references.
- Use subtle grey borders, low-opacity shadows and rounded corners.
- Keep all headings, descriptions, progress figures and button labels as live
  HTML text. Do not use screenshots as the complete page background.
- Use semantic buttons and links with visible keyboard focus.
- Prevent overlaps at every viewport size.

## Shared header

- Use `shared/brand-crest.png` beside the live “Pro Tutors Hub” heading and
  “Primary Mathematics Learning Platform” subtitle.
- Recreate the hamburger, Previous, Next and page-title controls as real
  buttons.
- Use the exact crops only to verify dimensions and spacing.

## Basic 5 Dashboard

- Use `shared/lion-scholar-dashboard-original.png` for the closest match.
- The high-resolution alternative is
  `shared/lion-scholar-dashboard-enhanced.png`.
- Position the Academic Progress card, mascot and sidebar exactly as shown in
  the dashboard reference.
- Build the eight week cards with HTML/CSS and use the individual topic icons
  from `dashboard/transparent-png/`.
- Use the numbered badge images `week-badge-1.png` through
  `week-badge-8.png`.
- Position `dashboard/transparent-png/choose-week-route-only.png` behind the
  cards. The route is intentionally supplied as only the visible segments,
  because the week cards cover the hidden portions.
- Use `dashboard/composites/choose-week-complete-original.png` to verify card
  positions and the right-hand curve.
- Recreate the “View All Weeks” control as a real button.
- Use the five isolated Quick Access icons in
  `dashboard/transparent-png/`.
- Recreate the sweeping footer with
  `dashboard/composites/quick-access-footer-complete.png` as the exact visual
  reference. If it must scale, preserve its aspect ratio and gold upper edge.
- Use CSS/SVG for the dynamic progress bar and ring, while matching the supplied
  `progress-donut-55-percent.png`.

## Week 1 page

- Use `shared/lion-scholar-week1-original.png` for the closest match.
- The high-resolution alternative is
  `shared/lion-scholar-week1-enhanced.png`.
- Recreate the breadcrumb, Week 1 title, description and Learning Objectives as
  live text.
- Use `week1/transparent-png/learning-objectives-target.png`.
- Place `week1/transparent-png/learning-rail-only.png` behind the five activity
  cards.
- Use shields `number-shield-1.png` through `number-shield-5.png`.
- Use these medallion assets:
  - `activity-study-guide.png`
  - `activity-practice.png`
  - `activity-maths-game.png`
  - `activity-quick-quiz.png`
  - `activity-week-challenge.png`
- Use `week1/composites/learning-journey-complete-original.png` to match the
  exact curve, star-node positions and card spacing.
- Build the Real Life Connection strip with the six supplied illustration
  assets.
- Keep Progress, Rewards, Current Streak and Need Help as live sidebar cards.
- Use CSS/SVG for changing values and progress rings.

## Responsive behaviour

- Desktop: preserve the reference two-column structure.
- Tablet: move the right sidebar beneath the main content in a two-column card
  grid.
- Mobile: use one column, maintain consistent 16–20 px side padding, allow week
  and activity cards to scroll horizontally where necessary, and never shrink
  text below a readable size.
- The mascot must scale proportionally and must not cover headings, cards or
  navigation.

## Verification

- Compare the finished pages side by side with both full-page references.
- Verify the purple is not blue.
- Verify every icon uses the supplied asset.
- Verify routes remain behind cards.
- Verify no text is clipped.
- Verify all buttons work and keyboard focus is visible.
- Verify there are no overlaps at 1536 px, 1280 px, 1024 px, 768 px and 390 px
  viewport widths.
