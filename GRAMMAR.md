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
5. One exception to the single accent: the danger token marks a
   denied or blocked element. It always comes with a dashed stroke,
   so the shape carries the meaning too. Use it for denial only.

All color comes from theme tokens (`--wc-*`). A component never holds
a hex value of its own.

## Motion

1. Tokens: fast 150 ms, base 220 ms, step 450 ms, draw 700 ms,
   ease-out cubic-bezier(.23, 1, .32, 1).
2. Animate only to explain a mechanism. Everything stays under
   300 ms, with one exception.
3. The exception: a step transition that the reader triggers may
   show movement for up to 900 ms in total. Only two motions use
   this time: an element that enters its step, and an arrow that
   draws itself. The label of a drawn arrow appears after the draw.
   Hover, expand, variants, the play control and panel changes keep
   the 300 ms limit.
4. Honor reduced motion: replay jumps to the final frame; transitions
   turn off; arrows appear drawn.

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
   The reader can also click the diagram to go one step forward,
   and use the arrow keys, Home and End while the figure has focus.

A new diagram type is not done until it carries all four. Extending
`WoodcutFigure` is how it carries them.

## Narrated walkthroughs

A scenario becomes a walkthrough when its steps carry prose, or when
it asks for reveal. Every diagram type supports it through the frame.

1. **Narration.** The panel shows the step number, a title, and one
   or two plain sentences. It sits under the diagram, which keeps the
   full width of the figure. Only a figure 1000 px wide or more puts
   it beside the diagram. It replaces the event log.
2. **Record.** A step may show a small key and value table: what the
   system holds after this step. Mark the rows the step changed. Keep
   the same keys from step to step, so the reader sees values change.
3. **Tracker.** A row of pills names every step. Done pills are
   solid, the current pill is filled with the accent, and pills still
   to come are dashed.
4. **Stage.** The active element wears an accent ring. Reached
   elements turn gray. With reveal, elements the story has not
   reached stay hidden and enter on their step. A denied element
   wears a dashed danger border, and a badge may say why.
5. **Pace.** The reader sets the pace. A walkthrough has no play
   control, and nothing moves until the reader clicks or presses a
   key.
6. **Summary.** The last step may show a summary table under the
   figure. Its rows enter one after another.

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
