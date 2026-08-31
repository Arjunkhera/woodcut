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

Releases are automatic. A merge to `main` publishes the version that
`packages/woodcut/package.json` names, if npm does not hold it yet.

1. Bump `version` in `packages/woodcut/package.json` (semver).
2. Open a pull request and merge it to `main`.
3. The `Release` workflow publishes to npm, tags the commit
   `v<version>`, and writes a GitHub release.

A merge that does not bump the version publishes nothing. Breaking
changes to the data format or to token names need a major version.

### One-time setup on npmjs.com

The workflow holds no npm token. It proves its identity with OIDC,
so the package must trust it. To set that up:

1. Open the package on npmjs.com.
2. Go to Settings, then Trusted Publisher.
3. Choose GitHub Actions and enter:
   - Organization or user: `Arjunkhera`
   - Repository: `woodcut`
   - Workflow filename: `release.yml`
   - Environment: leave it empty.
4. Save.

### Publish by hand

Do this only if the workflow is broken. It needs an npm account
without passkey-only two-factor authentication, because the npm CLI
cannot answer a passkey challenge.

```bash
cd packages/woodcut && npm publish --access public
```
