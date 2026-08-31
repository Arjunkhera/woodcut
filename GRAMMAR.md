# The woodcut grammar

Woodcut renders explanatory figures for technical writing. The rules
below are the taste of the system. Components enforce most of them;
authors and agents supply the rest.

## The test

1. A figure earns its place only when it shows a mechanism better
   than a sentence can.
2. The reader drives. Nothing autoplays, and nothing moves on scroll.
3. Repetition is the system: the same primitives, post after post.

## Chrome

Every figure sits between two hairlines. The header row holds a mono
label ("FIG N · NAME"), an affordance hint, and the expand control.
Below the body: an italic caption that states a fact, then an
optional mono footnote with method and source.

## Voices

The serif speaks; the mono measures. Mono carries labels, values,
code, and figure meta. Diagram labels are mono at weight 500.

## Color

1. One accent family per subject.
2. Grayscale for everything that is not the point.
3. Focus by dimming: 0.28 in charts, 0.55 in diagrams. Never a new
   hue.
4. Color never carries meaning alone.

All color comes from theme tokens (`--wc-*`). A component never holds
a hex value of its own.

## Motion

1. Tokens: fast 150 ms, base 220 ms, ease-out
   cubic-bezier(.23, 1, .32, 1).
2. Animate only to explain a mechanism. Everything stays under
   300 ms.
3. Honor reduced motion: replay jumps to the final frame; transitions
   turn off.

## Interaction chrome — every diagram type, present and future

1. **Hover cards.** Any element may carry one. Optional per element.
   Never load-bearing: the figure must work with every card unread.
   A card never hides its own element, and never describes an element
   the current variant does not show.
2. **Expand.** Fullscreen with zoom, Esc to close, and a
   collapsible detail rail that keeps the last hovered description.
   Zoom runs from 10% to 600%, where 100% is the natural size of the
   figure. Fit shows the whole diagram on both axes. Cmd or Ctrl
   with the wheel zooms about the pointer. Drag pans, and so does
   the wheel. Pan never needs a mode or a toggle. The rail carries
   every section at one heading rank.
3. **Variants.** A dropdown switches renditions of one figure. One
   figure, one subject. The caption stays true for the visible
   variant. The default variant carries the argument.
4. **Replay.** Stepped figures use the numbered dial: a five-step
   window of clickable numbers with chevrons. Steps mark the diagram
   with plain numerals, and an event log keeps one line per step. A
   play control advances at 700 ms per step and stops at the end.

A new diagram type is not done until it carries all four. Extending
`WoodcutFigure` is how it carries them.

## Diagram grammar

1. Boxes: 1.4 px stroke, radius 6. State pills: half-height radius;
   terminal states wear a double ring. Focus boxes: panel fill,
   accent stroke.
2. Arrows: 1.4 px with small solid heads. Returns are dashed. Dashed
   borders group; adjacency relates without arrows.
3. Each type answers one question. Block = where. Flowchart = which
   way. State machine = what can happen. Swimlane = who. Sequence =
   in what order. Pick the type by the question the prose asks.

## Never

No legends where labels fit. No color-only meaning. No autoplay. No
scroll hijacking. No 3-d charts. No pie charts. No decoration
gradients. No emoji glyphs.
