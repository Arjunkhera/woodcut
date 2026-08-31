# woodcut — agent guide

Woodcut is a figure grammar plus zero-dependency web components for
explanatory diagrams. Figures are data; the components render them
and enforce the taste.

## Authorities

1. `GRAMMAR.md` is the law of taste. Do not contradict it in code,
   docs, or examples. Change it only when the owner locks a new rule.
2. `packages/woodcut/src/frame.js` carries the four interaction
   capabilities (cards, expand, variants, replay). Every diagram type
   extends it. Never reimplement chrome in a component.
3. `skills/figure/SKILL.md` is what consumer agents read. Keep its
   type table and data rules current with the code.

## Working here

1. Build and change components in this repo, never in a consumer
   repo. Consumers take releases.
2. Follow `CONTRIBUTING.md` for the add-a-type and release
   procedures.
3. Test in the browser through `docs/index.html` before you commit.
   The catalog is the manual test bed; keep one worked example per
   diagram type in it.
4. Components hold no copy, no hex colors, and no per-post content.
   Colors come from `--wc-*` tokens only.

## Writing standard

Write prose — docs, comments, commits — in plain, simple technical
English: short sentences, active voice, one idea per sentence,
numbered steps for procedures.

## Roadmap notes

1. Published: `@arjunkhera/woodcut` on npm (v0.2.0); the catalog is
   live at arjunkhera.github.io/woodcut/docs/.
2. A Claude Code plugin wrapper is deferred until someone asks for a
   one-command install.
3. Planned: package woodcut for SDLC tooling so design documents can
   use the same figures.
