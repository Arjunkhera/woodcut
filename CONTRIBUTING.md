# Contributing to woodcut

Woodcut grows upstream-first. A reusable component is built here,
released, and then consumed by the projects that need it. A consumer
repo never keeps its own copy of a reusable figure.

## Add a diagram type

1. Read `GRAMMAR.md`. It is the authority on taste.
2. Extend `WoodcutFigure` in a new file under `packages/woodcut/src/`.
   The frame gives you hover cards, fullscreen expand with the detail
   rail and zoom, the variant dropdown, and scenario replay. A new
   type is not done until all four work.
3. Reuse before you write. Flowchart and swimlane are thin extensions
   of the block-diagram renderer. Check whether your type is too.
4. Take figure content as data. A component never holds copy, colors,
   or coordinates of its own. Colors come only from `--wc-*` tokens.
5. Register the element in `src/index.js` with a `wc-` tag.
6. Add a worked example to `docs/index.html`. The catalog is both the
   documentation and the manual test bed.
7. Update the type table in `skills/figure/SKILL.md` so agents can
   pick the new type.

## Test

1. Serve the repo root:

   ```bash
   python3 -m http.server 8080
   ```

2. Open `http://localhost:8080/docs/` and exercise every capability:
   hover, expand, Esc, the rail collapse, variants, and replay.
3. Test zoom in the fullscreen view. Check the buttons, `fit`,
   cmd or ctrl with the wheel, and the keys `+`, `-`, `0`, `1`.
   `fit` must show the whole diagram on both axes.
4. Add the new type to the table of contents in `docs/index.html`.
5. Check the dark theme with the toggle, and check
   `prefers-reduced-motion` (replay must jump to the final frame).
6. Check a narrow window. The rail starts collapsed under 640 px.

## Release

1. Bump `version` in `packages/woodcut/package.json` (semver).
2. Commit, then tag:

   ```bash
   git tag v<version> && git push --tags
   ```

3. Publish (once the package is on npm):

   ```bash
   cd packages/woodcut && npm publish --access public
   ```

4. Consumers upgrade by bumping the dependency. Breaking changes to
   the data format or token names require a major version.
