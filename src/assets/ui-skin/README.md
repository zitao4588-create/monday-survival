# Monday Survival UI Skin Assets

Generated layered visual assets for the 426 x 922 mobile stage at @2x scale.

Regenerate:

```bash
pnpm skin:generate
```

These assets are presentation skin layers only. They do not include dynamic game text, numbers, event titles, choice copy, or state values.

## Raster Assets

- `desk-bg@2x.webp` - 852 x 1844, full-stage desk atmosphere.
- `header-ticket@2x.png` - 780 x 220, transparent header ticket base.
- `stat-card@2x.png` - 284 x 190, transparent reusable stat card base.
- `main-paper-round@2x.png` - 820 x 1180, transparent round-screen dossier paper base.
- `choice-ticket-green@2x.png` - 770 x 240, transparent green choice ticket base.
- `choice-ticket-yellow@2x.png` - 770 x 240, transparent yellow choice ticket base.
- `choice-ticket-red@2x.png` - 770 x 240, transparent red choice ticket base.
- `feedback-paper@2x.png` - 724 x 600, transparent feedback receipt paper base.
- `next-event-card@2x.png` - 724 x 340, transparent next-event card base.
- `result-paper@2x.png` - 780 x 1500, transparent stacked result report paper base.
- `primary-button@2x.png` - 620 x 136, transparent dark green button base.
- `secondary-button@2x.png` - 620 x 128, transparent paper button base.

## Icon Assets

Located in `icons/`:

- `water.svg`
- `alarm.svg`
- `coffee.svg`
- `train.svg`
- `energy.svg`
- `mood.svg`
- `score.svg`
- `cloud.svg`
- `check.svg`
- `result-stamp.svg`
- `result-illustration.svg`

## Dynamic Overlay Rule

React should render all labels, icons, stats, event copy, choice titles, deltas, and buttons above these assets. Keep image assets behind editable UI content.
