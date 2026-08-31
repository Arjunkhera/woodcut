---
name: figure
description: Produce an explanatory figure with woodcut web components (block diagram, state machine; more types as the library grows). Use when a post, doc, or artifact needs a diagram - "add a diagram", "show the architecture", "illustrate the flow", "visualize the lifecycle", "explain this with a figure". Emits data for the components; never hand-draws SVG.
---

# Produce a woodcut figure

Woodcut figures are data, not drawings. You choose a diagram type,
emit a JSON payload, and the component renders it on-grammar: hover
cards, fullscreen expand, variants, and scenario replay come free.

Read `GRAMMAR.md` in this repo before your first figure.

## Step 1: pick the type by the question

| The prose asks | Type | Element |
|---|---|---|
| Where does it live? What talks to what? | block diagram | `<wc-block-diagram>` |
| What can happen? What are the states? | state machine | `<wc-state-machine>` |
| Which way does it go? What decides? | flowchart | `<wc-flowchart>` |
| Who does what? Where does responsibility move? | swimlane | `<wc-swimlane>` |
| In what order? Who calls whom? | sequence | `<wc-sequence>` |

Flowchart and swimlane use the block-diagram data shape: flowchart
adds node shapes (`pill`, `diamond`, `end`); swimlane adds `lanes`.
Sequence uses actors, activations, and messages.

## Step 2: apply the test

1. Skip the figure if one sentence shows the mechanism as well.
2. One figure, one subject. Split two subjects into two figures.
3. Six to nine elements is the sweet spot. Past roughly twelve,
   split the figure or lean on the expand mode.

## Step 3: emit the data

Embed a JSON payload in the element. See `docs/index.html` for one
worked example of every type. The shape:

```html
<wc-state-machine>
  <script type="application/json">
  {
    "label": "FIG 2 · PROPOSAL LIFECYCLE",
    "hint": "pick a scenario · step or play",
    "caption": "One sentence that states a fact.",
    "variants": [ { "name": "lifecycle", "viewBox": [600, 212],
      "states": [...], "transitions": [...], "scenarios": [...] } ]
  }
  </script>
</wc-state-machine>
```

Rules for the payload:

1. Labels are short and mono-sized: state names in caps, transition
   labels lowercase, under 16 characters.
2. Cards are one or two sentences of fact. Never repeat the label.
   Never put load-bearing content in a card.
3. Captions state a fact, never a direction ("the queue holds every
   agent write", not "as shown above").
4. Scenario logs are one plain line per step, lowercase.
5. Coordinates: lay elements on a 600-wide viewBox. Keep 30 px or
   more between elements. Route edges orthogonally; enter boxes at
   edge midpoints.
6. Numbers you did not measure are sample data. Say so in the
   surrounding prose or footnote.

## Step 4: self-check before you finish

1. The default variant carries the argument on its own.
2. The caption is true for every variant.
3. No card hides its own element (cards render below or above
   automatically; check crowded bottoms).
4. Every scenario step names real element ids; a typo dims the
   element forever.
5. The figure reads correctly with zero interaction: no hover, no
   expand, no replay.
6. Labels do not collide at 600 px width.

If any check fails, fix the data, not the component.
