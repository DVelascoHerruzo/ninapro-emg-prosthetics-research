# Reading the Signal

A nine-minute Reveal.js presentation for the Ninapro surface-EMG project. It uses the saved Intact and Amputee experiment outputs; it does not pool those cohorts or invent metrics. The current emphasis is Amputee E1, with the prior Intact E1 run shown only as a separate descriptive comparison.

## Run

From this directory:

```bash
npm install
npm run build:data
npm run dev
```

Open the local URL printed by Vite. Use arrow keys/space to navigate, `S` for speaker notes, and `Esc` for slide overview. The deck is paced to approximately nine minutes; each slide has its speaking time in the footer.

To regenerate the presentation data and copy verified figures from current results, run `npm run build:data`. The script reads experiment JSON/CSV files from the project `results/` directory and writes `src/results.json` and `public/figures/`. To build the static production deck, run `npm run build`.

## Evidence boundary

The presentation describes offline movement-label decoding from recorded EMG. It does not demonstrate a real-time prosthetic controller, causal muscle mapping, safety, clinical efficacy, or functional benefit. Amputee E1 cross-subject testing used two held-out participants, and the logistic baseline matched the prior-majority baseline on the reported test scores.

## Responsible AI slides

The final two slides (`src/rai-slides.js`, data in `src/rai-summary.json`) summarize the Responsible AI Toolbox analysis from `notebooks/03_responsible_ai_dashboard.ipynb` (RAIInsights + ResponsibleAIDashboard: model overview/fairness, error analysis, feature importance, counterfactuals, causal analysis). `rai-summary.json` ships with placeholder `null` values; after running the notebook, copy the relevant fields from `results/metrics/EXP-007-rai-insights-movement-detection_summary.json` into `src/rai-summary.json` so the slides show real numbers instead of “—”.
