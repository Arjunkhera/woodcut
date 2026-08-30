# woodcut

Explanatory figures for technical writing, as data.

Woodcut is a figure grammar plus a set of zero-dependency web
components. You describe a diagram as JSON; the components draw it
and give every figure the same interaction chrome:

1. **Hover cards** — any box or arrow can explain itself.
2. **Expand** — fullscreen with zoom, scroll-pan, Esc, and a
   collapsible detail rail.
3. **Variants** — one figure, several renditions, one dropdown.
4. **Replay** — scenarios step through the diagram on a numbered
   dial, with an event log. A play control animates at the reader's
   command; reduced motion gets the final frame.

The taste lives in [GRAMMAR.md](GRAMMAR.md). The components enforce
it, so every figure in every post reads the same way.

## Status

Early. Two diagram types ship today: block diagram and state
machine. Flowchart, swimlane, and sequence follow the same frame and
come next. Not yet on npm; consume it as a git dependency or copy
`packages/woodcut/src/`.

## Use it in a page

```html
<link rel="stylesheet" href="woodcut/src/tokens.css">
<script type="module" src="woodcut/src/index.js"></script>

<wc-state-machine>
  <script type="application/json">{ ...figure data... }</script>
</wc-state-machine>
```

See [docs/index.html](docs/index.html) for two complete figures. To
view it locally:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/docs/`.

## Theme it

The components read CSS variables and ship with a neutral theme
(`src/tokens.css`). Override the `--wc-*` variables to skin every
figure at once. [themes/quiet-editorial.css](themes/quiet-editorial.css)
is a complete worked example, including a dark mode.

## Let an agent draw

The [figure skill](skills/figure/SKILL.md) teaches a coding agent to
pick the right diagram type, emit correct data, and self-check
against the grammar:

```bash
npx skills add github.com/Arjunkhera/woodcut --skill figure
```

## License

MIT.
