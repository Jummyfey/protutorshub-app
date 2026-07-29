# Pro Tutors Hub — Basic 6 Asset Pack

This pack contains the picture assets needed to reproduce the attached Basic 6 dashboard and weekly lesson page. All assets use the same white, royal-purple and metallic-gold visual system. The icons, decorations and mascots are transparent PNGs; the two scenic illustrations are full-width background PNGs.

## Mascots

| File | Intended placement |
|---|---|
| `mascots/eagle-dashboard-trophy.png` | Upper-right dashboard hero, above the milestone section |
| `mascots/eagle-lesson-flag.png` | Weekly lesson hero, placed at the mountain summit |

## Backgrounds

| File | Intended placement |
|---|---|
| `backgrounds/dashboard-milestone-route-13-positions.png` | Background of the 13-week Learning Milestones panel; it contains seven upper and six lower route sockets |
| `backgrounds/lesson-mountain-gold-path.png` | Central weekly-page mountain and gold-edged learning path |

## Decorations

| File | Intended placement |
|---|---|
| `decorations/pro-tutors-crest.png` | Header brand crest |
| `decorations/end-of-term-flag.png` | Finish marker beside Week 13; never place it over Week 7 |
| `decorations/champion-trophy-laurels.png` | Champion/reward emphasis |
| `decorations/learning-mountain-emblem.png` | “Learning Milestones” heading icon |
| `decorations/purple-gold-wave.png` | Dashboard corner/footer wave decoration |
| `decorations/gold-constellation.png` | Sparse hero-area decoration |
| `decorations/milestone-badge-blank.png` | Reusable circular week-number badge |
| `decorations/points-star-hexagon.png` | Points/reward badge |
| `decorations/gold-compass.png` | Navigation/back-to-weeks emblem |

## Reusable interface icons

| File | Use |
|---|---|
| `icons/study-book.png` | Study Guide |
| `icons/practice-checklist-pencil.png` | Practice |
| `icons/maths-game-controller.png` | Maths Game |
| `icons/quick-quiz-target.png` | Quick Quiz |
| `icons/week-challenge-trophy.png` | Week Challenge |
| `icons/current-streak-flame.png` | Current Streak |
| `icons/rewards-gift.png` | Rewards |
| `icons/help-headset.png` | Need Help |
| `icons/real-life-lightbulb.png` | Real Life Connection |
| `icons/counting-fruit-apple.png` | Counting fruits |
| `icons/counting-pencil.png` | Counting pencils |
| `icons/counting-steps-blocks.png` | Counting steps |
| `icons/counting-toy-teddy.png` | Counting toys |
| `icons/counting-people-bus.png` | Counting people/bus activity |
| `icons/counting-people-group.png` | Counting people |
| `icons/rewards-medal.png` | Rewards/achievement |

## Implementation notes

- Build all text, buttons, cards, progress bars, donut charts, day circles, separators and responsive layout in HTML/CSS/React. Do not bake live data into a bitmap.
- Use `object-fit: contain` for mascots, decorations and icons.
- Keep transparent assets above the layout with `pointer-events: none` unless the asset itself is interactive.
- Week-page layer order: mountain background → learning path markers → eagle mascot → activity cards → live text and controls.
- Dashboard layer order: milestone background → week cards and numbered badges → end-of-term flag → live text and controls.
- The end-of-term flag belongs only in the lower-right finish zone beside Week 13. It must not touch or cover Week 7.
- Preserve the reference palette: white/ivory, deep royal purple, violet and warm metallic gold. Do not introduce blue.

